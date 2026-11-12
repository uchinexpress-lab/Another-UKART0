// Email template helpers for Ukart order notifications.
// The full email HTML builders live server-side and are sent by the
// orderNotifications backend function. This module keeps the small
// display helpers still used by frontend pages.

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