import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import {
  ORDER_STATUS_MAP,
  ACTIVE_DELIVERY_STATUSES,
  estimateMinutes,
  haversineKm,
  minutesFromNow,
  DEFAULT_PICKUP_LAT,
  DEFAULT_PICKUP_LNG,
  DEFAULT_PICKUP_ADDRESS,
} from "../../shared/deliveryUtils.ts";

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, deliveryId, orderId, riderId, estimatedMinutes: manualMinutes } = body;

    const admin = base44.asServiceRole;

    // ── ASSIGN: admin assigns a rider to an order ──
    if (action === "assign") {
      if (user.role !== "admin")
        return Response.json({ error: "Admin only" }, { status: 403 });

      const order = await admin.entities.Order.get(orderId);
      if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

      const rider = await admin.entities.Rider.get(riderId);
      if (!rider) return Response.json({ error: "Rider not found" }, { status: 404 });
      if (rider.approval_status !== "approved")
        return Response.json({ error: "Rider is not approved" }, { status: 400 });
      if (!rider.is_online || !rider.is_available)
        return Response.json({ error: "Rider is not available" }, { status: 400 });

      // Check for existing delivery
      const existing = await admin.entities.Delivery.filter(
        { order_id: orderId, status: { $in: [...ACTIVE_DELIVERY_STATUSES, "delivered"] } },
        { limit: 1 }
      );
      if (existing.items?.length > 0 && existing.items[0].status !== "cancelled") {
        // Reassign: update existing
        const prev = existing.items[0];
        await admin.entities.Delivery.update(prev.id, {
          rider_id: rider.id,
          rider_user_id: rider.user_id,
          rider_name: rider.name,
          rider_phone: rider.phone,
          rider_photo: rider.photo,
          status: "assigned",
          started_at: null,
          latest_lat: null,
          latest_lng: null,
          last_location_at: null,
        });
        await admin.entities.Rider.update(rider.id, {
          current_delivery_id: prev.id,
          is_available: false,
        });
        // Sync order status
        await admin.entities.Order.update(orderId, { status: ORDER_STATUS_MAP["assigned"] });
        return Response.json({ delivery: { id: prev.id, reassigned: true } });
      }

      // Create new delivery record
      const delivery = await admin.entities.Delivery.create({
        order_id: orderId,
        order_number: order.order_number,
        order_total: order.total,
        order_items: order.items || [],
        rider_id: rider.id,
        rider_user_id: rider.user_id,
        rider_name: rider.name,
        rider_phone: rider.phone,
        rider_photo: rider.photo,
        customer_email: order.customer_email,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        customer_address: order.customer_address,
        status: "assigned",
        pickup_address: DEFAULT_PICKUP_ADDRESS,
        pickup_lat: DEFAULT_PICKUP_LAT,
        pickup_lng: DEFAULT_PICKUP_LNG,
      });

      await admin.entities.Rider.update(rider.id, {
        current_delivery_id: delivery.id,
        is_available: false,
      });
      await admin.entities.Order.update(orderId, { status: ORDER_STATUS_MAP["assigned"] });

      return Response.json({ delivery: { id: delivery.id } });
    }

    // ── For all other actions, fetch the delivery ──
    const delivery = await admin.entities.Delivery.get(deliveryId);
    if (!delivery) return Response.json({ error: "Delivery not found" }, { status: 404 });

    const isRider = delivery.rider_user_id === user.id;
    const isAdmin = user.role === "admin";
    if (!isRider && !isAdmin)
      return Response.json({ error: "Not authorized for this delivery" }, { status: 403 });

    // ── ACCEPT ──
    if (action === "accept") {
      if (delivery.status !== "assigned")
        return Response.json({ error: "Delivery not in assignable state" }, { status: 400 });
      await admin.entities.Delivery.update(deliveryId, { status: "accepted" });
      await admin.entities.Order.update(delivery.order_id, {
        status: ORDER_STATUS_MAP["accepted"],
      });
      return Response.json({ ok: true, status: "accepted" });
    }

    // ── START DELIVERY ──
    if (action === "start") {
      const now = new Date();
      // Estimate ETA: default 35 min if no coordinates, else distance-based
      let etaMin = manualMinutes || 35;
      if (delivery.delivery_lat && delivery.pickup_lat) {
        const dist = haversineKm(
          delivery.pickup_lat,
          delivery.pickup_lng,
          delivery.delivery_lat,
          delivery.delivery_lng
        );
        etaMin = estimateMinutes(dist);
      }
      const etaAt = minutesFromNow(etaMin);

      await admin.entities.Delivery.update(deliveryId, {
        status: "on_the_way",
        started_at: now.toISOString(),
        estimated_delivery_at: etaAt,
        estimated_minutes: etaMin,
        last_eta_update: now.toISOString(),
        eta_status: "on_time",
      });
      await admin.entities.Order.update(delivery.order_id, {
        status: "on_the_way",
      });

      // Notify customer via email
      if (delivery.customer_email) {
        try {
          await base44.integrations.Core.SendEmail({
            to: delivery.customer_email,
            subject: `🛵 Your Ukart order is on the way!`,
            body: `<p>Hi ${delivery.customer_name || "Customer"},</p><p>Your order <strong>#${delivery.order_number}</strong> is now on the way! Your rider ${delivery.rider_name || ""} is heading to your address.</p><p>Estimated arrival: <strong>${etaMin} minutes</strong>.</p><p>Track your delivery live in the Ukart app.</p>`,
          });
        } catch (e) {
          console.error("Customer notification failed:", e);
        }
      }

      return Response.json({
        ok: true,
        status: "on_the_way",
        estimated_delivery_at: etaAt,
        estimated_minutes: etaMin,
      });
    }

    // ── ARRIVING SOON ──
    if (action === "arriving_soon") {
      const now = new Date();
      const remainingMin = Math.max(5, Math.round((new Date(delivery.estimated_delivery_at).getTime() - now.getTime()) / 60000));
      await admin.entities.Delivery.update(deliveryId, {
        status: "arriving_soon",
        arriving_soon_at: now.toISOString(),
        eta_status: "arriving_soon",
        estimated_minutes: Math.min(remainingMin, 5),
      });

      if (delivery.customer_email) {
        try {
          await base44.integrations.Core.SendEmail({
            to: delivery.customer_email,
            subject: `📍 Your Ukart rider is almost here!`,
            body: `<p>Hi ${delivery.customer_name || "Customer"},</p><p>Your rider is arriving in approximately <strong>5 minutes</strong>. Please get ready to receive your order.</p>`,
          });
        } catch (e) {
          console.error("Arriving soon notification failed:", e);
        }
      }

      return Response.json({ ok: true, status: "arriving_soon" });
    }

    // ── COMPLETE ──
    if (action === "complete") {
      const now = new Date();
      await admin.entities.Delivery.update(deliveryId, {
        status: "delivered",
        delivered_at: now.toISOString(),
        eta_status: "delivered",
        latest_lat: null,
        latest_lng: null,
      });
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

      if (delivery.customer_email) {
        try {
          await base44.integrations.Core.SendEmail({
            to: delivery.customer_email,
            subject: `✅ Your Ukart order has been delivered`,
            body: `<p>Hi ${delivery.customer_name || "Customer"},</p><p>Your order <strong>#${delivery.order_number}</strong> has been delivered. Thank you for shopping with Ukart!</p><p>Please rate your delivery experience in the app.</p>`,
          });
        } catch (e) {
          console.error("Delivered notification failed:", e);
        }
      }

      return Response.json({ ok: true, status: "delivered" });
    }

    // ── CANCEL ──
    if (action === "cancel") {
      await admin.entities.Delivery.update(deliveryId, {
        status: "cancelled",
        latest_lat: null,
        latest_lng: null,
      });

      if (delivery.rider_id) {
        const rider = await admin.entities.Rider.get(delivery.rider_id);
        if (rider) {
          await admin.entities.Rider.update(delivery.rider_id, {
            current_delivery_id: null,
            is_available: true,
            cancelled_deliveries: (rider.cancelled_deliveries || 0) + 1,
          });
        }
      }

      return Response.json({ ok: true, status: "cancelled" });
    }

    // ── UPDATE ETA (manual or from routing API) ──
    if (action === "update_eta") {
      const now = new Date();
      const minutes = manualMinutes || delivery.estimated_minutes || 30;
      const etaAt = minutesFromNow(minutes);
      await admin.entities.Delivery.update(deliveryId, {
        estimated_delivery_at: etaAt,
        estimated_minutes: minutes,
        last_eta_update: now.toISOString(),
      });
      return Response.json({ ok: true, estimated_delivery_at: etaAt, estimated_minutes: minutes });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}