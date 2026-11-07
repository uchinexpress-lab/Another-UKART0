// Service fee tiers by order subtotal (naira).
// Kept in sync with the server-side copy in base44/functions/prepareOrder.
export function getServiceFee(subtotal) {
  const s = Number(subtotal) || 0;
  if (s < 5000) return 0;
  if (s <= 50000) return 310;
  return 490;
}