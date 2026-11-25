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
 * Initialize a payment attempt.
 *
 * Primary path (new checkout flow): accepts `checkoutData` directly — no order
 * is created until payment succeeds. The checkout data is stored in
 * payment_attempts.checkout_data and used by finalize_paystack_payment to
 * create the order after successful payment.
 *
 * Legacy path (retry on existing order): accepts `orderId` for backward
 * compatibility with any existing awaiting_payment orders.
 */
async function initializePayment(
  supabase: any,
  body: any,
  userId: string | null
) {
  const orderId = body?.orderId;
  const checkoutData = body?.checkoutData;
  const callbackUrl = body?.callbackUrl;

  if (!callbackUrl) {
    return jsonResponse({ error: "callbackUrl is required" }, 400);
  }

  let email: string | null = null;
  let amountKobo = 0;
  let storedCheckoutData: any = null;
  let orderNumber: string | null = null;
  let linkedOrderId: string | null = null;

  if (orderId) {
    // Legacy path: retry on an existing pending order.
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      return jsonResponse({ error: "Order not found" }, 404);
    }

    if (order.payment_status === "Paid") {
      return jsonResponse({ ok: true, alreadyPaid: true, orderId: order.id });
    }

    email = order.customer_email;
    amountKobo = Math.round(Number(order.total) * 100);
    orderNumber = order.order_number;
    linkedOrderId = order.id;
    storedCheckoutData = {
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
  } else if (checkoutData) {
    // New path: checkout data passed directly, no pre-created order.
    email = checkoutData.customer_email || null;
    amountKobo = Math.round(Number(checkoutData.total) * 100);
    storedCheckoutData = checkoutData;
    linkedOrderId = null;
  } else {
    return jsonResponse({ error: "checkoutData or orderId is required" }, 400);
  }

  if (!email) {
    return jsonResponse({ error: "Customer email is required" }, 400);
  }

  if (amountKobo <= 0) {
    return jsonResponse({ error: "Invalid amount" }, 400);
  }

  // Generate a unique reference.
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  const reference = `ukart-${ts}-${rand}`;

  // user_id is required by payment_attempts (NOT NULL + FK to auth.users).
  // The caller's JWT has already been validated by Supabase's gateway
  // (verify_jwt = true), so we extract the UUID from its sub claim.
  const { error: attemptError } = await supabase
    .from("payment_attempts")
    .insert({
      reference,
      user_id: userId,
      amount_kobo: amountKobo,
      currency: "NGN",
      checkout_data: storedCheckoutData,
      status: "initialized",
      order_id: linkedOrderId,
    });

  if (attemptError) {
    console.error("[process-paystack-payment] insert attempt error:", attemptError);
    return jsonResponse({ error: "Could not create payment attempt" }, 500);
  }

  // Build Paystack metadata.
  const customFields: any[] = [
    { display_name: "Customer Name", variable_name: "customer_name", value: storedCheckoutData.customer_name || "" },
  ];
  if (orderNumber) {
    customFields.push({ display_name: "Order Number", variable_name: "order_number", value: orderNumber });
  }
  const metadata: any = { custom_fields: customFields };
  if (linkedOrderId) {
    metadata.order_id = linkedOrderId;
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
      metadata,
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
  // Pass transaction ID as string to avoid float64 precision loss for
  // large Paystack transaction IDs.
  const { data: result, error: rpcError } = await supabase.rpc(
    "finalize_paystack_payment",
    {
      p_reference: reference,
      p_transaction_id: String(txn.id),
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
 * If an orderId is provided (legacy flow), also mark that order as abandoned.
 */
async function abandonCheckout(supabase: any, body: any) {
  const reference = body?.reference;
  const orderId = body?.orderId;

  if (reference) {
    // The payment_attempts.status CHECK constraint only allows
    // 'initialized', 'verified', 'failed'. Use 'failed' for abandoned
    // checkouts so the row is preserved for reconciliation without
    // violating the constraint.
    await supabase
      .from("payment_attempts")
      .update({ status: "failed" })
      .eq("reference", reference)
      .neq("status", "verified");
  }

  if (orderId) {
    // Legacy: mark the pre-created order as abandoned.
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
