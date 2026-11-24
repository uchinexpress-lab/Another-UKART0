
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return respond({ error: "Authentication required" }, 401);

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return respond({ error: "Invalid session" }, 401);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const action = body.action;

    if (action === "initialize") {
      const checkout = body.checkout;

      if (!checkout || !Array.isArray(checkout.items) || checkout.items.length === 0) {
        return respond({ error: "Your cart is empty" }, 400);
      }

      const amountNaira = Number(checkout.total);
      if (!Number.isFinite(amountNaira) || amountNaira <= 0) {
        return respond({ error: "Invalid checkout amount" }, 400);
      }

      if (!user.email) return respond({ error: "Customer email is missing" }, 400);

      // Keep the checkout snapshot server-side. It is not an order.
      const reference = `ukart-${crypto.randomUUID()}`;
      const amountKobo = Math.round(amountNaira * 100);

      const { error: insertError } = await admin
        .from("payment_attempts")
        .insert({
          reference,
          user_id: user.id,
          amount_kobo: amountKobo,
          currency: "NGN",
          checkout_data: checkout,
          status: "initialized",
        });

      if (insertError) {
        console.error("Payment attempt insert failed:", insertError);
        return respond({ error: "Could not start payment" }, 500);
      }

      const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: amountKobo,
          reference,
          currency: "NGN",
          callback_url: `${req.headers.get("origin") || "https://ukartapp.com"}/payment-callback`,
          metadata: { user_id: user.id },
        }),
      });

      const paystack = await paystackResponse.json();

      if (!paystackResponse.ok || !paystack.status) {
        await admin.from("payment_attempts")
          .update({ status: "failed" }).eq("reference", reference);
        return respond({ error: paystack.message || "Paystack initialization failed" }, 502);
      }

      return respond({
        ok: true,
        reference,
        authorization_url: paystack.data.authorization_url,
        access_code: paystack.data.access_code,
      });
    }

    if (action === "verify") {
      const reference = String(body.reference || "");
      if (!reference) return respond({ error: "Payment reference is required" }, 400);

      const { data: attempt, error: attemptError } = await admin
        .from("payment_attempts")
        .select("*")
        .eq("reference", reference)
        .eq("user_id", user.id)
        .single();

      if (attemptError || !attempt) return respond({ error: "Payment attempt not found" }, 404);

      if (attempt.order_id) {
        return respond({ ok: true, orderId: attempt.order_id, alreadyProcessed: true });
      }

      const verifyResponse = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } },
      );

      const verification = await verifyResponse.json();
      const transaction = verification.data;

      if (
        !verifyResponse.ok ||
        !verification.status ||
        transaction?.status !== "success" ||
        transaction?.reference !== reference ||
        Number(transaction?.amount) !== Number(attempt.amount_kobo) ||
        transaction?.currency !== "NGN"
      ) {
        return respond({ ok: false, error: "Payment has not been confirmed" }, 402);
      }

      const checkout = attempt.checkout_data;

      const orderNumber = `UK${Date.now().toString().slice(-9)}`;

      const { data: order, error: orderError } = await admin
        .from("orders")
        .insert({
          order_number: orderNumber,
          items: checkout.items,
          subtotal: checkout.subtotal,
          delivery_fee: checkout.delivery_fee,
          service_fee: checkout.service_fee,
          discount: checkout.discount,
          voucher_code: checkout.voucher_code,
          voucher_id: checkout.voucher_id,
          total: Number(attempt.amount_kobo) / 100,
          customer_name: checkout.customer_name,
          customer_email: user.email,
          customer_phone: checkout.customer_phone,
          alternate_phone: checkout.alternate_phone,
          customer_address: checkout.customer_address,
          landmark: checkout.landmark,
          delivery_zone: checkout.delivery_zone,
          delivery_lat: checkout.delivery_lat,
          delivery_lng: checkout.delivery_lng,
          payment_method: "Pay Online",
          payment_status: "Paid",
          status: "new",
          paystack_reference: reference,
          paystack_transaction_id: transaction.id,
          payment_channel: transaction.channel,
          payment_timestamp: transaction.paid_at || new Date().toISOString(),
          paystack_mode: "live",
          paystack_response: transaction,
          is_first_order: checkout.is_first_order || false,
          first_order_discount: checkout.first_order_discount || 0,
          referral_id: checkout.referral_id || null,
          referral_type: checkout.referral_type || null,
        })
        .select("id")
        .single();

      if (orderError || !order) {
        console.error("Verified payment but order creation failed:", orderError);
        return respond({
          ok: false,
          paid: true,
          error: "Payment verified. Order creation needs reconciliation.",
          reference,
        }, 500);
      }

      const { error: updateError } = await admin
        .from("payment_attempts")
        .update({
          status: "verified",
          order_id: order.id,
          verified_at: new Date().toISOString(),
        })
        .eq("reference", reference)
        .is("order_id", null);

      if (updateError) {
        console.error("Payment attempt update failed:", updateError);
      }

      return respond({ ok: true, orderId: order.id });
    }

    return respond({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error("Payment function error:", error);
    return respond({ error: "Payment service error" }, 500);
  }
});