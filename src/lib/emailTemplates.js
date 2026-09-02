// Email templates for Ukart order notifications.
// Modular: each export returns HTML string(s) for the notification service.
// Future channels (WhatsApp, SMS, push) can reuse the order data passed in.

const BRAND = {
  name: 'Ukart',
  tagline: 'No Market Wahala!',
  green: '#2E7D32',
  darkGreen: '#1B5E20',
  lightGreen: '#E8F5E9',
};

export function formatCurrency(n) {
  return '\u20A6' + (n || 0).toLocaleString();
}

export function formatDate(dateStr) {
  if (!dateStr) return '\u2014';
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString('en-NG', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) +
    ' \u00B7 ' +
    d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
  );
}

export function getStatusLabel(status) {
  const labels = {
    new: 'Order Placed',
    processing: 'Being Prepared',
    ready: 'Ready for Delivery',
    on_the_way: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
}

function getAppUrl() {
  return typeof window !== 'undefined' ? window.location.origin : '';
}

function emailShell(content) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:${BRAND.green};padding:24px 20px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:0.5px;">\uD83D\uDED2 ${BRAND.name}</h1>
      <p style="color:#C8E6C9;margin:4px 0 0;font-size:13px;">${BRAND.tagline} \uD83D\uDCA1</p>
    </div>
    <div style="background:#fff;padding:28px 24px;border-radius:0 0 12px 12px;">
      ${content}
    </div>
    <p style="text-align:center;color:#aaa;font-size:11px;margin:16px 0 0;">This is an automated email from ${BRAND.name}. Please do not reply.</p>
  </div>
</body></html>`;
}

function itemsTable(items) {
  if (!items || !items.length) return '<p style="color:#666;font-size:14px;">No items</p>';
  const rows = items
    .map(
      (i) => `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;">${i.quantity}x ${i.name}${i.unit ? ` <span style="color:#999;font-size:12px;">(${i.unit})</span>` : ''}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;text-align:right;white-space:nowrap;">${formatCurrency((i.price || 0) * (i.quantity || 1))}</td>
    </tr>`
    )
    .join('');
  return `<table style="width:100%;border-collapse:collapse;margin:12px 0;">
    <tr style="background:${BRAND.lightGreen};"><th style="padding:8px 12px;text-align:left;font-size:12px;color:${BRAND.darkGreen};">Item</th><th style="padding:8px 12px;text-align:right;font-size:12px;color:${BRAND.darkGreen};">Price</th></tr>
    ${rows}
  </table>`;
}

function infoRow(label, value) {
  return `<tr><td style="padding:6px 0;font-size:13px;color:#999;width:40%;vertical-align:top;">${label}</td><td style="padding:6px 0;font-size:13px;color:#333;font-weight:500;">${value || '\u2014'}</td></tr>`;
}

function button(href, label) {
  return `<a href="${href}" style="display:inline-block;background:${BRAND.green};color:#fff;text-decoration:none;font-weight:bold;padding:13px 36px;border-radius:8px;font-size:14px;margin:8px 0;">${label}</a>`;
}

// --- Admin: New Order Email ---
export function adminNewOrderEmail(order) {
  const appUrl = getAppUrl();
  const viewOrderUrl = `${appUrl}/admin/orders?order=${order.order_number}`;
  const content = `
    <h2 style="margin:0 0 4px;color:${BRAND.green};font-size:20px;">New Order Received! \uD83D\uDED2</h2>
    <p style="margin:0 0 20px;color:#666;font-size:14px;">A new order has been placed on ${BRAND.name}.</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">${infoRow('Order Number', order.order_number)}${infoRow('Order Date', formatDate(order.created_date))}${infoRow('Customer Name', order.customer_name)}${infoRow('Customer Email', order.customer_email)}${infoRow('Customer Phone', order.customer_phone)}${infoRow('Delivery Address', order.customer_address)}${infoRow('Landmark', order.landmark)}${infoRow('Payment Method', order.payment_method || 'Cash on Delivery')}${infoRow('Payment Status', order.payment_status || 'Pending')}</table>
    <h3 style="margin:20px 0 4px;font-size:15px;color:#333;">Items Ordered</h3>
    ${itemsTable(order.items)}
    <table style="width:100%;border-collapse:collapse;margin-top:8px;">${infoRow('Subtotal', formatCurrency(order.subtotal))}${infoRow('Delivery Fee', order.delivery_fee === 0 ? 'FREE' : formatCurrency(order.delivery_fee))}<tr><td style="padding:10px 0;font-size:15px;color:${BRAND.green};font-weight:bold;">Total</td><td style="padding:10px 0;font-size:18px;color:${BRAND.green};font-weight:bold;text-align:right;">${formatCurrency(order.total)}</td></tr></table>
    <div style="text-align:center;margin-top:20px;">${button(viewOrderUrl, 'View Order')}</div>`;
  return emailShell(content);
}

// --- Customer: Order Confirmation Email ---
export function customerConfirmationEmail(order) {
  const appUrl = getAppUrl();
  const trackUrl = `${appUrl}/track?order=${order.order_number}`;
  const content = `
    <h2 style="margin:0 0 8px;color:${BRAND.green};font-size:20px;">Thank You for Your Order! \u2705</h2>
    <p style="margin:0 0 20px;color:#444;font-size:14px;line-height:1.6;">Hi ${order.customer_name || 'there'},<br><br>We've received your order and our team is getting it ready. Here's a summary of your purchase:</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">${infoRow('Order Number', order.order_number)}${infoRow('Order Date', formatDate(order.created_date))}${infoRow('Current Status', getStatusLabel(order.status))}${infoRow('Est. Delivery', 'Within 2-4 hours (Lagos same-day)')}</table>
    <h3 style="margin:20px 0 4px;font-size:15px;color:#333;">Your Items</h3>
    ${itemsTable(order.items)}
    <table style="width:100%;border-collapse:collapse;margin-top:8px;">${infoRow('Subtotal', formatCurrency(order.subtotal))}${infoRow('Delivery Fee', order.delivery_fee === 0 ? 'FREE' : formatCurrency(order.delivery_fee))}<tr><td style="padding:10px 0;font-size:15px;color:${BRAND.green};font-weight:bold;">Total</td><td style="padding:10px 0;font-size:18px;color:${BRAND.green};font-weight:bold;text-align:right;">${formatCurrency(order.total)}</td></tr></table>
    <table style="width:100%;border-collapse:collapse;margin-top:16px;">${infoRow('Delivery Address', order.customer_address)}${infoRow('Landmark', order.landmark)}${infoRow('Phone', order.customer_phone)}</table>
    <div style="text-align:center;margin-top:24px;">${button(trackUrl, 'Track My Order')}</div>
    <p style="margin:16px 0 0;color:#999;font-size:12px;text-align:center;">Keep your phone available \u2014 our rider will call you on arrival.</p>`;
  return emailShell(content);
}

// --- Customer: Order Status Update Email ---
const STATUS_TEMPLATES = {
  processing: {
    subject: '\uD83D\uDCE6 Your Ukart Order #{ORDER} Is Being Prepared',
    title: 'Your Order Is Being Prepared',
    message:
      'Your groceries are being carefully packed by our team. We\u2019ll let you know as soon as they\u2019re ready for delivery.',
    showEta: true,
  },
  ready: {
    subject: '\u2705 Your Ukart Order #{ORDER} Is Ready for Delivery',
    title: 'Your Order Is Ready for Delivery',
    message:
      'Great news! Your order is packed and ready. A rider will pick it up shortly.',
    showEta: true,
  },
  on_the_way: {
    subject: '\uD83D\uDE9A Your Ukart Order #{ORDER} Is Out for Delivery',
    title: 'Your Order Is Out for Delivery',
    message:
      'Your Ukart order is now out for delivery. Please keep your phone available for the delivery rider.',
    showEta: true,
  },
  delivered: {
    subject: '\uD83C\uDF89 Your Ukart Order #{ORDER} Has Been Delivered',
    title: 'Your Order Has Been Delivered',
    message:
      'Your order has been delivered. Enjoy your groceries! We\u2019d love to hear how it went \u2014 please rate your delivery below.',
    showEta: false,
  },
  cancelled: {
    subject: '\u274C Your Ukart Order #{ORDER} Has Been Cancelled',
    title: 'Your Order Has Been Cancelled',
    message:
      'Your order has been cancelled. If you did not request this, please contact our support team.',
    showEta: false,
  },
};

export function statusEmail(order, status) {
  const template = STATUS_TEMPLATES[status];
  if (!template) return null;
  const appUrl = getAppUrl();
  const trackUrl = `${appUrl}/track?order=${order.order_number}`;
  const rateUrl = `${appUrl}/notifications`;
  const supportUrl = `${appUrl}/tickets`;
  const actionHtml =
    status === 'delivered'
      ? button(rateUrl, 'Rate Your Delivery')
      : status === 'cancelled'
      ? button(supportUrl, 'Contact Support')
      : button(trackUrl, 'Track My Order');
  const subject = template.subject.replace('{ORDER}', order.order_number);
  const content = `
    <h2 style="margin:0 0 8px;color:${BRAND.green};font-size:20px;">${template.title}</h2>
    <p style="margin:0 0 8px;color:#444;font-size:14px;line-height:1.6;">Hi ${order.customer_name || 'there'},</p>
    <p style="margin:0 0 20px;color:#444;font-size:14px;line-height:1.6;">${template.message}</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">${infoRow('Order Number', order.order_number)}${template.showEta ? infoRow('Estimated Delivery', '30-60 minutes (Lagos)') : ''}${infoRow('Delivery Address', order.customer_address)}</table>
    <div style="text-align:center;margin-top:20px;">${actionHtml}</div>
    <p style="margin:16px 0 0;color:#999;font-size:12px;text-align:center;">Thank you for choosing Ukart. No Market Wahala! \uD83D\uDCA1</p>`;
  return { subject, html: emailShell(content) };
}