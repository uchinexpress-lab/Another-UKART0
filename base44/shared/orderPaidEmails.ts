// Post-payment order emails — sent ONLY after Paystack verification succeeds.
// Idempotent by claim: the notification flags are set before sending, so the
// callback and the webhook (or a page refresh) cannot send a second email.

import { adminNewOrderEmail, customerConfirmationEmail } from "./orderEmails.ts";

const DEFAULT_SETTINGS = {
  business_email: "ukartfreshventures@gmail.com",
  enable_business_email: true,
  enable_customer_confirmation: true,
};

export async function sendOrderPaidEmails(admin: any, orderId: string) {
  const order = await admin.entities.Order.get(orderId);
  if (!order) return;
  if (order.payment_status !== "Paid") return;

  let settings: any = DEFAULT_SETTINGS;
  try {
    const list = await admin.entities.NotificationSetting.list();
    if (list && list.length > 0) settings = list[0];
  } catch (e) {
    console.error("Notification settings load failed:", e);
  }

  // --- Business / admin new paid order ---
  if (settings.enable_business_email && !order.admin_notified) {
    try {
      await admin.entities.Order.update(order.id, { admin_notified: true });
      await admin.integrations.Core.SendEmail({
        to: settings.business_email,
        subject: `\uD83D\uDED2 New paid Ukart order #${order.order_number}`,
        html: adminNewOrderEmail(order),
      });
    } catch (e) {
      console.error("Admin order notification failed:", e);
      await admin.entities.Order.update(order.id, { admin_notified: false }).catch(() => {});
    }
  }

  // --- Customer payment confirmation ---
  // Re-read: the callback and webhook may race; only one may send.
  const fresh = await admin.entities.Order.get(order.id);
  if (
    settings.enable_customer_confirmation &&
    fresh?.customer_email &&
    !fresh.confirmation_email_sent
  ) {
    try {
      await admin.entities.Order.update(order.id, {
        confirmation_email_sent: true,
        // The customer is already told the order is being processed, so a
        // later "processing" status change must not email them twice.
        last_status_notified: "processing",
      });
      await admin.integrations.Core.SendEmail({
        to: fresh.customer_email,
        subject: `\u2705 Payment confirmed \u2014 Ukart order #${fresh.order_number}`,
        html: customerConfirmationEmail(fresh),
      });
    } catch (e) {
      console.error("Customer confirmation email failed:", e);
      await admin.entities.Order.update(order.id, { confirmation_email_sent: false }).catch(() => {});
    }
  }
}