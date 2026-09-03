import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Plus,
  Trash2,
  Star,
  Loader2,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { toast } from '@/components/ui/use-toast';

function detectBrand(num) {
  const n = (num || '').replace(/\s/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'mastercard';
  if (/^(506|650|651|652)/.test(n)) return 'verve';
  return 'card';
}

function formatCardNumber(v) {
  return (v || '').replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(v) {
  const n = (v || '').replace(/\D/g, '').slice(0, 4);
  if (n.length <= 2) return n;
  return `${n.slice(0, 2)}/${n.slice(2)}`;
}

export default function PaymentMethods() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState({ number: '', holder: '', expiry: '' });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const u = await base44.auth.me();
      setCards(u?.saved_cards || []);
    } catch {}
    setLoading(false);
  };

  const persist = async (list) => {
    setSaving(true);
    try {
      const u = await base44.auth.updateMe({ saved_cards: list });
      setCards(u?.saved_cards || list);
      setSheetOpen(false);
      setForm({ number: '', holder: '', expiry: '' });
      toast({ title: 'Card saved' });
    } catch {
      toast({ title: 'Could not save card', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleAdd = async () => {
    const brand = detectBrand(form.number);
    const digits = form.number.replace(/\s/g, '');
    if (digits.length < 16 || !form.holder.trim() || form.expiry.length < 5) {
      toast({ title: 'Enter valid card details', variant: 'destructive' });
      return;
    }
    const card = {
      id: crypto.randomUUID(),
      holder: form.holder.trim(),
      last4: digits.slice(-4),
      brand,
      expiry: form.expiry,
      is_default: cards.length === 0,
    };
    const prevCards = cards;
    const nextCards = [...cards, card];
    setCards(nextCards);
    setSheetOpen(false);
    setForm({ number: '', holder: '', expiry: '' });
    setSaving(true);
    try {
      const u = await base44.auth.updateMe({ saved_cards: nextCards });
      setCards(u?.saved_cards || nextCards);
      toast({ title: 'Card saved' });
    } catch {
      setCards(prevCards);
      toast({ title: 'Could not save card', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleDelete = (id) => persist(cards.filter((c) => c.id !== id));
  const handleDefault = (id) =>
    persist(cards.map((c) => ({ ...c, is_default: c.id === id })));

  const brandLabel = (b) =>
    b === 'visa' ? 'Visa' : b === 'mastercard' ? 'Mastercard' : b === 'verve' ? 'Verve' : 'Card';

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );

  return (
    <div className="p-4 space-y-4">
      {cards.length === 0 ? (
        <div className="text-center py-10">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No saved cards yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-[#2E7D32]/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#2E7D32]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">
                  {brandLabel(c.brand)} •••• {c.last4}
                </p>
                <p className="text-xs text-gray-500">
                  {c.holder} · Exp {c.expiry}
                </p>
              </div>
              {c.is_default && (
                <span className="text-[11px] font-bold text-amber-600 flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Default
                </span>
              )}
              <div className="flex items-center gap-1">
                {!c.is_default && (
                  <button
                    onClick={() => handleDefault(c.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-amber-500"
                    title="Set as default"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        variant="outline"
        className="w-full h-12 rounded-xl border-dashed border-[#2E7D32]/40 text-[#2E7D32] font-medium"
        onClick={() => setSheetOpen(true)}
      >
        <Plus className="w-4 h-4 mr-1" /> Add New Card
      </Button>

      <div className="bg-[#E8F5E9] rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#2E7D32] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-[#2E7D32]">Paystack Secure Payments</p>
          <p className="text-xs text-[#2E7D32]/80 mt-0.5">
            Online payments via Paystack are coming soon. For now, pay Cash on Delivery at checkout.
          </p>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-w-md mx-auto">
          <SheetHeader>
            <SheetTitle>Add New Card</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6 space-y-3">
            <div>
              <Label className="mb-1.5">Card Number</Label>
              <Input
                value={form.number}
                onChange={(e) =>
                  setForm({ ...form, number: formatCardNumber(e.target.value) })
                }
                placeholder="0000 0000 0000 0000"
                inputMode="numeric"
                className="h-12 rounded-xl"
              />
            </div>
            <div>
              <Label className="mb-1.5">Card Holder Name</Label>
              <Input
                value={form.holder}
                onChange={(e) => setForm({ ...form, holder: e.target.value })}
                placeholder="e.g. Adaeze Okafor"
                className="h-12 rounded-xl"
              />
            </div>
            <div>
              <Label className="mb-1.5">Expiry (MM/YY)</Label>
              <Input
                value={form.expiry}
                onChange={(e) => setForm({ ...form, expiry: formatExpiry(e.target.value) })}
                placeholder="MM/YY"
                inputMode="numeric"
                className="h-12 rounded-xl"
              />
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> We only store the last 4 digits. Your full
              card number is never saved.
            </p>
            <Button
              className="w-full h-12 rounded-xl"
              onClick={handleAdd}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                'Save Card'
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}