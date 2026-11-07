// Delivery pricing (naira), shared by checkout and the server copy in
// base44/functions/prepareOrder.
//
// Base fee: Lagos Island is ₦3,000 and any order under ₦10,000 is ₦3,000
// everywhere; every other order is ₦5,000.
// Splash discount: 65% off a new customer's first delivery (orders from ₦4,900),
// 50% off every delivery after that.

export const DELIVERY_ZONES = [
  { key: 'island', label: 'Lagos Island' },
  { key: 'mainland', label: 'Outside Lagos Island' },
];

export function getDeliveryBase(subtotal, zone) {
  if (!(subtotal > 0)) return 0;
  return zone === 'mainland' && subtotal >= 10000 ? 5000 : 3000;
}

export function getDeliveryFee({ subtotal = 0, zone = 'island', isFirstOrder = false }) {
  const base = getDeliveryBase(subtotal, zone);
  if (base === 0) return 0;
  const splashFirst = isFirstOrder && subtotal >= 4900;
  return Math.round(base * (splashFirst ? 0.35 : 0.5));
}