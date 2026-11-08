import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { confirmPayment, verifyTransaction } from "../../shared/paystackUtils.ts";

// Closes a checkout the customer left without completing payment.
//
// Safety rules (a paid order can never be lost here):
//  1. The order is NEVER deleted — a late Paystack success must always be able
//     to find it. It is marked Abandoned instead and hidden from the customer.
//  2. Paystack is asked about the reference first. A success is confirmed
//     (paid + emails), and a transaction that is still in flight is left
//     untouched for the webhook to finish.
//  3. Only a definitive failure/abandonment closes the order.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { orderId, reference } = body || {};

    const admin = base44.asServiceRole;

    let order: any = null;
    let payment: any = null;

    if (reference) {
      const pay = await admin.entities.Payment.filter({ reference }, { limit: 1 });
      payment = pay.items && pay.items[0];
    }

    if (orderId) {
      try {
        order = await admin.entities.Order.get(orderId);
      } catch {
        order = null;
      }
    }
    if (!order && payment?.order_id) {
      try {
        order = await admin.entities.Order.get(payment.order_id);
      } catch {
        order = null;
      }
    }

    if (!order) return Response.json({ ok: true, abandoned: false });

    if (order.customer_email !== user.email) {
      return Response.json({ error: "Order does not belong to you" }, { status: 403 });
    }

    // Payment already confirmed — never downgrade it.
    if (order.payment_status === "Paid") {
      return Response.json({ ok: true, abandoned: false, paid: true, orderId: order.id });
    }

    // Ask Paystack before writing the order off.
    const referenceToCheck = reference || payment?.reference || order.paystack_reference;
    if (referenceToCheck) {
      try {
        const tx = await verifyTransaction(referenceToCheck);
        const txStatus = String(tx.status || "");

        if (txStatus === "success") {
          const result = await confirmPayment(base44, referenceToCheck);
          if (result?.ok) {
            return Response.json({
              ok: true,
              abandoned: false,
              paid: true,
              orderId: order.id,
            });
          }
        }

        // Still in flight — leave the order pending for the webhook.
        if (!["failed", "reversed", "abandoned"].includes(txStatus)) {
          return Response.json({
            ok: true,
            abandoned: false,
            pending: true,
            orderId: order.id,
          });
        }
      } catch (e) {
        // Paystack unreachable: never write off a possibly paid order.
        console.error("Paystack check failed, keeping order open:", e);
        return Response.json({ ok: true, abandoned: false, pending: true, orderId: order.id });
      }
    }

    // Give back the voucher use this order claimed at creation.
    if (order.voucher_id && order.voucher_claimed) {
      await admin.entities.Voucher.updateMany(
        { id: order.voucher_id },
        { $inc: { uses: -1 } }
      );
      await admin.entities.Order.update(order.id, { voucher_claimed: false });
    }

    // Close the payment attempts that were opened but never completed.
    const open = await admin.entities.Payment.filter(
      { order_id: order.id, status: { $in: ["pending", "processing"] } },
      { limit: 20 }
    );
    for (const p of open.items || []) {
      await admin.entities.Payment.update(p.id, { status: "abandoned" });
    }

    // The order stays in the database (hidden from the customer) so a delayed
    // Paystack success can still be reconciled by the webhook.
    await admin.entities.Order.update(order.id, {
      payment_status: "Abandoned",
      status: "awaiting_payment",
    });

    return Response.json({ ok: true, abandoned: true, orderId: order.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}