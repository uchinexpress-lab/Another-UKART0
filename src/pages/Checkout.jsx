import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { Clock, MapPin, Navigation, Phone, User, Loader2, ShoppingBag, Tag, History, X, CreditCard, Lock, Truck } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { getServiceFee } from '@/lib/fees';
import AddressAutocomplete from '@/components/checkout/AddressAutocomplete';
import {
  getDeliveryFee,
  getDeliveryBase,
  getDeliveryDiscountPercent,
  resolveDeliverySettings,
} from '@/lib/delivery';

const REWARD_AMOUNT = 1000;

const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
if (!PAYSTACK_KEY) {
  console.warn('[Ukart] VITE_PAYSTACK_PUBLIC_KEY is missing — Paystack checkout will not work. Add it to your .env file.');
}

function loadPaystackScript() {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) return resolve(window.PaystackPop);
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => resolve(window.PaystackPop);
    script.onerror = () => reject(new Error('Could not load Paystack. Check your internet connection.'));
    document.head.appendChild(script);
  });
}

function generateReference() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `ukart-${ts}-${rand}`;
}

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [zone, setZone] = useState('island');
  const [placing, setPlacing] = useState(false);
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [rewardRef, setRewardRef] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucher, setVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState('');
  const [promoSettings, setPromoSettings] = useState(null);
  const [isFirstOrder, setIsFirstOrder] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState(null);

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
          setReferralDiscount(asReferred[0].reward_amount || REWARD_AMOUNT);
          setRewardRef({ id: asReferred[0].id, type: 'referrer' });
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const promoRes = await base44.entities.PromotionSetting.filter({}, { limit: 1 });
        setPromoSettings(promoRes.items?.[0] || null);
      } catch {}
      try {
        const deliveryRes = await base44.entities.DeliverySetting.filter({}, { limit: 1 });
        setDeliverySettings(deliveryRes.items?.[0] || null);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!me?.email) return;
        const paidOrders = await base44.entities.Order.filter({
          customer_email: me.email,
          payment_status: 'Paid',
        });
        setIsFirstOrder(!paidOrders || paidOrders.length === 0);
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
              altPhone: o.alternate_phone,
              address: o.customer_address,
              landmark: o.landmark,
            });
          }
        });
        setSavedAddresses(addrs);
      } catch {}
    })();
  }, []);

  const firstOrderEligible = isFirstOrder && promoSettings?.first_order_enabled !== false;
  const firstOrderDiscount = firstOrderEligible ? (promoSettings?.first_order_discount || 500) : 0;

  const voucherDiscount = voucher
    ? voucher.discount_type === 'fixed_amount'
      ? Math.min(voucher.discount_amount || 0, total)
      : Math.round((total * (voucher.discount_percent || 0)) / 100)
    : 0;
  const appliedDiscount = Math.min(referralDiscount + voucherDiscount + firstOrderDiscount, total);
  const deliveryFee = getDeliveryFee({
    subtotal: total,
    zone,
    isFirstOrder,
    settings: deliverySettings,
  });
  const deliveryDiscountPercent = getDeliveryDiscountPercent(
    { subtotal: total, isFirstOrder },
    deliverySettings
  );
  const feeSettings = resolveDeliverySettings(deliverySettings);
  const deliveryBase = getDeliveryBase(total, zone, feeSettings);
  const deliveryDiscount = deliveryBase - deliveryFee;
  const serviceFee = getServiceFee(total);
  const grandTotal = total - appliedDiscount + deliveryFee + serviceFee;

  const canPlace = name.trim() && phone.trim() && address.trim() && landmark.trim() && !placing;

  const applyVoucher = async () => {
    setVoucherError('');
    if (!voucherCode.trim()) return;
    try {
      const res = await base44.functions.invoke('validateVoucher', {
        code: voucherCode.trim(),
      });
      if (!res.data?.valid) {
        setVoucherError(res.data?.error || 'Invalid or expired voucher code');
        return;
      }
      setVoucher(res.data);
    } catch {
      setVoucherError('Could not validate voucher');
    }
  };

  const applySaved = (a) => {
    setName(a.name || '');
    setPhone(a.phone || '');
    setAltPhone(a.altPhone || '');
    setAddress(a.address || '');
    setLandmark(a.landmark || '');
  };

  const placeOrder = async () => {
    if (!canPlace) return;
    if (!PAYSTACK_KEY) {
      alert('Payment is not configured. Please contact support.');
      return;
    }
    setPlacing(true);
    try {
      // 1. Get the current user's email
      const me = await base44.auth.me();
      if (!me?.email) {
        throw new Error('Please sign in to place an order.');
      }

      // 2. Create the pending order directly in Supabase
      const orderItems = items.map((i) => {
        const packageId =
          i.package_id || (String(i.id).startsWith('mealkit-') ? String(i.id).slice(8).split('-')[0] : '');
        return {
          product_id: packageId ? '' : i.product_id || (i.id || '').split('__')[0],
          package_id: packageId || '',
          name: i.name || '',
          price: i.price || 0,
          unit: i.variant_label || i.details || i.size_label || '',
          variant_label: packageId ? '' : i.variant_label || i.details || '',
          size_label: i.size_label || '',
          protein_names: i.protein_names || [],
          selections: i.selections || [],
          quantity: i.quantity,
          addons_total: i.addons_total || 0,
          addon_ids: packageId
            ? i.addon_ids || []
            : (i.addons || []).map((a) => a.id),
          image: i.image || '',
        };
      });

      const reference = generateReference();
      const orderNumber = `UK-${Date.now().toString().slice(-8)}`;

      const { data: order, error: insertError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          items: orderItems,
          subtotal: total,
          delivery_fee: deliveryFee,
          service_fee: serviceFee,
          discount: appliedDiscount,
          voucher_code: voucher ? voucher.code : null,
          voucher_id: voucher ? voucher.id : null,
          total: grandTotal,
          customer_name: name,
          customer_email: me.email,
          customer_phone: phone,
          alternate_phone: altPhone,
          customer_address: address,
          landmark,
          delivery_zone: zone,
          payment_method: 'Pay Online',
          payment_status: 'Pending',
          status: 'awaiting_payment',
          is_first_order: isFirstOrder,
          first_order_discount: firstOrderDiscount,
          referral_id: rewardRef ? rewardRef.id : null,
          referral_type: rewardRef ? rewardRef.type : null,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message || 'Could not create order');
      }

      // 3. Launch Paystack Inline checkout
      const totalInKobo = Math.round(grandTotal * 100);
      const PaystackPop = await loadPaystackScript();

      const handler = new PaystackPop();
      handler.newTransaction({
        key: PAYSTACK_KEY,
        email: me.email,
        amount: totalInKobo,
        reference,
        currency: 'NGN',
        metadata: {
          custom_fields: [
            { display_name: 'Order Number', variable_name: 'order_number', value: orderNumber },
            { display_name: 'Customer Name', variable_name: 'customer_name', value: name },
          ],
        },
        onSuccess: async (transaction) => {
          try {
            // 4. Mark the order as paid
            const { error: rpcError } = await supabase.rpc('mark_order_paid', {
              p_order_id: order.id,
              p_reference: transaction.reference,
              p_transaction_id: transaction.transaction_id || null,
            });
            if (rpcError) throw rpcError;

            // 5. Clear cart and navigate to order confirmation
            clearCart();
            navigate(`/orders/${order.id}/payment-success`, { replace: true });
          } catch (err) {
            console.error('Failed to mark order paid:', err);
            setPlacing(false);
            alert('Payment succeeded but we could not confirm it. Your order is saved. Please check your orders.');
            navigate(`/orders/${order.id}`, { replace: true });
          }
        },
        onCancel: () => {
          setPlacing(false);
          toast({
            title: 'Payment cancelled',
            description: 'Your order is saved. You can retry payment from your orders.',
          });
        },
        onError: (error) => {
          console.error('Paystack error:', error);
          setPlacing(false);
          alert('Payment failed: ' + (error?.message || 'Please try again.'));
        },
      });
    } catch (e) {
      setPlacing(false);
      const msg = e?.message || 'Could not start payment. Please try again.';
      alert(msg);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <ShoppingBag className="w-10 h-10 text-retail" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">Your cart is empty</h2>
        <p className="text-sm text-muted-foreground mb-4">Add items before checking out</p>
        <Link to="/" className="bg-retail text-white text-sm font-bold px-6 py-3 rounded-full">
          Start Shopping
        </Link>
      </div>
    );
  }

  const fieldClass = 'uk-input';
  const labelClass = 'text-[11px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5 mb-1.5';

  return (
    <div className="p-4 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="uk-title">Checkout</h2>
      </div>

      {/* Cart summary */}
      <div className="uk-card p-3.5 mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">
            {items.reduce((s, i) => s + i.quantity, 0)} items
          </span>
          <span className="font-bold text-retail">
            ₦{grandTotal.toLocaleString()}
          </span>
        </div>
        {firstOrderDiscount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-retail font-medium mb-2">
            <Tag className="w-3.5 h-3.5" /> First order −₦{firstOrderDiscount.toLocaleString()} applied
          </div>
        )}
        {referralDiscount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-retail font-medium mb-2">
            <Tag className="w-3.5 h-3.5" /> Referral reward −₦{Math.min(referralDiscount, total).toLocaleString()} applied
          </div>
        )}
        {voucherDiscount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-retail font-medium mb-2">
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

      {/* 1. Delivery address */}
      <p className="uk-section-label mb-2">1. Delivery address</p>

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

      <div className="uk-card p-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="uk-icon-btn">
            <Truck className="w-[18px] h-[18px]" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-foreground">
              {zone === 'mainland' ? 'Outside Lagos Island' : 'Lagos Island'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Delivery area detected from your address
            </p>
          </div>
        </div>
      </div>

      <div className="uk-card p-4 space-y-4">
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
          <AddressAutocomplete
            value={address}
            onChange={setAddress}
            onResolved={(d) => d?.zone && setZone(d.zone)}
            placeholder="Start typing your street or estate"
            className={fieldClass}
          />
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Pick the suggestion so we find your exact street, then add your house or flat number.
          </p>
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
        <div>
          <label className={labelClass}>
            <Phone className="w-3.5 h-3.5" /> Alternative Phone
          </label>
          <input
            value={altPhone}
            onChange={(e) => setAltPhone(e.target.value)}
            placeholder="Optional — another number we can reach you on"
            inputMode="tel"
            className={fieldClass}
          />
        </div>
      </div>

      {/* 2. Payment */}
      <p className="uk-section-label mb-2 mt-5">2. Payment</p>

      <div className="uk-card p-4 mb-4">
        <p className="text-sm font-bold text-foreground mb-3">Payment Method</p>
        <div className="uk-radio-card uk-radio-card-active">
          <div className="uk-icon-btn">
            <CreditCard className="w-[18px] h-[18px]" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-bold text-foreground">Pay Online</p>
          </div>
          <div className="w-5 h-5 rounded-full border-2 border-retail flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-retail" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-muted-foreground">
          <Lock className="w-3 h-3" /> Secured by Paystack
        </div>
      </div>

      {/* Voucher / Promo code */}
      <div className="uk-card p-4 mb-4">
        <label className={labelClass}>
          <Tag className="w-3.5 h-3.5" /> Voucher / Promo Code
        </label>
        {voucher ? (
          <div className="flex items-center justify-between bg-primary/10 rounded-xl px-3 py-2.5">
            <span className="text-sm font-semibold text-retail">
              {voucher.code} ({voucher.discount_type === 'fixed_amount' ? `₦${(voucher.discount_amount || 0).toLocaleString()} off` : `${voucher.discount_percent}% off`})
            </span>
            <button
              onClick={() => {
                setVoucher(null);
                setVoucherCode('');
              }}
              className="text-retail"
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
              className="uk-input flex-1"
            />
            <button
              onClick={applyVoucher}
              className="px-4 rounded-xl bg-retail text-white text-sm font-semibold"
            >
              Apply
            </button>
          </div>
        )}
        {voucherError && <p className="text-xs text-red-500 mt-1.5">{voucherError}</p>}
      </div>

      {/* Order summary */}
      <div className="uk-card p-4 space-y-2">
        <p className="text-sm font-bold text-foreground mb-1">Order Summary</p>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-foreground font-medium">₦{total.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Delivery fee
            {deliveryDiscount > 0 && (
              <span className="block text-[11px] font-semibold text-retail">
                {deliveryDiscountPercent}% splash discount
              </span>
            )}
          </span>
          <span className="text-right">
            {deliveryDiscount > 0 && (
              <span className="block text-[12px] text-muted-foreground line-through">
                ₦{deliveryBase.toLocaleString()}
              </span>
            )}
            <span className="text-foreground font-semibold">
              {deliveryFee === 0 ? 'Free' : `₦${deliveryFee.toLocaleString()}`}
            </span>
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Service fee</span>
          <span className="text-foreground font-medium">₦{serviceFee.toLocaleString()}</span>
        </div>
        {firstOrderDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">First Order Discount</span>
            <span className="text-retail font-semibold">−₦{firstOrderDiscount.toLocaleString()}</span>
          </div>
        )}
        {(referralDiscount + voucherDiscount) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Discount {voucher ? `(${voucher.code})` : ''}</span>
            <span className="text-retail font-semibold">−₦{(referralDiscount + voucherDiscount).toLocaleString()}</span>
          </div>
        )}
        <div className="border-t border-border pt-2 flex justify-between">
          <span className="text-sm font-bold text-foreground">Total</span>
          <span className="text-lg font-bold text-retail">₦{grandTotal.toLocaleString()}</span>
        </div>
      </div>

      {/* Same-day cutoff notice */}
      <div className="uk-card p-3.5 mt-4 flex items-start gap-2.5">
        <Clock className="w-4 h-4 text-retail shrink-0 mt-0.5" />
        <p className="text-[12px] font-medium text-foreground">
          Orders placed from 5pm will be delivered the next day.
        </p>
      </div>

      {/* Pay button — last on the page */}
      <div className="mt-3">
        <button onClick={placeOrder} disabled={!canPlace} className="uk-btn">
          {placing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Placing order...
            </>
          ) : (
            <>Pay ₦{grandTotal.toLocaleString()}</>
          )}
        </button>
      </div>
    </div>
  );
}
