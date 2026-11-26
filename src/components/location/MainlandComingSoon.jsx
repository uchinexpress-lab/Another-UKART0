import React, { useState } from 'react';
import { MapPin, Bell, CheckCircle2, Navigation, Sparkles } from 'lucide-react';
import { useLocation } from '@/context/LocationContext';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';

const ISLAND_AREAS = [
  'Ajah',
  'Lekki Phase 1',
  'Chevron',
  'VGC',
  'Sangotedo',
  'Abraham Adesanya',
  'Ikate',
  'Victoria Island',
  'Ikoyi',
  'Oniru',
];

export default function MainlandComingSoon() {
  const { location, setManual, retry, status } = useLocation();
  const [contact, setContact] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const areaName = location?.area || 'your area';

  const handleNotify = async (e) => {
    e.preventDefault();
    if (!contact.trim() || saving) return;
    setSaving(true);
    try {
      await base44.entities.DealAlert.create({
        email: contact.includes('@') ? contact.trim() : '',
        phone: !contact.includes('@') ? contact.trim() : '',
        area: areaName,
        source: 'mainland_waitlist',
      });
    } catch {}
    setSaving(false);
    setSubmitted(true);
    toast({
      title: "You're on the waitlist!",
      description: `We'll notify you as soon as Ukart launches in ${areaName}.`,
    });
  };

  return (
    <div className="px-4 py-8 max-w-md mx-auto">
      <div className="bg-card border border-border rounded-3xl p-6 text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-[#2E7D32]/10 flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-[#2E7D32]" />
        </div>

        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 mb-3">
          <Sparkles className="w-3 h-3" /> Expanding Soon
        </span>

        <h1 className="text-xl font-extrabold text-foreground leading-snug">
          We will be in {areaName} soon!
        </h1>

        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Ukart currently delivers fresh groceries in <strong>30 mins</strong> across{' '}
          <strong>Ajah &amp; Lagos Island</strong>. We&apos;re working fast to launch in your neighborhood next.
        </p>

        {/* Waitlist Form */}
        {submitted ? (
          <div className="mt-5 p-3.5 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center gap-2 text-xs font-bold text-[#2E7D32]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>We&apos;ll notify you as soon as we arrive in {areaName}!</span>
          </div>
        ) : (
          <form onSubmit={handleNotify} className="mt-5 space-y-2.5 text-left">
            <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground block">
              Get notified when we launch in {areaName}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Enter email or WhatsApp number"
                required
                className="uk-input flex-1 text-sm"
              />
              <button
                type="submit"
                disabled={!contact.trim() || saving}
                className="px-4 rounded-xl bg-[#2E7D32] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                <Bell className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : 'Notify Me'}
              </button>
            </div>
          </form>
        )}

        {/* Ordering for Lagos Island or GPS drift */}
        <div className="mt-6 pt-5 border-t border-border space-y-2.5">
          <p className="text-xs text-muted-foreground">
            Delivering to Ajah or Lagos Island instead?
          </p>

          <button
            type="button"
            onClick={() => setShowPicker((v) => !v)}
            className="w-full py-2.5 px-4 rounded-xl bg-secondary text-foreground text-xs font-bold hover:opacity-90 transition-opacity"
          >
            {showPicker ? 'Hide Lagos Island areas' : 'Select a Lagos Island area'}
          </button>

          {showPicker && (
            <div className="grid grid-cols-2 gap-2 pt-2 text-left">
              {ISLAND_AREAS.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => setManual(area)}
                  className="px-3 py-2 rounded-xl border border-border bg-background hover:border-[#2E7D32] text-xs font-semibold text-foreground transition-colors"
                >
                  {area}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={retry}
            disabled={status === 'requesting'}
            className="w-full py-2 text-[11px] font-semibold text-[#2E7D32] inline-flex items-center justify-center gap-1"
          >
            <Navigation className="w-3 h-3" />
            {status === 'requesting' ? 'Checking GPS location...' : 'Re-check my current GPS location'}
          </button>
        </div>
      </div>
    </div>
  );
}
