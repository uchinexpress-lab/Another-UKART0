import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { base44 } from '@/api/base44Client';
import { notifyOrderCreated } from '@/lib/notifications';
import { ArrowLeft, MapPin, Navigation, Phone, User, Loader2, ShoppingBag, Tag, History, X, CreditCard, Lock, ChevronRight } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const REWARD_AMOUNT = 1000;

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const deliveryFee = total > 0 ? (total > 30000 ? 0 : 1500) : 0;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [placing, setPlacing] = useState(false);
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [rewardRef, setRewardRef] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucher, setVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState('');
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('Pay Online');
  const [createdOrderId, setCreatedOrderId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!me?.id) return;
        const asReferred = await base44.entities.Referral.filter({
          referred_user_id: me.id,
          status: 'first_order_placed',
          referred_rewarded: false,
        });
        if (asReferred.length > 0) {
          setReferralDiscount(asReferred[0].reward_amount || REWARD_AMOUNT);
          setRewardRef({ id: asReferred[0].id, type: 'referred' });
          return;
        }
        const asReferrer = await base44.entities.Referral.filter({
          referrer_id: me.id,
          status: 'first_order_placed',
          referrer_rewarded: false,
        });
        if (asReferrer.length > 0) {
          setReferralDiscount(asReferrer[0].reward_amount || REWARD_AMOUNT);
          setRewardRef({ id: asReferrer[0].id, type: 'referrer' });
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!me?.email) return;
        const prev = await base44.entities.Order.filter(
          { customer_email: me.email },
          '-created_date',
          50
        );
        const seen = new Set();
        const addrs = [];
        prev.forEach((o) => {
          const key = `${o.customer_name}|${o.customer_phone}|${o.customer_address}|${o.landmark}`;
          if (o.customer_address && !seen.has(key)) {
            seen.add(key);
            addrs.push({
              name: o.customer_name,
              phone: o.customer_phone,
              address: o.customer_address,
              landmark: o.landmark,
            });
          }
        });
        setSavedAddresses(addrs);
        if (addrs.length > 0) {
          setName(addrs[0].name || '');
          setPhone(addrs[0].phone || '');
          setAddress(addrs[0].address || '');
          setLandmark(addrs[0].landmark || '');
        }
      } catch {}
    })();
  }, []);

  const voucherDiscount = voucher
    ? voucher.discount_type === 'fixed_amount'
      ? Math.min(voucher.discount_amount || 0, total)
      : Math.round((total * (voucher.discount_percent || 0)) / 100)
    : 0;
  const appliedDiscount = Math.min(referralDiscount + voucherDiscount, total);
  const grandTotal = total - appliedDiscount + deliveryFee;

  const canPlace = name.trim() && phone.trim() && address.trim() && landmark.trim() && !placing;

  const applyVoucher = async () => {
    setVoucherError('');
    if (!voucherCode.trim()) return;
    try {
      const me = await base44.auth.me();
      const found = await base44.entities.Voucher.filter({
        code: voucherCode.trim().toUpperCase(),
        active: true,
      });
      if (found.length === 0) {
        setVoucherError('Invalid or expired voucher code');
        return;
      }
      const v = found[0];
      if (v.max_uses && (v.uses || 0) >= v.max_uses) {
        setVoucherError('This voucher has reached its usage limit');
        return;
      }
      if (v.assigned_to_email && v.assigned_to_email !== me?.email) {
        setVoucherError('This voucher is not available for your account');
        return;
      }
      if (v.expiry_date && new Date(v.expiry_date) < new Date()) {
        setVoucherError('This voucher has expired');
        return;
      }
      setVoucher(v);
    } catch {
      setVoucherError('Could not validate voucher');
    }
  };

  const applySaved = (a) => {
    setName(a.name || '');
    setPhone(a.phone || '');
    setAddress(a.address || '');
    setLandmark(a.landmark || '');
  };

  const placeOrder = async () => {
    if (!canPlace) return;
    setPlacing(true);
    try {
      let orderId = createdOrderId;

      if (!orderId) {
        // The server authors the order — prices, totals, voucher and referral
        // validation all happen server-side. The client only sends the cart
        // (product_id + variant + quantity), voucher code, and delivery details.
        const res = await base44.functions.invoke('prepareOrder', {
          items: items.map((i) => ({
            product_id: i.product_id || (i.id || '').split('__')[0],
            variant_label: i.variant_label || i.details || '',
            quantity: i.quantity,
          })),
          voucherCode: voucher ? voucher.code : '',
          customer_name: name,
          customer_phone: phone,
          customer_address: address,
          landmark,
        });
        orderId = res.data?.orderId;
        if (!orderId) {
          throw new Error(res.data?.error || 'Could not prepare order');
        }
        setCreatedOrderId(orderId);

        const serverTotal = res.data?.total;
        if (serverTotal != null && serverTotal !== grandTotal) {
          toast({ title: 'Order total adjusted', description: `Final total: ₦${serverTotal.toLocaleString()}` });
        }

        try { await notifyOrderCreated(orderId); } catch (e) { console.error('Notification error:', e); }
      }

      // Initiate Paystack payment — amount is recalculated server-side from the stored order
      const callbackUrl = `${window.location.origin}/payment/callback`;
      const res = await base44.functions.invoke('initiatePaystackPayment', { orderId, callbackUrl });

      if (res.data?.authorization_url) {
        window.location.href = res.data.authorization_url;
      } else {
        throw new Error('Could not initialize payment');
      }
    } catch (e) {
      setPlacing(false);
      const msg = e?.response?.data?.error || e?.message || 'Could not start payment. Please try again.';
      alert(msg);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <ShoppingBag className="w-10 h-10 text-[#2E7D32]" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">Your cart is empty</h2>
        <p className="text-sm text-muted-foreground mb-4">Add items before checking out</p>
        <Link to="/" className="bg-[#2E7D32] text-white text-sm font-bold px-6 py-3 rounded-full">
          Start Shopping
        </Link>
      </div>
    );
  }

  const fieldClass =
    'w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#2E7D32]';
  const labelClass = 'text-xs font-semibold text-gray-600 flex items-center gap-1.5 mb-1.5';

  return (
    <div className="p-4 pb-44">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => (step === 2 ? setStep(1) : navigate(-1))} className="p-1.5 -ml-1.5 rounded-full hover:bg-black/5">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Checkout</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center mb-5">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-[#2E7D32] text-white' : 'bg-muted text-muted-foreground'}`}>1</div>
          <span className={`text-sm font-semibold ${step >= 1 ? 'text-foreground' : 'text-muted-foreground'}`}>Delivery</span>
        </div>
        <div className={`flex-1 h-0.5 mx-2 rounded ${step >= 2 ? 'bg-[#2E7D32]' : 'bg-border'}`} />
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-[#2E7D32] text-white' : 'bg-muted text-muted-foreground'}`}>2</div>
          <span className={`text-sm font-semibold ${step >= 2 ? 'text-foreground' : 'text-muted-foreground'}`}>Payment</span>
        </div>
      </div>

      {/* Cart summary */}
      <div className="bg-card rounded-2xl border border-border p-3 mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">
            {items.reduce((s, i) => s + i.quantity, 0)} items
          </span>
          <span className="font-bold text-[#2E7D32]">
            ₦{grandTotal.toLocaleString()}
          </span>
        </div>
        {referralDiscount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-[#2E7D32] font-medium mb-2">
            <Tag className="w-3.5 h-3.5" /> Referral reward −₦{Math.min(referralDiscount, total).toLocaleString()} applied
          </div>
        )}
        {voucherDiscount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-[#2E7D32] font-medium mb-2">
            <Tag className="w-3.5 h-3.5" /> Voucher {voucher.code} −₦{voucherDiscount.toLocaleString()} applied
          </div>
        )}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {items.map((i) => (
            <img
              key={i.id}
              src={i.image}
              alt={i.name}
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
            />
          ))}
        </div>
      </div>

      {/* Step 1: Delivery address */}
      {step === 1 && (
        <>
          {savedAddresses.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
                <History className="w-3.5 h-3.5" /> Use a saved address
              </p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {savedAddresses.map((a, i) => (
                  <button
                    key={i}
                    onClick={() => applySaved(a)}
                    className="flex-shrink-0 text-left text-xs bg-card border border-border rounded-xl px-3 py-2 w-44 active:scale-95 transition-transform"
                  >
                    <span className="font-semibold text-foreground block line-clamp-1">{a.name}</span>
                    <span className="text-muted-foreground line-clamp-2">{a.address}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
            <div>
              <label className={labelClass}>
                <User className="w-3.5 h-3.5" /> Full Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Adaeze Okafor"
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                <MapPin className="w-3.5 h-3.5" /> House Address
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House/flat number, street name, area"
                rows={2}
                className={`${fieldClass} resize-none`}
              />
            </div>
            <div>
              <label className={labelClass}>
                <Navigation className="w-3.5 h-3.5" /> Landmark
              </label>
              <input
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. opposite Total filling station"
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                <Phone className="w-3.5 h-3.5" /> Phone Number
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0803 123 4567"
                inputMode="tel"
                className={fieldClass}
              />
            </div>
          </div>
        </>
      )}

      {/* Step 2: Payment method */}
      {step === 2 && (
        <>
          <div className="bg-card rounded-2xl border border-border p-4 mb-4">
            <p className="text-sm font-bold text-foreground mb-3">Payment Method</p>
            <div className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-[#2E7D32] bg-[#2E7D32]/5">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#2E7D32]">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Pay Online</p>
                <p className="text-xs text-muted-foreground">Pay with card, bank transfer, or USSD via Paystack</p>
              </div>
              <div className="w-5 h-5 rounded-full border-2 border-[#2E7D32] flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2E7D32]" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-muted-foreground">
              <Lock className="w-3 h-3" /> Secured by Paystack
            </div>
          </div>

          {/* Voucher / Promo code */}
          <div className="bg-card rounded-2xl border border-border p-4 mb-4">
            <label className={labelClass}>
              <Tag className="w-3.5 h-3.5" /> Voucher / Promo Code
            </label>
            {voucher ? (
              <div className="flex items-center justify-between bg-primary/10 rounded-xl px-3 py-2.5">
                <span className="text-sm font-semibold text-[#2E7D32]">
                  {voucher.code} ({voucher.discount_type === 'fixed_amount' ? `₦${(voucher.discount_amount || 0).toLocaleString()} off` : `${voucher.discount_percent}% off`})
                </span>
                <button
                  onClick={() => {
                    setVoucher(null);
                    setVoucherCode('');
                  }}
                  className="text-[#2E7D32]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="Enter code"
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#2E7D32]"
                />
                <button
                  onClick={applyVoucher}
                  className="px-4 rounded-xl bg-[#2E7D32] text-white text-sm font-semibold"
                >
                  Apply
                </button>
              </div>
            )}
            {voucherError && <p className="text-xs text-red-500 mt-1.5">{voucherError}</p>}
          </div>

          {/* Order summary */}
          <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
            <p className="text-sm font-bold text-foreground mb-1">Order Summary</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground font-medium">₦{total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery fee</span>
              <span className="text-foreground font-medium">{deliveryFee === 0 ? 'Free' : `₦${deliveryFee.toLocaleString()}`}</span>
            </div>
            {appliedDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount {voucher ? `(${voucher.code})` : ''}</span>
                <span className="text-[#2E7D32] font-semibold">−₦{appliedDiscount.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="text-sm font-bold text-foreground">Total</span>
              <span className="text-lg font-bold text-[#2E7D32]">₦{grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </>
      )}

      {/* Bottom action bar */}
      <div
        className="fixed left-0 right-0 max-w-md mx-auto px-4 py-3 bg-card border-t border-border"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 76px)' }}
      >
        {step === 1 ? (
          <button
            onClick={() => setStep(2)}
            disabled={!canPlace}
            className="w-full h-12 rounded-2xl bg-[#2E7D32] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1B5E20] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Payment <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={placeOrder}
            disabled={!canPlace}
            className="w-full h-12 rounded-2xl bg-[#2E7D32] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1B5E20] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {placing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Placing order...
              </>
            ) : (
              <>Pay ₦{grandTotal.toLocaleString()}</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}