// Delivery pricing (naira), shared by checkout and the server copy in
// base44/functions/prepareOrder.
//
// The fees and discount percentages are editable by admins in
// /admin/settings/notifications (DeliverySetting entity). The defaults below
// apply until an admin saves their own values.
//
// Base fee: Lagos Island pays island_fee; orders outside Lagos Island pay
// mainland_fee once the subtotal reaches mainland_threshold, otherwise island_fee.
// Discount: first_order_discount_percent off a new customer's first delivery
// (orders from first_order_min_subtotal), repeat_discount_percent off every
// delivery after that.

export const DELIVERY_ZONES = [
  { key: 'island', label: 'Lagos Island' },
  { key: 'mainland', label: 'Outside Lagos Island' },
];

export const DEFAULT_DELIVERY_SETTINGS = {
  island_fee: 3000,
  mainland_fee: 5000,
  mainland_threshold: 10000,
  discounts_enabled: true,
  first_order_discount_percent: 65,
  repeat_discount_percent: 50,
  first_order_min_subtotal: 4900,
};

// Fills any field an admin has not saved yet with its default.
export function resolveDeliverySettings(raw) {
  const resolved = { ...DEFAULT_DELIVERY_SETTINGS };
  if (raw && typeof raw === 'object') {
    Object.keys(DEFAULT_DELIVERY_SETTINGS).forEach((key) => {
      const value = raw[key];
      if (value !== undefined && value !== null && value !== '') {
        resolved[key] = value;
      }
    });
  }
  return resolved;
}

export function getDeliveryBase(subtotal, zone, settings) {
  if (!(subtotal > 0)) return 0;
  const s = resolveDeliverySettings(settings);
  const useMainland =
    zone === 'mainland' && subtotal >= Number(s.mainland_threshold);
  return Number(useMainland ? s.mainland_fee : s.island_fee) || 0;
}

export function getDeliveryDiscountPercent({ subtotal = 0, isFirstOrder = false }, settings) {
  const s = resolveDeliverySettings(settings);
  if (s.discounts_enabled === false) return 0;
  const isSplashFirst =
    isFirstOrder && subtotal >= Number(s.first_order_min_subtotal);
  return Number(
    isSplashFirst ? s.first_order_discount_percent : s.repeat_discount_percent
  ) || 0;
}

export function getDeliveryFee({ subtotal = 0, zone = 'island', isFirstOrder = false, settings = null }) {
  const base = getDeliveryBase(subtotal, zone, settings);
  if (base === 0) return 0;
  const percent = getDeliveryDiscountPercent({ subtotal, isFirstOrder }, settings);
  return Math.round(base * (1 - percent / 100));
}