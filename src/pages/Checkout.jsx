import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { base44 } from '@/api/base44Client';
import { notifyOrderCreated } from '@/lib/notifications';
import { ArrowLeft, MapPin, Navigation, Phone, User, Loader2, CheckCircle2, ShoppingBag, Tag } from 'lucide-react';

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
  const [done, setDone] = useState(null);
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [rewardRef, setRewardRef] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!me?.id) return;
        // Referred user's available reward (after their first order was placed)
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
        // Referrer's available reward (after their friend's first order was placed)
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

  const appliedDiscount = Math.min(referralDiscount, total);
  const grandTotal = total - appliedDiscount + deliveryFee;

  const canPlace = name.trim() && phone.trim() && address.trim() && landmark.trim() && !placing;

  const placeOrder = async () => {
    if (!canPlace) return;
    setPlacing(true);
    try {
      const orderNumber = `UK-${Date.now().toString().slice(-6)}`;
      const orderItems = items.map((i) => ({
        name: i.details ? `${i.name} (${i.details})` : i.name,
        price: i.price,
        quantity: i.quantity,
        unit: i.unit,
      }));
      const me = await base44.auth.me();
      const order = await base44.entities.Order.create({
        order_number: orderNumber,
        items: orderItems,
        subtotal: total,
        delivery_fee: deliveryFee,
        discount: appliedDiscount,
        total: grandTotal,
        customer_name: name,
        customer_phone: phone,
        customer_email: me?.email || '',
        customer_address: address,
        landmark,
        status: 'new',
        payment_method: 'Cash on Delivery',
        payment_status: 'Pending',
      });
      try {
        await notifyOrderCreated(order, me?.email);
      } catch (e) {
        console.error('Notification error:', e);
      }
      // Apply referral reward and mark the referred user's first order
      try {
        if (rewardRef) {
          await base44.entities.Referral.update(
            rewardRef.id,
            rewardRef.type === 'referred' ? { referred_rewarded: true } : { referrer_rewarded: true }
          );
        }
        if (me?.id) {
          const pending = await base44.entities.Referral.filter({
            referred_user_id: me.id,
            status: 'pending',
          });
          if (pending.length > 0) {
            await base44.entities.Referral.update(pending[0].id, { status: 'first_order_placed' });
          }
        }
      } catch (e) {
        console.error('Referral reward error:', e);
      }
      clearCart();
      setDone(orderNumber);
    } catch (e) {
      setPlacing(false);
      alert('Could not place order. Please try again.');
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[70vh]">
        <div className="w-20 h-20 rounded-full bg-[#E8F5E9] flex items-center justify-center mb-4">
          <CheckCircle2 className="w-12 h-12 text-[#2E7D32]" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Order Placed!</h2>
        <p className="text-sm text-gray-500 mb-1">
          Your order <span className="font-bold text-[#2E7D32]">{done}</span> has been received.
        </p>
        <p className="text-xs text-gray-400 mb-6">We'll call {phone} to confirm your delivery.</p>
        <Link to={`/track?order=${done}`} className="bg-[#2E7D32] text-white text-sm font-bold px-6 py-3 rounded-full mb-3">
          Track My Order
        </Link>
        <Link to="/" className="text-[#2E7D32] text-sm font-medium px-6 py-3 rounded-full border border-[#2E7D32]/20">
          Continue Shopping
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-full bg-[#E8F5E9] flex items-center justify-center mb-4">
          <ShoppingBag className="w-10 h-10 text-[#2E7D32]" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Your cart is empty</h2>
        <p className="text-sm text-gray-500 mb-4">Add items before checking out</p>
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
    <div className="p-4 pb-40">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-full hover:bg-black/5">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Delivery Details</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-3 mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-500">
            {items.reduce((s, i) => s + i.quantity, 0)} items
          </span>
          <span className="font-bold text-[#2E7D32]">
            ₦{grandTotal.toLocaleString()}
          </span>
        </div>
        {appliedDiscount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-[#2E7D32] font-medium mb-2">
            <Tag className="w-3.5 h-3.5" /> Referral reward −₦{appliedDiscount.toLocaleString()} applied
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

      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
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

      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto px-4 py-3 bg-white border-t border-gray-100">
        {appliedDiscount > 0 && (
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-500">Referral discount</span>
            <span className="text-[#2E7D32] font-semibold">−₦{appliedDiscount.toLocaleString()}</span>
          </div>
        )}
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
            <>Place Order — ₦{grandTotal.toLocaleString()}</>
          )}
        </button>
      </div>
    </div>
  );
}