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

const MINIMUM_ORDER = 5000;

const DEFAULT_DELIVERY_SETTINGS = {
  island_fee: 3000,
  mainland_fee: 5000,
  mainland_threshold: 10000,
  discounts_enabled: true,
  first_order_discount_percent: 65,
  repeat_discount_percent: 49.999,
  first_order_min_subtotal: 4900,
};

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Service fee ladder — must mirror src/lib/fees.js */
function serverServiceFee(subtotal: number): number {
  if (subtotal < 5000) return 0;
  if (subtotal <= 50000) return 310;
  return 490;
}

/**
 * The client may send ids as strings or, for some cart shapes, as arrays of
 * fragments. Normalize both into a single id string.
 */
function normalizeId(value: unknown): string {
  if (Array.isArray(value)) {
    if (value.length === 5) return value.join("-");
    return String(value[0] ?? "");
  }
  return value == null ? "" : String(value);
}

/** Smallest price this catalogue row can legitimately be sold at. */
function minPriceFromRow(row: any): number | null {
  const candidates: number[] = [];
  const push = (v: unknown) => {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) candidates.push(n);
  };
  push(row?.price);
  push(row?.starting_price);
  const collections = [row?.variants, row?.sizes];
  for (const collection of collections) {
    if (Array.isArray(collection)) {
      for (const entry of collection) push(entry?.price);
    }
  }
  if (!candidates.length) return null;
  return Math.min(...candidates);
}

/**
 * Recompute the amount to charge from server-held data.
 *
 * The browser is untrusted: it may send any subtotal, delivery fee, service
 * fee, discount or total it likes. We therefore
 *   - rebuild a price floor for the cart from the catalogue,
 *   - recompute the service fee and the smallest legal delivery fee,
 *   - cap the discount at the voucher / referral / first-order values the
 *     database actually holds for this caller,
 *   - and derive the charged total from those validated components.
 */
