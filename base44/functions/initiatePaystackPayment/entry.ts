import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import {
  generateReference,
  detectMode,
  initializeTransaction,
} from "../../shared/paystackUtils.ts";

// Initiates a Paystack transaction for an existing Ukart order.
// The order must belong to the calling user and have payment_status "Pending".
// The amount is always recalculated server-side from the stored order total.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { orderId, callbackUrl } = body;
    if (!orderId) return Response.json({ error: "Order ID required" }, { status: 400 });
    if (!callbackUrl) return Response.json({ error: "Callback URL required" }, { status: 400 });

    // Load the order (user-scoped — RLS ensures ownership)
    const order = await base44.entities.Order.get(orderId);
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

    // Verify the order belongs to this customer
    if (order.customer_email !== user.email) {
      return Response.json({ error: "Order does not belong to you" }, { status: 403 });
    }

    // Don't re-initiate if already paid
    if (order.payment_status === "Paid") {
      return Response.json({ error: "Order already paid" }, { status: 400 });
    }

    // Server-side amount — never trust a client-sent amount
    const amountNaira = order.total;
    if (!amountNaira || amountNaira <= 0) {
      return Response.json({ error: "Invalid order amount" }, { status: 400 });
    }
    const amountKobo = Math.round(amountNaira * 100);

    const reference = generateReference(order.order_number);
    const mode = detectMode();

    // Create a pending payment record (service role — Payment entity is admin-create)
    const payment = await base44.asServiceRole.entities.Payment.create({
      order_id: order.id,
      order_number: order.order_number,
      reference,
      amount: amountNaira,
      currency: "NGN",
      status: "pending",
      customer_email: order.customer_email,
      customer_name: order.customer_name,
      mode,
      initialized_at: new Date().toISOString(),
    });

    // Initialize the transaction with Paystack
    const txData = await initializeTransaction({
      email: order.customer_email,
      amount: amountKobo,
      reference,
      callback_url: callbackUrl,
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        payment_id: payment.id,
        custom_fields: [
          {
            display_name: "Order Number",
            variable_name: "order_number",
            value: order.order_number,
          },
        ],
      },
    });

    // Mark the order as processing payment
    await base44.asServiceRole.entities.Order.update(order.id, {
      payment_status: "Processing",
      paystack_reference: reference,
      paystack_mode: mode,
    });

    return Response.json({
      authorization_url: txData.authorization_url,
      reference,
      access_code: txData.access_code,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}