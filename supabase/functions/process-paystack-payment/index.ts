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
 * Initialize a payment attempt for an existing pending order.
 * Creates a payment_attempts row with the order linked, then calls
 * Paystack's transaction initialize API to get an authorization URL.
 * The customer is redirected to Paystack's hosted checkout.
 */
async function initializePayment(
  supabase: any,
  body: any,
  userId: string | null
) {
  const orderId = body?.orderId;
  const callbackUrl = body?.callbackUrl;

  if (!orderId) {
    return jsonResponse({ error: "orderId is required" }, 400);
  }
  if (!callbackUrl) {
    return jsonResponse({ error: "callbackUrl is required" }, 400);
  }

  // Fetch the order using the service role (to get all fields regardless of RLS).
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) {
    return jsonResponse({ error: "Order not found" }, 404);
  }

  if (order.payment_status === "Paid") {
    return jsonResponse({
      ok: true,
      alreadyPaid: true,
      orderId: order.id,
    });
  }

  // The orders table does not have a user_id column; use customer_email
  // which is always set when the order is created.
  const email = order.customer_email;
  if (!email) {
    return jsonResponse({ error: "Customer email not found on order" }, 400);
  }

  const amountKobo = Math.round(Number(order.total) * 100);
  if (amountKobo <= 0) {
    return jsonResponse({ error: "Invalid order amount" }, 400);
  }

  // Generate a unique reference.
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  const reference = `ukart-${ts}-${rand}`;

  // user_id is required by payment_attempts (NOT NULL + FK to auth.users).
  // The caller's JWT has already been validated by Supabase's gateway
  // (verify_jwt = true), so we extract the UUID from its sub claim.

  // Store checkout_data for order creation fallback (in case the order
  // row is lost, finalize_paystack_payment can recreate it).
  const checkoutData = {
    items: order.items,
    subtotal: order.subtotal,
    delivery_fee: order.delivery_fee,
    service_fee: order.service_fee,
    discount: order.discount,
    voucher_code: order.voucher_code,
    voucher_id: order.voucher_id,
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    alternate_phone: order.alternate_phone,
    customer_address: order.customer_address,
    landmark: order.landmark,
    delivery_zone: order.delivery_zone,
    delivery_lat: order.delivery_lat,
    delivery_lng: order.delivery_lng,
    is_first_order: order.is_first_order,
    first_order_discount: order.first_order_discount,
    referral_id: order.referral_id,
    referral_type: order.referral_type,
  };

  // Create the payment_attempts record, linked to the existing order.
  const { error: attemptError } = await supabase
    .from("payment_attempts")
    .insert({
      reference,
      user_id: userId,
      amount_kobo: amountKobo,
      currency: "NGN",
      checkout_data: checkoutData,
      status: "initialized",
      order_id: order.id,
    });

  if (attemptError) {
    console.error("[process-paystack-payment] insert attempt error:", attemptError);
    return jsonResponse({ error: "Could not create payment attempt" }, 500);
  }

  // Call Paystack initialize API.
  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: amountKobo,
      currency: "NGN",
      reference,
      callback_url: callbackUrl,
      metadata: {
        custom_fields: [
          { display_name: "Order Number", variable_name: "order_number", value: order.order_number },
          { display_name: "Customer Name", variable_name: "customer_name", value: order.customer_name || "" },
          { display_name: "Order ID", variable_name: "order_id", value: order.id },
        ],
        order_id: order.id,
      },
    }),
  });

  const paystackData = await paystackRes.json();

  if (!paystackRes.ok || !paystackData?.status || !paystackData?.data?.authorization_url) {
    console.error("[process-paystack-payment] Paystack init failed:", paystackData);
    // Mark the attempt as failed so it doesn't linger.
    await supabase
      .from("payment_attempts")
      .update({ status: "failed" })
      .eq("reference", reference);
    return jsonResponse({
      error: paystackData?.message || "Could not initialize Paystack payment",
    }, 500);
  }

  return jsonResponse({
    ok: true,
    reference,
    authorization_url: paystackData.data.authorization_url,
    access_code: paystackData.data.access_code,
  });
}

/**
 * Verify a Paystack transaction by reference.
 * Calls Paystack's verify API, validates the result against the stored
 * payment_attempt, and finalizes the order via finalize_paystack_payment.
 */
