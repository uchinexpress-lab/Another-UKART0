// Shared Paystack payment utilities — used by initiatePaystackPayment,
// verifyPaystackPayment, and paystackWebhook backend functions.
//
// Payment truth is ALWAYS Paystack's verify endpoint. The order is only marked
// paid after a successful verification whose amount, currency and reference
// match the Ukart order. Emails are only sent after that point, and every step
// is idempotent so the webhook and the browser callback can both arrive
// without duplicate payments or duplicate emails.

import { secrets } from "base44:runtime";
import { sendOrderPaidEmails } from "./orderPaidEmails.ts";

const PAYSTACK_BASE = "https://api.paystack.co";

// Generate a unique transaction reference: UKART_YYYYMMDD_NNNN_XXXXXX
export function generateReference(orderNumber) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const num = (orderNumber.match(/\d+/g) || []).join("").slice(-6);
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `UKART_${date}_${num}_${rand}`;
}

// Detect test vs live mode from the secret key prefix.
export function detectMode() {
  const key = secrets.get("PAYSTACK_SECRET_KEY") || "";
  return key.startsWith("sk_live") ? "live" : "test";
}

// Initialize a Paystack transaction — returns { authorization_url, access_code, reference }
export async function initializeTransaction(params) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secrets.get("PAYSTACK_SECRET_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.status) throw new Error(data.message || "Paystack initialization failed");
  return data.data;
}

// Verify a Paystack transaction by reference — returns the full transaction data.
export async function verifyTransaction(reference) {
  const res = await fetch(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${secrets.get("PAYSTACK_SECRET_KEY")}` },
    }
  );
  const data = await res.json();
  if (!data.status) throw new Error(data.message || "Paystack verification failed");
  return data.data;
}

// Record a failed/abandoned attempt. A paid order is never downgraded.
async function markUnpaid(base44, payment, paymentStatus, reason, tx) {
  try {
    await base44.asServiceRole.entities.Payment.update(payment.id, {
      status: paymentStatus,
      paystack_response: tx || {},
      verified_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Payment status update failed:", e);
  }

  try {
    const order = await base44.asServiceRole.entities.Order.get(payment.order_id);
    if (order && order.payment_status !== "Paid") {
      await base44.asServiceRole.entities.Order.update(order.id, {
        payment_status: paymentStatus === "abandoned" ? "Abandoned" : "Failed",
        // Order status intentionally stays awaiting_payment — no fulfilment.
      });
    }
  } catch (e) {
    console.error("Order payment status update failed:", e);
  }

  return { ok: false, reason };
}

// Core confirmation logic — verify with Paystack and mark the order as paid.
// Idempotent: safe to call multiple times (webhook + callback).
// Used by both verifyPaystackPayment and paystackWebhook.
export async function confirmPayment(base44, reference) {
  // Find the payment record by reference
  const payments = await base44.asServiceRole.entities.Payment.filter(
    { reference },
    { limit: 1 }
  );
  if (!payments.items || payments.items.length === 0) {
    return { ok: false, reason: "Payment record not found" };
  }
  const payment = payments.items[0];

  const order = await base44.asServiceRole.entities.Order.get(payment.order_id);
  if (!order) {
    return { ok: false, reason: "Order not found" };
  }

  // Already processed — repair the order if needed, then return (idempotent).
  if (payment.status === "paid") {
    if (order.payment_status !== "Paid") {
      await base44.asServiceRole.entities.Order.update(order.id, {
        payment_status: "Paid",
        status: ["awaiting_payment", "new", undefined, null].includes(order.status)
          ? "processing"
          : order.status,
        paystack_reference: reference,
        paystack_transaction_id: payment.paystack_transaction_id,
        payment_channel: payment.payment_channel,
        payment_timestamp: payment.paid_at || payment.verified_at,
      });
    }
    await sendOrderPaidEmails(base44.asServiceRole, order.id);
    return { ok: true, alreadyPaid: true, orderId: order.id };
  }

  // Re-verify with Paystack (authoritative source of truth)
  const tx = await verifyTransaction(reference);

  // Transaction must be successful
  if (tx.status !== "success") {
    const failedStatus = tx.status === "abandoned" ? "abandoned" : "failed";
    return markUnpaid(
      base44,
      payment,
      failedStatus,
      `Transaction status: ${tx.status}`,
      tx
    );
  }

  // Amount verification — Paystack amount is in kobo, our amount in naira.
  // Both the stored payment amount AND the order total must match.
  const expectedKobo = Math.round(Number(payment.amount) * 100);
  const orderKobo = Math.round(Number(order.total) * 100);
  if (Number(tx.amount) !== expectedKobo || Number(tx.amount) !== orderKobo) {
    return markUnpaid(base44, payment, "failed", "Amount mismatch", tx);
  }

  // Currency verification
  if ((tx.currency || "NGN") !== (payment.currency || "NGN")) {
    return markUnpaid(base44, payment, "failed", "Currency mismatch", tx);
  }

  // Reference must match
  if (tx.reference !== reference) {
    return markUnpaid(base44, payment, "failed", "Reference mismatch", tx);
  }

  const now = new Date().toISOString();
  const txId = tx.id;
  const channel = tx.channel || "unknown";

  // 1. Payment record → paid
  await base44.asServiceRole.entities.Payment.update(payment.id, {
    status: "paid",
    paystack_transaction_id: txId,
    payment_channel: channel,
    paystack_response: tx,
    verified_at: now,
    paid_at: now,
  });

  // 2. Order → paid + processing (only if it hasn't moved further along)
  const orderUpdate: Record<string, any> = {
    payment_status: "Paid",
    paystack_reference: reference,
    paystack_transaction_id: txId,
    payment_channel: channel,
    payment_timestamp: now,
    paystack_response: tx,
  };
  if (["awaiting_payment", "new", undefined, null].includes(order.status)) {
    orderUpdate.status = "processing";
  }
  await base44.asServiceRole.entities.Order.update(order.id, orderUpdate);

  // 3. Finalize discounts only on successful payment — failed/abandoned
  // payments never consume a one-time voucher or a referral reward.
  if (order.voucher_code) {
    try {
      const vRes = await base44.asServiceRole.entities.Voucher.filter(
        { code: order.voucher_code },
        { limit: 1 }
      );
      const v = vRes.items && vRes.items[0];
      if (v) {
        await base44.asServiceRole.entities.Voucher.update(v.id, {
          uses: (v.uses || 0) + 1,
        });
      }
    } catch (e) {
      console.error("Voucher usage increment failed:", e);
    }
  }
  if (order.referral_id) {
    try {
      const ref = await base44.asServiceRole.entities.Referral.get(order.referral_id);
      if (ref) {
        const rewardUpdate =
          order.referral_type === "referrer"
            ? { referrer_rewarded: true, status: "rewarded" }
            : { referred_rewarded: true, status: "rewarded" };
        await base44.asServiceRole.entities.Referral.update(ref.id, rewardUpdate);
      }
    } catch (e) {
      console.error("Referral reward finalization failed:", e);
    }
  }

  // 4. Confirmation emails — only now, never at order creation.
  await sendOrderPaidEmails(base44.asServiceRole, order.id);

  return { ok: true, orderId: order.id, channel, amount: Number(tx.amount) / 100 };
}