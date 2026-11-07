import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  resolveDeliverySettings,
  getDeliveryBase,
  getDeliveryDiscountPercent,
  getDeliveryFee,
} from '@/lib/delivery';

// Loads the admin delivery pricing (DeliverySetting) and whether this customer
// is placing a first order, then returns the delivery base fee, the splash
// discount percentage and the fee the customer actually pays.
export default function useDeliveryPricing({ subtotal = 0, zone = 'island' } = {}) {
  const [settings, setSettings] = useState(null);
  const [isFirstOrder, setIsFirstOrder] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.entities.DeliverySetting.filter({}, { limit: 1 });
        setSettings(res.items?.[0] || null);
      } catch {}
      try {
        const me = await base44.auth.me();
        if (!me?.email) return;
        const paid = await base44.entities.Order.filter({
          customer_email: me.email,
          payment_status: 'Paid',
        });
        setIsFirstOrder(!paid || paid.length === 0);
      } catch {}
    })();
  }, []);

  const resolved = resolveDeliverySettings(settings);
  const base = getDeliveryBase(subtotal, zone, resolved);
  const percent = base > 0
    ? getDeliveryDiscountPercent({ subtotal, isFirstOrder }, resolved)
    : 0;
  const fee = getDeliveryFee({ subtotal, zone, isFirstOrder, settings: resolved });

  return { settings: resolved, isFirstOrder, base, percent, fee, discount: base - fee };
}