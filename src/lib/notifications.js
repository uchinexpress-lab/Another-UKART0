// Ukart Notification Service
// Order emails are now sent server-side by the orderNotifications backend
// function (service role), which also sets the Order notification flags. This
// module keeps the settings CRUD (used by the admin settings UI) and thin
// wrappers that the checkout / admin order pages call.

import { base44 } from '@/api/base44Client';

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

// Called after an order is created. Sends the admin + customer emails and sets
// the notification flags via the service role (backend).
export async function notifyOrderCreated(orderId) {
  if (!orderId) return;
  try {
    await base44.functions.invoke('orderNotifications', { type: 'created', orderId });
  } catch (e) {
    console.error('Order created notification failed:', e);
  }
}

// Called when an admin updates the order status. Updates the status, sends a
// status-specific email, and sets last_status_notified — all server-side.
export async function notifyOrderStatusChanged(orderId, newStatus) {
  if (!orderId || newStatus === 'new') return;
  try {
    await base44.functions.invoke('orderNotifications', {
      type: 'status',
      orderId,
      status: newStatus,
    });
  } catch (e) {
    console.error('Order status notification failed:', e);
    throw e;
  }
}