async function computeTrustedAmount(
  supabase: any,
  checkoutData: any,
  userId: string | null,
  email: string | null
): Promise<{ error?: string; amountKobo?: number; normalized?: any }> {
  const items = Array.isArray(checkoutData?.items) ? checkoutData.items : [];
  if (!items.length) return { error: "Your cart is empty" };

  // 1. Catalogue price floor.
  const productIds = new Set<string>();
  const packageIds = new Set<string>();
  for (const item of items) {
    const quantity = num(item?.quantity, 0);
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 100) {
      return { error: "Invalid item quantity in cart" };
    }
    const pid = normalizeId(item?.product_id);
    const kid = normalizeId(item?.package_id);
    if (pid) productIds.add(pid);
    if (kid) packageIds.add(kid);
  }

  const priceById = new Map<string, number>();
  if (productIds.size) {
    const { data } = await supabase
      .from("products")
      .select("id, price, variants")
      .in("id", [...productIds]);
    for (const row of data || []) {
      const min = minPriceFromRow(row);
      if (min !== null) priceById.set(String(row.id), min);
    }
  }
  if (packageIds.size) {
    const { data } = await supabase
      .from("packages")
      .select("id, starting_price, sizes")
      .in("id", [...packageIds]);
    for (const row of data || []) {
      const min = minPriceFromRow(row);
      if (min !== null) priceById.set(String(row.id), min);
    }
  }

  let subtotalFloor = 0;
  for (const item of items) {
    const quantity = num(item?.quantity, 0);
    const id = normalizeId(item?.package_id) || normalizeId(item?.product_id);
    const catalogPrice = id ? priceById.get(id) : undefined;
    if (catalogPrice !== undefined) subtotalFloor += catalogPrice * quantity;
  }

  const subtotal = Math.max(num(checkoutData?.subtotal, 0), subtotalFloor);
  if (subtotal < MINIMUM_ORDER) {
    return { error: `Minimum order is NGN ${MINIMUM_ORDER.toLocaleString()}` };
  }

  // 2. Service fee — recomputed, never below the server ladder.
  const serviceFee = Math.max(num(checkoutData?.service_fee, 0), serverServiceFee(subtotal));

  // 3. Delivery fee — never below the most heavily discounted legal fee.
  const { data: deliveryRows } = await supabase
    .from("delivery_settings")
    .select("*")
    .limit(1);
  const ds = { ...DEFAULT_DELIVERY_SETTINGS } as any;
  const rawDs = deliveryRows?.[0];
  if (rawDs) {
    for (const key of Object.keys(DEFAULT_DELIVERY_SETTINGS)) {
      const v = rawDs[key];
      if (v !== undefined && v !== null && v !== "") ds[key] = v;
    }
  }
  const minBase = Math.min(num(ds.island_fee), num(ds.mainland_fee));
  const maxPercent =
    ds.discounts_enabled === false
      ? 0
      : Math.max(num(ds.first_order_discount_percent), num(ds.repeat_discount_percent));
  const deliveryFloor = Math.round(minBase * (1 - maxPercent / 100));
  const deliveryFee = Math.max(num(checkoutData?.delivery_fee, 0), deliveryFloor);

  // 4. Discount — capped at what the database says this caller is entitled to.
  let allowedDiscount = 0;

  // 4a. First-order discount: only when this customer has no paid order yet.
  const { data: promoRows } = await supabase
    .from("promotion_settings")
    .select("first_order_enabled, first_order_discount")
    .limit(1);
  const promo = promoRows?.[0];
  if (promo && promo.first_order_enabled !== false && email) {
    const { data: paidOrders } = await supabase
      .from("orders")
      .select("id")
      .ilike("customer_email", email)
      .ilike("payment_status", "paid")
      .limit(1);
    if (!paidOrders || paidOrders.length === 0) {
      allowedDiscount += num(promo.first_order_discount, 0);
    }
  }

  // 4b. Referral reward: only a referral row that belongs to this user and
  //     has not been paid out yet.
  const referralId = checkoutData?.referral_id;
  if (referralId && userId) {
    const { data: referral } = await supabase
      .from("referrals")
      .select("*")
      .eq("id", referralId)
      .maybeSingle();
    if (referral) {
      const isReferred = referral.referred_user_id === userId && referral.referred_rewarded !== true;
      const isReferrer = referral.referrer_id === userId && referral.referrer_rewarded !== true;
      if (isReferred || isReferrer) allowedDiscount += num(referral.reward_amount, 0);
    }
  }

  // 4c. Voucher: re-read from the database, never trust the client's value.
  const voucherCode = checkoutData?.voucher_code;
  if (voucherCode) {
    const { data: voucher } = await supabase
      .from("vouchers")
      .select("*")
      .ilike("code", String(voucherCode))
      .maybeSingle();
    const notExpired =
      !voucher?.expiry_date || new Date(voucher.expiry_date).getTime() >= Date.now();
    const usesLeft =
      voucher?.max_uses == null || num(voucher.uses, 0) < num(voucher.max_uses, 0);
    const assignedOk =
      !voucher?.assigned_to_email ||
      (email && String(voucher.assigned_to_email).toLowerCase() === email.toLowerCase());
    if (voucher && voucher.active !== false && notExpired && usesLeft && assignedOk) {
      allowedDiscount +=
        voucher.discount_type === "fixed_amount"
          ? num(voucher.discount_amount, 0)
          : Math.round((subtotal * num(voucher.discount_percent, 0)) / 100);
    }
  }

  const discount = Math.max(
    0,
    Math.min(num(checkoutData?.discount, 0), allowedDiscount, subtotal)
  );

  const total = subtotal - discount + deliveryFee + serviceFee;
  if (!(total > 0)) return { error: "Invalid amount" };

  return {
    amountKobo: Math.round(total * 100),
    normalized: {
      ...checkoutData,
      subtotal,
      service_fee: serviceFee,
      delivery_fee: deliveryFee,
      discount,
      total,
    },
  };
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
    // The amount is recomputed from server-held catalogue prices, fee rules and
    // the discounts this caller is actually entitled to — the browser's own
    // totals are only ever used as a lower bound.
    email = checkoutData.customer_email || null;
    const priced = await computeTrustedAmount(supabase, checkoutData, userId, email);
    if (priced.error) {
      return jsonResponse({ error: priced.error }, 400);
    }
    amountKobo = priced.amountKobo as number;
    storedCheckoutData = priced.normalized;
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
