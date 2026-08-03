import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Package, Tag, Sparkles, Truck } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';

const DEFAULTS = {
  order_updates: true,
  promotions: true,
  new_products: true,
  delivery_updates: true,
  push_enabled: true,
};

const ITEMS = [
  { key: 'order_updates', label: 'Order Updates', desc: 'Status changes on your orders', icon: Package },
  { key: 'delivery_updates', label: 'Delivery Updates', desc: 'Rider dispatch and arrival alerts', icon: Truck },
  { key: 'promotions', label: 'Promotions & Discounts', desc: 'Deals, offers and seasonal sales', icon: Tag },
  { key: 'new_products', label: 'New Products', desc: 'Fresh arrivals and restocks', icon: Sparkles },
];

export default function Notifications() {
  const [prefs, setPrefs] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth
      .me()
      .then((u) => setPrefs({ ...DEFAULTS, ...(u?.notification_preferences || {}) }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (key) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    try {
      await base44.auth.updateMe({ notification_preferences: next });
    } catch {
      setPrefs(prefs);
      toast({ title: 'Could not update preference', variant: 'destructive' });
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.key} className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 rounded-xl bg-[#2E7D32]/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-[#2E7D32]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <Switch
                checked={!!prefs[item.key]}
                onCheckedChange={() => toggle(item.key)}
              />
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#2E7D32]/10 flex items-center justify-center">
          <Truck className="w-5 h-5 text-[#2E7D32]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">Push Notifications</p>
          <p className="text-xs text-gray-500">Receive push alerts on this device</p>
        </div>
        <Switch
          checked={!!prefs.push_enabled}
          onCheckedChange={() => toggle('push_enabled')}
        />
      </div>

      <p className="text-xs text-gray-400 text-center px-6">
        You'll still receive order confirmation emails for any placed order.
      </p>
    </div>
  );
}