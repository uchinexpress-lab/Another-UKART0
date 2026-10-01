import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import {
  generateOtpCode,
  hashOtp,
  sendSmsOtp,
  logDeliveryEvent,
  OTP_EXPIRY_MINUTES,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  minutesFromNow,
} from "../../shared/deliveryUtils.ts";
import { emailShell } from "../../shared/emailBanner.ts";

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { deliveryId, requestedBy } = body;
    if (!deliveryId)
      return Response.json({ error: "deliveryId is required" }, { status: 400 });

    const admin = base44.asServiceRole;
    const delivery = await admin.entities.Delivery.get(deliveryId);
    if (!delivery)
      return Response.json({ error: "Delivery not found" }, { status: 404 });

    const isRider = delivery.rider_user_id === user.id;
    const isAdmin = user.role === "admin";
    if (!isRider && !isAdmin)
      return Response.json({ error: "Not authorized for this delivery" }, { status: 403 });

    if (delivery.status !== "arrived")
      return Response.json({ error: "Rider must arrive before resending OTP" }, { status: 400 });

    if (delivery.otp_verified)
      return Response.json({ error: "OTP already verified" }, { status: 400 });

    // Do not allow resend while brute-force locked — resending must not clear
    // the lock or the attempt counter (otherwise a locked-out rider just
    // cycles resend to get fresh guesses). Admin/support clears locks.
    if (delivery.otp_locked_until && new Date(delivery.otp_locked_until) > new Date()) {
      return Response.json({
        error: "OTP verification is locked. Contact Ukart support.",
        locked: true,
        locked_until: delivery.otp_locked_until,
      }, { status: 423 });
    }

    // Rate limit: enforce cooldown between resends
    if (delivery.otp_last_sent_at) {
      const elapsed = (Date.now() - new Date(delivery.otp_last_sent_at).getTime()) / 1000;
      if (elapsed < OTP_RESEND_COOLDOWN_SECONDS) {
        const wait = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsed);
        return Response.json({
          error: `Please wait ${wait}s before requesting a new code.`,
          rate_limited: true,
          retry_after_seconds: wait,
        }, { status: 429 });
      }
    }

    // Invalidate previous OTP records
    const prevOtps = await admin.entities.DeliveryOtp.filter(
      { delivery_id: deliveryId, invalidated: false },
      { limit: 10 }
    );
    for (const prev of prevOtps.items || []) {
      await admin.entities.DeliveryOtp.update(prev.id, { invalidated: true });
    }

    // Generate new OTP
    const code = generateOtpCode();
    const codeHash = await hashOtp(code);
    const now = new Date();
    const expiresAt = minutesFromNow(OTP_EXPIRY_MINUTES);

    // Send via email
    let emailStatus: "sent" | "failed" | "skipped" = "skipped";
    if (delivery.customer_email) {
      try {
        await base44.integrations.Core.SendEmail({
          to: delivery.customer_email,
          subject: `UKART DELIVERY VERIFICATION — Order #${delivery.order_number}`,
          body: emailShell(`<h2 style="color:#1B4332;">Ukart Delivery Verification (Resent)</h2><p>Hi ${delivery.customer_name || "Customer"},</p><p>Here is your new delivery verification code for Order <strong>#${delivery.order_number}</strong>:</p><div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;background:#E8F5E9;border-radius:12px;padding:20px;margin:16px 0;color:#1B4332;">${code}</div><p style="font-size:13px;color:#666;">Give this code to your Ukart rider to confirm that you received your order.</p><p style="font-size:12px;color:#999;">Your previous code is no longer valid.<br>This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>`),
        });
        emailStatus = "sent";
      } catch (e) {
        console.error("OTP resend email failed:", e);
        emailStatus = "failed";
      }
    }

    // Send via SMS
    let smsStatus: "sent" | "failed" | "not_configured" = "not_configured";
    if (delivery.customer_phone) {
      const smsMessage = `UKART: Your new delivery verification code for Order #${delivery.order_number} is ${code}. Previous code is invalid. Expires in ${OTP_EXPIRY_MINUTES} min.`;
      smsStatus = await sendSmsOtp(delivery.customer_phone, smsMessage);
    }

    let otpSendStatus = "pending";
    if (emailStatus === "sent" && smsStatus === "sent") otpSendStatus = "both_sent";
    else if (emailStatus === "sent") otpSendStatus = "email_sent";
    else if (smsStatus === "sent") otpSendStatus = "sms_sent";
    else otpSendStatus = "failed";

    await admin.entities.DeliveryOtp.create({
      delivery_id: deliveryId,
      order_id: delivery.order_id,
      order_number: delivery.order_number,
      rider_id: delivery.rider_id,
      rider_user_id: delivery.rider_user_id,
      customer_email: delivery.customer_email,
      customer_phone: delivery.customer_phone,
      code_hash: codeHash,
      expires_at: expiresAt,
      generated_at: now.toISOString(),
      max_attempts: OTP_MAX_ATTEMPTS,
      send_email_status: emailStatus,
      send_sms_status: smsStatus,
    });

    // Activate the new code WITHOUT resetting otp_attempts/otp_locked_until —
    // the brute-force counter and lock persist across resends.
    await admin.entities.Delivery.update(deliveryId, {
      otp_active: true,
      otp_send_status: otpSendStatus,
      otp_last_sent_at: now.toISOString(),
    });

    // Audit log
    await logDeliveryEvent(admin, {
      delivery_id: deliveryId,
      order_id: delivery.order_id,
      order_number: delivery.order_number,
      customer_email: delivery.customer_email,
      event_type: "otp_resent",
      message: `Delivery verification code resent (requested by ${requestedBy || "rider"})`,
      actor_type: isRider ? "rider" : "admin",
      actor_id: user.id,
      actor_name: delivery.rider_name,
      customer_visible: true,
    });

    return Response.json({
      ok: true,
      send_status: otpSendStatus,
      email: emailStatus,
      sms: smsStatus,
      expires_at: expiresAt,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}