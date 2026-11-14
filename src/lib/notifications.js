// Ukart Notification Service (Supabase + Email + WhatsApp / SMS Fallback)
import { base44 } from '@/api/base44Client';

let _settings = null;

const STATUS_MESSAGES = {
  new: 'has been received and confirmed! We are getting your groceries ready.',
  processing: 'is now being prepared and packed at our Ukart hub.',
  ready: 'is packed and ready for dispatch!',
  on_the_way: 'is out for delivery! Your Ukart rider is on the way to your address.',
  delivered: 'has been delivered! Thank you for shopping with Ukart.',
  cancelled: 'has been cancelled. Reply here if you need any assistance.',
};

export function formatNigerianPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('234')) return digits;
  if (digits.startsWith('0')) return '234' + digits.slice(1);
  return '234' + digits;
}

export function buildOrderMessage(order, statusOverride) {
  const status = statusOverride || order?.status || 'new';
  const note = STATUS_MESSAGES[status] || `status is now: ${status}.`;
  const name = order?.customer_name?.split(' ') || 'Customer';
  const orderNum = order?.order_number || '';
  const total = Number(order?.total || 0).toLocaleString();
  return `Hi ${name}, your Ukart order #${orderNum} (₦${total}) ${note}\n\nTrack your order anytime at https://ukartapp.com`;
}

export function buildWhatsAppUrl(order, statusOverride) {
  const phone = formatNigerianPhone(order?.customer_phone);
  if (!phone) return null;
  const text = encodeURIComponent(buildOrderMessage(order, statusOverride));
  return `https://wa.me{phone}?text=${text}`;
}

export function buildSmsUrl(order, statusOverride) {
  const phone = formatNigerianPhone(order?.customer_phone);
  if (!phone) return null;
  const text = encodeURIComponent(buildOrderMessage(order, statusOverride));
  return `sms:+${phone}?&body=${text}`;
}

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
    _settings = list;
  }
  return _settings;
}

export async function updateNotificationSettings(id, data) {
  _settings = await base44.entities.NotificationSetting.update(id, data);
  return _settings;
}

export async function notifyOrderCreated(orderId) {
  if (!orderId) return;
  try {
    await base44.functions.invoke('orderNotifications', { type: 'created', orderId });
  } catch (e) {
    console.warn('Background email skipped:', e?.message || e);
  }
}

export async function notifyOrderStatusChanged(orderId, newStatus) {
  if (!orderId) return;
  // 1. Update the order status directly in Supabase
  await base44.entities.Order.update(orderId, {
    status: newStatus,
    last_status_notified: newStatus,
  });

  // 2. Fire background email notification (never blocks status update)
  try {
    await base44.functions.invoke('orderNotifications', {
      type: 'status',
      orderId,
      status: newStatus,
    });
  } catch (e) {
    console.warn('Background status email skipped:', e?.message || e);
  }
}
