import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { confirmPayment } from "../../shared/paystackUtils.ts";

// Verifies a Paystack transaction after the customer returns from the Paystack
// checkout. The backend re-verifies with Paystack (never trusts the browser
// callback alone) and marks the order as paid only if the transaction is
// successful and the amount matches.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { reference } = body;
    if (!reference) return Response.json({ error: "Reference required" }, { status: 400 });

    // Verify ownership — the payment's customer_email must match the user
    const payments = await base44.asServiceRole.entities.Payment.filter(
      { reference },
      { limit: 1 }
    );
    if (!payments.items || payments.items.length === 0) {
      return Response.json({ ok: false, reason: "Payment not found" });
    }
    const payment = payments.items[0];
    if (payment.customer_email !== user.email) {
      return Response.json({ error: "Payment does not belong to you" }, { status: 403 });
    }

    // Confirm the payment (re-verifies with Paystack, checks amount, updates status)
    const result = await confirmPayment(base44, reference);
    // The order id is always returned so the browser can show the right state
    // (success page, retry, or "still confirming") without another lookup.
    return Response.json({ ...result, orderId: result?.orderId || payment.order_id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}