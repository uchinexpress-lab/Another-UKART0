// Ukart Notification Service
// Modular and extensible: email channel implemented now; WhatsApp, SMS, and
// push channels can be added by extending the CHANNELS map without touching
// the order creation or status-change call sites.
//
// Reliability: every notification type has its own sent-flag on the Order entity
// (admin_notified, confirmation_email_sent, last_status_notified) to prevent
// duplicate sends for the same event.

import { base44 } from '@/api/base44Client';
import {
  adminNewOrderEmail,
  customerConfirmationEmail,
  statusEmail,
} from '@/lib/emailTemplates';

// --- Settings (cached singleton record) ---
let _settings = null;

export async function getNotificationSettings() {
  if (_settings) return _settings;
  const list = await base44.entities.NotificationSetting.list();
  if (list.length === 0) {
    _settings = await base44.entities.NotificationSetting.create({
      business_email: 'ukartfreshventures@gmail.com',
      enable_business_email: true,
      enable_customer_confirmation: true,
      enable_customer_status_emails: true,
    });
  } else {
    _settings = list[0];
  }
  return _settings;
}

export async function updateNotificationSettings(id, data) {
  _settings = await base44.entities.NotificationSetting.update(id, data);
  return _settings;
}

// --- Email channel ---
const emailChannel = {
  async sendAdminNewOrder(order, businessEmail) {
    const html = adminNewOrderEmail(order);
    await base44.integrations.Core.SendEmail({
      to: businessEmail,
      subject: `\uD83D\uDED2 New Ukart Order #${order.order_number}`,
      body: html,
    });
  },
  async sendCustomerConfirmation(order, customerEmail) {
    const html = customerConfirmationEmail(order);
    await base44.integrations.Core.SendEmail({
      to: customerEmail,
      subject: `\u2705 Your Ukart Order #${order.order_number} Has Been Received`,
      body: html,
    });
  },
  async sendStatusUpdate(order, status) {
    const template = statusEmail(order, status);
    if (!template) return;
    await base44.integrations.Core.SendEmail({
      to: order.customer_email,
      subject: template.subject,
      body: template.html,
    });
  },
};

// Future channels can be added here:
// const whatsappChannel = { async sendStatusUpdate(order, status) { ... } };
// const smsChannel = { ... };
// Then included in CHANNELS and gated by their own settings flags.

const CHANNELS = {
  email: emailChannel,
};

// --- Public API ---

// Called after an order is successfully created. Sends the admin notification
// and the customer confirmation, each independently guarded against duplicates.
export async function notifyOrderCreated(order, customerEmail) {
  if (!order) return;
  const settings = await getNotificationSettings();

  // 1. Admin / business email
  if (settings.enable_business_email && !order.admin_notified) {
    try {
      await emailChannel.sendAdminNewOrder(order, settings.business_email);
      await base44.entities.Order.update(order.id, { admin_notified: true });
    } catch (e) {
      console.error('Admin order notification failed:', e);
    }
  }

  // 2. Customer confirmation email
  if (
    settings.enable_customer_confirmation &&
    customerEmail &&
    !order.confirmation_email_sent
  ) {
    try {
      await emailChannel.sendCustomerConfirmation(order, customerEmail);
      await base44.entities.Order.update(order.id, {
        confirmation_email_sent: true,
        last_status_notified: 'new',
      });
    } catch (e) {
      console.error('Customer confirmation email failed:', e);
    }
  }
}

// Called when an admin updates the order status. Sends a status-specific email
// to the customer, guarded by last_status_notified to prevent duplicates.
export async function notifyOrderStatusChanged(orderId, newStatus) {
  if (newStatus === 'new') return; // handled by confirmation email
  const settings = await getNotificationSettings();
  if (!settings.enable_customer_status_emails) return;

  const order = await base44.entities.Order.get(orderId);
  if (!order || !order.customer_email) return;
  if (order.last_status_notified === newStatus) return; // prevent duplicates

  try {
    await emailChannel.sendStatusUpdate(order, newStatus);
    await base44.entities.Order.update(orderId, { last_status_notified: newStatus });
  } catch (e) {
    console.error('Status notification failed:', e);
  }
}