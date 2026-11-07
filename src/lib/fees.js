// Service fee tiers by order subtotal (naira).
// Kept in sync with the server-side copy in base44/functions/prepareOrder.
export function getServiceFee(subtotal) {
  const s = Number(subtotal) || 0;
  if (s <= 0) return 0;
  if (s <= 5000) return 560;
  if (s <= 25000) return 865;
  if (s <= 55000) return 1265;
  if (s <= 125000) return 1865;
  return 2665;
}