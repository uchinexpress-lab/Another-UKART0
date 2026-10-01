// Shared Paystack payment utilities — used by initiatePaystackPayment,
// verifyPaystackPayment, and paystackWebhook backend functions.

import { secrets } from "base44:runtime";

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

  // Already processed — idempotent return
  if (payment.status === "paid") {
    return { ok: true, alreadyPaid: true, orderId: payment.order_id };
  }

  // Re-verify with Paystack (authoritative source of truth)
  const tx = await verifyTransaction(reference);

  // Transaction must be successful
  if (tx.status !== "success") {
    await base44.asServiceRole.entities.Payment.update(payment.id, {
      status: "failed",
      paystack_response: tx,
    });
    return { ok: false, reason: "Transaction was not successful" };
  }

  // Amount verification — Paystack amount is in kobo, our amount in naira
  const expectedKobo = Math.round(payment.amount * 100);
  if (Number(tx.amount) !== expectedKobo) {
    await base44.asServiceRole.entities.Payment.update(payment.id, {
      status: "failed",
      paystack_response: tx,
    });
    return { ok: false, reason: "Amount mismatch" };
  }

  // Currency verification
  if ((tx.currency || "NGN") !== (payment.currency || "NGN")) {
    await base44.asServiceRole.entities.Payment.update(payment.id, {
      status: "failed",
      paystack_response: tx,
    });
    return { ok: false, reason: "Currency mismatch" };
  }

  // Reference must match
  if (tx.reference !== reference) {
    return { ok: false, reason: "Reference mismatch" };
  }

  const now = new Date().toISOString();
  const txId = tx.id;
  const channel = tx.channel || "unknown";

  // Update the payment record to paid
  await base44.asServiceRole.entities.Payment.update(payment.id, {
    status: "paid",
    paystack_transaction_id: txId,
    payment_channel: channel,
    paystack_response: tx,
    verified_at: now,
    paid_at: now,
  });

  // Update the order to paid — this is what unlocks fulfillment
  await base44.asServiceRole.entities.Order.update(payment.order_id, {
    payment_status: "Paid",
    paystack_reference: reference,
    paystack_transaction_id: txId,
    payment_channel: channel,
    payment_timestamp: now,
    paystack_response: tx,
  });

  // Finalize discounts only on successful payment — failed/abandoned payments
  // never consume a one-time voucher or a referral reward. Idempotent: this
  // block only runs on the first confirmation (early-return above for paid).
  const paidOrder = await base44.asServiceRole.entities.Order.get(payment.order_id);
  if (paidOrder) {
    if (paidOrder.voucher_code) {
      try {
        const vRes = await base44.asServiceRole.entities.Voucher.filter(
          { code: paidOrder.voucher_code },
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
    if (paidOrder.referral_id) {
      try {
        const ref = await base44.asServiceRole.entities.Referral.get(paidOrder.referral_id);
        if (ref) {
          const rewardUpdate =
            paidOrder.referral_type === "referrer"
              ? { referrer_rewarded: true, status: "rewarded" }
              : { referred_rewarded: true, status: "rewarded" };
          await base44.asServiceRole.entities.Referral.update(ref.id, rewardUpdate);
        }
      } catch (e) {
        console.error("Referral reward finalization failed:", e);
      }
    }
  }

  return { ok: true, orderId: payment.order_id, channel };
}