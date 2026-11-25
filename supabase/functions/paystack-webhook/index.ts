import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Verify the Paystack webhook signature using HMAC SHA512.
 * Paystack sends the signature in the `x-paystack-signature` header.
 */
function verifySignature(payload: string, signature: string | null): boolean {
  if (!signature || !PAYSTACK_SECRET) return false;

  // Use the Web Crypto API for HMAC verification.
  const key = PAYSTACK_SECRET;
  // Deno's crypto.subtle for HMAC SHA512.
  const enc = new TextEncoder();
  const keyData = enc.encode(key);
  const msgData = enc.encode(payload);

  return (async () => {
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"]
    );
    const sigBuf = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
    const sigHex = Array.from(new Uint8Array(sigBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return sigHex === signature.toLowerCase();
  })();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // Verify the webhook signature.
    const isValid = await verifySignature(payload, signature);
    if (!isValid) {
      console.error("[paystack-webhook] Invalid signature");
      return jsonResponse({ error: "Invalid signature" }, 401);
    }

    const event = JSON.parse(payload);
    const eventType = event?.event;

    // Only process charge.success events.
    if (eventType !== "charge.success") {
      // Acknowledge other events (e.g. transfer events) without processing.
      return jsonResponse({ ok: true, ignored: eventType });
    }

    const txn = event?.data;
    if (!txn || !txn.reference) {
      console.error("[paystack-webhook] No transaction data in event");
      return jsonResponse({ error: "No transaction data" }, 400);
    }

    const reference = txn.reference;
    const transactionId = String(txn.id);
    const mode = txn.domain === "test" ? "test" : "live";

    // Create a service-role client.
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Check if a payment_attempt exists for this reference.
    const { data: attempt, error: attemptError } = await supabase
      .from("payment_attempts")
      .select("*")
      .eq("reference", reference)
      .maybeSingle();

    if (attemptError) {
      console.error("[paystack-webhook] Error looking up attempt:", attemptError);
      return jsonResponse({ error: "Database error" }, 500);
    }

    if (!attempt) {
      // No matching payment attempt — log and acknowledge (200) so Paystack
      // doesn't keep retrying. This should not happen if the frontend
      // always creates an attempt before redirecting to Paystack.
      console.error(`[paystack-webhook] Webhook reference ${reference} has no matching payment attempt`);
      return jsonResponse({
        ok: true,
        warning: "No matching payment attempt for this reference",
        reference,
      }, 200);
    }

    // Finalize the payment via the database function (idempotent).
    const { data: result, error: rpcError } = await supabase.rpc(
      "finalize_paystack_payment",
      {
        p_reference: reference,
        p_transaction_id: transactionId,
        p_transaction_data: txn,
        p_mode: mode,
      }
    );

    if (rpcError) {
      console.error("[paystack-webhook] finalize RPC error:", rpcError);
      return jsonResponse({ error: "Finalization failed" }, 500);
    }

    if (result?.ok && result?.orderId) {
      // Trigger order notification only if this is a new order
      // (not already processed).
      if (!result.alreadyProcessed) {
        try {
          await supabase.functions.invoke("orderNotifications", {
            body: { type: "created", orderId: result.orderId },
          });
        } catch {}
      }
      return jsonResponse({ ok: true, orderId: result.orderId });
    }

    // If finalization returned an error, log it but still return 200
    // so Paystack doesn't retry indefinitely — the callback verification
    // path can still recover the order.
    console.error(`[paystack-webhook] Finalization returned error for ${reference}:`, result?.error);
    return jsonResponse({ ok: false, error: result?.error || "Finalization failed" }, 200);
  } catch (err) {
    console.error("[paystack-webhook] error:", err);
    return jsonResponse(
      { error: err?.message || "Internal server error" },
      500
    );
  }
});
