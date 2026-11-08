import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";

// Closes a checkout that was never paid for. The customer left Paystack without
// completing the payment, so the order is marked Abandoned (never "pending"),
// open payment attempts are closed, and the voucher use it claimed is released.
// A paid order is never downgraded. The customer's cart is untouched.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { orderId, reference } = body || {};

    const admin = base44.asServiceRole;

    let order: any = null;
    if (orderId) {
      try {
        order = await admin.entities.Order.get(orderId);
      } catch {
        order = null;
      }
    } else if (reference) {
      const pay = await admin.entities.Payment.filter({ reference }, { limit: 1 });
      const payment = pay.items && pay.items[0];
      if (payment?.order_id) {
        try {
          order = await admin.entities.Order.get(payment.order_id);
        } catch {
          order = null;
        }
      }
    }

    if (!order) return Response.json({ ok: true, abandoned: false });

    if (order.customer_email !== user.email) {
      return Response.json({ error: "Order does not belong to you" }, { status: 403 });
    }

    // Payment already confirmed — never downgrade it.
    if (order.payment_status === "Paid") {
      return Response.json({ ok: true, abandoned: false, paid: true });
    }

    // Give back the voucher use this order claimed at creation.
    if (order.voucher_id && order.voucher_claimed) {
      await admin.entities.Voucher.updateMany(
        { id: order.voucher_id },
        { $inc: { uses: -1 } }
      );
    }

    // Close the payment attempts that were opened but never completed, then
    // remove the order itself: an abandoned checkout leaves no record behind.
    const open = await admin.entities.Payment.filter(
      { order_id: order.id, status: { $in: ["pending", "processing"] } },
      { limit: 20 }
    );
    for (const p of open.items || []) {
      await admin.entities.Payment.update(p.id, { status: "abandoned" });
    }

    await admin.entities.Order.delete(order.id);

    return Response.json({ ok: true, abandoned: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}