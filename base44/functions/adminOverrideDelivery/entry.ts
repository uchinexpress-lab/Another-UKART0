import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { logDeliveryEvent } from "../../shared/deliveryUtils.ts";

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    if (user.role !== "admin")
      return Response.json({ error: "Admin only" }, { status: 403 });

    const body = await req.json();
    const { deliveryId, reason, note } = body;
    if (!deliveryId)
      return Response.json({ error: "deliveryId is required" }, { status: 400 });
    if (!reason)
      return Response.json({ error: "Override reason is required" }, { status: 400 });

    const admin = base44.asServiceRole;
    const delivery = await admin.entities.Delivery.get(deliveryId);
    if (!delivery)
      return Response.json({ error: "Delivery not found" }, { status: 404 });

    if (delivery.status === "delivered")
      return Response.json({ error: "Delivery already completed" }, { status: 400 });

    const now = new Date();
    const nowIso = now.toISOString();

    // Mark delivery as delivered with override record
    await admin.entities.Delivery.update(deliveryId, {
      status: "delivered",
      delivered_at: nowIso,
      otp_active: false,
      eta_status: "delivered",
      latest_lat: null,
      latest_lng: null,
      override_reason: reason,
      override_note: note || "",
      override_admin_id: user.id,
      override_admin_name: user.full_name || user.email,
      override_at: nowIso,
    });

    // Sync order status
    await admin.entities.Order.update(delivery.order_id, {
      status: "delivered",
    });

    // Free up the rider
    if (delivery.rider_id) {
      const rider = await admin.entities.Rider.get(delivery.rider_id);
      if (rider) {
        await admin.entities.Rider.update(delivery.rider_id, {
          current_delivery_id: null,
          is_available: true,
          completed_deliveries: (rider.completed_deliveries || 0) + 1,
        });
      }
    }

    // Audit logs
    await logDeliveryEvent(admin, {
      delivery_id: deliveryId,
      order_id: delivery.order_id,
      order_number: delivery.order_number,
      customer_email: delivery.customer_email,
      event_type: "admin_override",
      message: `Admin override: ${reason}${note ? ` — ${note}` : ""}`,
      actor_type: "admin",
      actor_id: user.id,
      actor_name: user.full_name || user.email,
      customer_visible: false,
    });
    await logDeliveryEvent(admin, {
      delivery_id: deliveryId,
      order_id: delivery.order_id,
      order_number: delivery.order_number,
      customer_email: delivery.customer_email,
      event_type: "delivered",
      message: "Order delivered (admin override)",
      actor_type: "admin",
      actor_id: user.id,
      actor_name: user.full_name || user.email,
      customer_visible: true,
    });

    // Notify customer
    if (delivery.customer_email) {
      try {
        await base44.integrations.Core.SendEmail({
          to: delivery.customer_email,
          subject: `✅ Your Ukart order has been delivered`,
          body: `<p>Hi ${delivery.customer_name || "Customer"},</p><p>Your order <strong>#${delivery.order_number}</strong> has been delivered. Thank you for shopping with Ukart!</p>`,
        });
      } catch (e) {
        console.error("Override notification failed:", e);
      }
    }

    return Response.json({
      ok: true,
      status: "delivered",
      delivered_at: nowIso,
      override: { reason, note: note || "", admin_id: user.id, admin_name: user.full_name || user.email, at: nowIso },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}