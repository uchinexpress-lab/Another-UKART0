import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import {
  adminNewOrderEmail,
  customerConfirmationEmail,
  statusEmail,
} from "../../shared/orderEmails.ts";

// Centralized order email notifications. Runs as the service role so it can
// send email and update Order notification flags (Order.update is admin-only).
// Replaces the former client-side SendEmail calls in notifications.js.

async function getSettings(admin: any) {
  const list = await admin.entities.NotificationSetting.list();
  if (list.length === 0) {
    return await admin.entities.NotificationSetting.create({
      business_email: "ukartfreshventures@gmail.com",
      enable_business_email: true,
      enable_customer_confirmation: true,
      enable_customer_status_emails: true,
    });
  }
  return list[0];
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { type, orderId, status } = body;
    if (!type || !orderId) {
      return Response.json({ error: "type and orderId required" }, { status: 400 });
    }

    const admin = base44.asServiceRole;
    const order = await admin.entities.Order.get(orderId);
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

    // Only the order owner or an admin may trigger notifications for it.
    if (order.customer_email !== user.email && user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const settings = await getSettings(admin);

    if (type === "created") {
      // Admin / business new-order email
      if (settings.enable_business_email && !order.admin_notified) {
        try {
          await admin.integrations.Core.SendEmail({
            to: settings.business_email,
            subject: `\uD83D\uDED2 New Ukart Order #${order.order_number}`,
            html: adminNewOrderEmail(order),
          });
          await admin.entities.Order.update(order.id, { admin_notified: true });
        } catch (e) {
          console.error("Admin order notification failed:", e);
        }
      }

      // Customer confirmation email
      if (
        settings.enable_customer_confirmation &&
        order.customer_email &&
        !order.confirmation_email_sent
      ) {
        try {
          await admin.integrations.Core.SendEmail({
            to: order.customer_email,
            subject: `\u2705 Your Ukart Order #${order.order_number} Has Been Received`,
            html: customerConfirmationEmail(order),
          });
          await admin.entities.Order.update(order.id, {
            confirmation_email_sent: true,
            last_status_notified: "new",
          });
        } catch (e) {
          console.error("Customer confirmation email failed:", e);
        }
      }
      return Response.json({ ok: true });
    }

    if (type === "status") {
      if (!status || status === "new") return Response.json({ ok: true, skipped: true });

      // Update the order status (service role — Order.update is admin-only).
      await admin.entities.Order.update(order.id, { status });

      if (!settings.enable_customer_status_emails) return Response.json({ ok: true });
      if (order.last_status_notified === status) return Response.json({ ok: true });
      if (!order.customer_email) return Response.json({ ok: true });

      const template = statusEmail(order, status);
      if (!template) return Response.json({ ok: true });

      try {
        await admin.integrations.Core.SendEmail({
          to: order.customer_email,
          subject: template.subject,
          html: template.html,
        });
        await admin.entities.Order.update(order.id, { last_status_notified: status });
      } catch (e) {
        console.error("Status notification failed:", e);
      }
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Unknown notification type" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}