async function verifyPayment(supabase: any, body: any) {
  const reference = body?.reference;
  if (!reference) {
    return jsonResponse({ error: "reference is required" }, 400);
  }

  // Look up the payment attempt.
  const { data: attempt, error: attemptError } = await supabase
    .from("payment_attempts")
    .select("*")
    .eq("reference", reference)
    .maybeSingle();

  if (attemptError || !attempt) {
    return jsonResponse({
      ok: false,
      reason: "No payment attempt found for this reference",
    }, 200);
  }

  // If already verified and linked to an order, return idempotent success.
  if (attempt.status === "verified" && attempt.order_id) {
    return jsonResponse({
      ok: true,
      orderId: attempt.order_id,
      alreadyProcessed: true,
    });
  }

  // Call Paystack verify API.
  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
    },
  });

  const verifyData = await verifyRes.json();

  if (!verifyRes.ok || !verifyData?.status) {
    return jsonResponse({
      ok: false,
      reason: "Could not verify transaction with Paystack",
    }, 200);
  }

  const txn = verifyData.data;
  const mode = verifyData.data?.domain === "test" ? "test" : "live";

  // If Paystack says the transaction is still pending, return pending.
  if (txn.status !== "success") {
    // Mark the attempt as failed only for definitive non-success states.
    if (txn.status === "failed" || txn.status === "abandoned") {
      await supabase
        .from("payment_attempts")
        .update({ status: txn.status === "failed" ? "failed" : "abandoned" })
        .eq("reference", reference);
    }
    return jsonResponse({
      ok: false,
      pending: txn.status === "pending" || txn.status === "ongoing",
      reason: `Transaction status: ${txn.status}`,
    }, 200);
  }

  // Finalize the payment via the database function (idempotent).
  const { data: result, error: rpcError } = await supabase.rpc(
    "finalize_paystack_payment",
    {
      p_reference: reference,
      p_transaction_id: Number(txn.id),
      p_transaction_data: txn,
      p_mode: mode,
    }
  );

  if (rpcError) {
    console.error("[process-paystack-payment] finalize RPC error:", rpcError);
    return jsonResponse({
      ok: false,
      reason: "Payment verified but order finalization failed",
    }, 500);
  }

  if (result?.ok && result?.orderId) {
    // Trigger order notification (fire-and-forget).
    try {
      await supabase.functions.invoke("orderNotifications", {
        body: { type: "created", orderId: result.orderId },
      });
    } catch {}

    return jsonResponse({
      ok: true,
      orderId: result.orderId,
      alreadyProcessed: result.alreadyProcessed || false,
    });
  }

  return jsonResponse({
    ok: false,
    reason: result?.error || "Order finalization failed",
  }, 200);
}

/**
 * Abandon a checkout — mark the payment attempt as abandoned.
 * Does NOT delete the order (the customer may retry payment later).
 */
async function abandonCheckout(supabase: any, body: any) {
  const reference = body?.reference;
  const orderId = body?.orderId;

  if (reference) {
    await supabase
      .from("payment_attempts")
      .update({ status: "abandoned" })
      .eq("reference", reference)
      .neq("status", "verified");
  }

  if (orderId) {
    // Mark the order as abandoned (not cancelled — customer can retry).
    await supabase
      .from("orders")
      .update({ payment_status: "Abandoned", updated_date: new Date().toISOString() })
      .eq("id", orderId)
      .neq("payment_status", "Paid");
  }

  return jsonResponse({ ok: true });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const action = body?.action || "initialize";

    // Create a service-role client for database operations.
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Extract the authenticated user's UUID from the JWT.
    // verify_jwt = true guarantees the token is valid before this runs.
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    let userId: string | null = null;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        userId = payload?.sub || null;
      } catch {}
    }

    if (action === "initialize") {
      return await initializePayment(supabase, body, userId);
    } else if (action === "verify") {
      return await verifyPayment(supabase, body);
    } else if (action === "abandon") {
      return await abandonCheckout(supabase, body);
    }

    return jsonResponse({ error: `Unknown action: ${action}` }, 400);
  } catch (err) {
    console.error("[process-paystack-payment] error:", err);
    return jsonResponse(
      { error: err?.message || "Internal server error" },
      500
    );
  }
});
