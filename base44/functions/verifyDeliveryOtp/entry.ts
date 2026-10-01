import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import {
  hashOtp,
  logDeliveryEvent,
  ORDER_STATUS_MAP,
} from "../../shared/deliveryUtils.ts";

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { deliveryId, code } = body;
    if (!deliveryId || !code)
      return Response.json({ error: "deliveryId and code are required" }, { status: 400 });

    const admin = base44.asServiceRole;
    const delivery = await admin.entities.Delivery.get(deliveryId);
    if (!delivery)
      return Response.json({ error: "Delivery not found" }, { status: 404 });

    const isRider = delivery.rider_user_id === user.id;
    const isAdmin = user.role === "admin";
    if (!isRider && !isAdmin)
      return Response.json({ error: "Not authorized for this delivery" }, { status: 403 });

    if (delivery.status !== "arrived")
      return Response.json({ error: "Delivery must be in arrived state" }, { status: 400 });

    if (delivery.otp_verified)
      return Response.json({ error: "OTP already verified", verified: true }, { status: 400 });

    // Check lock
    if (delivery.otp_locked_until && new Date(delivery.otp_locked_until) > new Date()) {
      return Response.json({
        error: "Verification temporarily locked. Contact Ukart support/admin.",
        locked: true,
        locked_until: delivery.otp_locked_until,
      }, { status: 423 });
    }

    // Find the active OTP record
    const otps = await admin.entities.DeliveryOtp.filter(
      { delivery_id: deliveryId, invalidated: false },
      { sort: "-created_date", limit: 1 }
    );
    const otp = otps.items?.[0];
    if (!otp)
      return Response.json({ error: "No active OTP found" }, { status: 400 });

    // Check expiry
    if (new Date(otp.expires_at) < new Date())
      return Response.json({ error: "OTP has expired. Please request a new code.", expired: true }, { status: 400 });

    // Verify the code
    const enteredHash = await hashOtp(String(code).trim());
    const maxAttempts = delivery.otp_max_attempts || otp.max_attempts || 5;
    const newAttemptCount = (delivery.otp_attempts || 0) + 1;

    if (enteredHash !== otp.code_hash) {
      // Incorrect OTP
      const remaining = maxAttempts - newAttemptCount;
      const shouldLock = remaining <= 0;

      const updateData: any = { otp_attempts: newAttemptCount };
      if (shouldLock) {
        const lockUntil = new Date(Date.now() + 30 * 60000).toISOString();
        updateData.otp_locked_until = lockUntil;
        await admin.entities.DeliveryOtp.update(otp.id, {
          locked_until: lockUntil,
          attempt_count: newAttemptCount,
        });
      } else {
        await admin.entities.DeliveryOtp.update(otp.id, {
          attempt_count: newAttemptCount,
        });
      }

      await admin.entities.Delivery.update(deliveryId, updateData);

      // Audit log
      await logDeliveryEvent(admin, {
        delivery_id: deliveryId,
        order_id: delivery.order_id,
        order_number: delivery.order_number,
        customer_email: delivery.customer_email,
        event_type: "otp_failed",
        message: shouldLock
          ? `Incorrect OTP — verification locked after ${maxAttempts} attempts`
          : `Incorrect OTP — attempt ${newAttemptCount} of ${maxAttempts}`,
        actor_type: "rider",
        actor_id: user.id,
        actor_name: delivery.rider_name,
        customer_visible: false,
      });

      if (shouldLock) {
        return Response.json({
          ok: false,
          verified: false,
          locked: true,
          message: "Verification temporarily locked. Contact Ukart support/admin.",
        }, { status: 423 });
      }

      return Response.json({
        ok: false,
        verified: false,
        attempts_remaining: remaining,
        message: "Incorrect delivery code.",
      }, { status: 400 });
    }

    // ── Correct OTP — complete delivery ──
    const now = new Date();
    const nowIso = now.toISOString();

    // Mark OTP as verified
    await admin.entities.DeliveryOtp.update(otp.id, {
      verified: true,
      verified_at: nowIso,
      invalidated: true,
    });

    // Update delivery to delivered
    await admin.entities.Delivery.update(deliveryId, {
      status: "delivered",
      otp_verified: true,
      otp_verified_at: nowIso,
      otp_active: false,
      delivered_at: nowIso,
      eta_status: "delivered",
      latest_lat: null,
      latest_lng: null,
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
      event_type: "otp_verified",
      message: "Delivery verification code verified",
      actor_type: "rider",
      actor_id: user.id,
      actor_name: delivery.rider_name,
      customer_visible: true,
    });
    await logDeliveryEvent(admin, {
      delivery_id: deliveryId,
      order_id: delivery.order_id,
      order_number: delivery.order_number,
      customer_email: delivery.customer_email,
      event_type: "delivered",
      message: "Order delivered successfully",
      actor_type: "rider",
      actor_id: user.id,
      actor_name: delivery.rider_name,
      customer_visible: true,
    });

    // Notify customer
    if (delivery.customer_email) {
      try {
        await base44.integrations.Core.SendEmail({
          to: delivery.customer_email,
          subject: `✅ Your Ukart order has been delivered`,
          body: `<p>Hi ${delivery.customer_name || "Customer"},</p><p>Your order <strong>#${delivery.order_number}</strong> has been delivered successfully. Thank you for shopping with Ukart!</p><p>Please rate your delivery experience in the app.</p>`,
        });
      } catch (e) {
        console.error("Delivered notification failed:", e);
      }
    }

    return Response.json({
      ok: true,
      verified: true,
      status: "delivered",
      delivered_at: nowIso,
      message: "Delivery verified and completed successfully.",
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}