import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Save, CheckCircle2, Truck, Percent } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import {
  DEFAULT_DELIVERY_SETTINGS,
  resolveDeliverySettings,
  getDeliveryFee,
} from '@/lib/delivery';

const feeFields = [
  { key: 'island_fee', label: 'Lagos Island fee (₦)' },
  { key: 'mainland_fee', label: 'Outside Lagos Island fee (₦)' },
  { key: 'mainland_threshold', label: 'Outside fee applies from subtotal (₦)' },
];

const discountFields = [
  { key: 'first_order_discount_percent', label: 'First delivery discount (%)' },
  { key: 'repeat_discount_percent', label: 'Every later delivery discount (%)' },
  { key: 'first_order_min_subtotal', label: 'First delivery discount from subtotal (₦)' },
];

const inputClass =
  'w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#2E7D32]';

export default function DeliveryPricingSettings() {
  const [record, setRecord] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_DELIVERY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.entities.DeliverySetting.filter({}, { limit: 1 });
        const existing = res.items?.[0] || null;
        setRecord(existing);
        setSettings(
          existing
            ? resolveDeliverySettings(existing)
            : { ...DEFAULT_DELIVERY_SETTINGS }
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setField = (key, value) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const payload = {
        island_fee: Number(settings.island_fee) || 0,
        mainland_fee: Number(settings.mainland_fee) || 0,
        mainland_threshold: Number(settings.mainland_threshold) || 0,
        discounts_enabled: settings.discounts_enabled !== false,
        first_order_discount_percent: Number(settings.first_order_discount_percent) || 0,
        repeat_discount_percent: Number(settings.repeat_discount_percent) || 0,
        first_order_min_subtotal: Number(settings.first_order_min_subtotal) || 0,
      };
      if (record?.id) {
        await base44.entities.DeliverySetting.update(record.id, payload);
      } else {
        const created = await base44.entities.DeliverySetting.create(payload);
        setRecord(created);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      toast({ title: 'Could not save delivery settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const islandPreview = getDeliveryFee({ subtotal: 20000, zone: 'island', settings });
  const mainlandPreview = getDeliveryFee({ subtotal: 20000, zone: 'mainland', settings });
  const firstPreview = getDeliveryFee({
    subtotal: 20000,
    zone: 'island',
    isFirstOrder: true,
    settings,
  });

  if (loading) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="w-5 h-5 animate-spin text-[#2E7D32] mx-auto" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-4 mb-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Truck className="w-4 h-4 text-[#2E7D32]" />
        </div>
        <h2 className="text-sm font-bold text-foreground">Delivery Fees by Area</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Set what customers pay for delivery in each area. These amounts are
        charged at checkout.
      </p>

      {feeFields.map((field) => (
        <div key={field.key}>
          <label className="text-xs font-medium text-muted-foreground">{field.label}</label>
          <input
            type="number"
            value={settings[field.key]}
            onChange={(e) => setField(field.key, e.target.value)}
            className={inputClass}
          />
        </div>
      ))}

      <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Percent className="w-4 h-4 text-[#2E7D32]" />
        </div>
        <h2 className="text-sm font-bold text-foreground">Delivery Discounts</h2>
      </div>

      <div className="flex items-start justify-between py-2 border-b border-gray-50">
        <div className="flex-1 pr-3">
          <p className="text-sm font-semibold text-foreground">Delivery Discount</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Take a percentage off every delivery fee
          </p>
        </div>
        <button
          onClick={() => setField('discounts_enabled', settings.discounts_enabled === false)}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
            settings.discounts_enabled !== false ? 'bg-[#2E7D32]' : 'bg-gray-200'
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-card shadow-sm transition-transform ${
              settings.discounts_enabled !== false ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {discountFields.map((field) => (
        <div key={field.key}>
          <label className="text-xs font-medium text-muted-foreground">{field.label}</label>
          <input
            type="number"
            value={settings[field.key]}
            onChange={(e) => setField(field.key, e.target.value)}
            className={inputClass}
          />
        </div>
      ))}

      <p className="text-[11px] text-muted-foreground">
        On a ₦20,000 order customers pay ₦{islandPreview.toLocaleString()} on Lagos
        Island and ₦{mainlandPreview.toLocaleString()} elsewhere; a new customer's
        first delivery is ₦{firstPreview.toLocaleString()}.
      </p>

      <button
        onClick={save}
        disabled={saving}
        className="w-full h-12 rounded-2xl bg-[#2E7D32] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1B5E20] disabled:opacity-50"
      >
        {saving ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
        ) : saved ? (
          <><CheckCircle2 className="w-4 h-4" /> Settings Saved</>
        ) : (
          <><Save className="w-4 h-4" /> Save Delivery Settings</>
        )}
      </button>
    </div>
  );
}