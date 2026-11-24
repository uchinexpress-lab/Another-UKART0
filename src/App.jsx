
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AddressAutocomplete from '@/components/checkout/AddressAutocomplete';
import AddressPickerMap from '@/components/delivery/AddressPickerMap';
import { useCart } from '@/context/CartContext';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { useLocation } from '@/context/LocationContext';
import {
  Clock, MapPin, Navigation, Phone, User, Loader2,
  ShoppingBag, Tag, History, X, CreditCard, Lock, Truck
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { getServiceFee } from '@/lib/fees';
import {
  getDeliveryFee,
  getDeliveryBase,
  getDeliveryDiscountPercent,
  resolveDeliverySettings,
} from '@/lib/delivery';

const MINIMUM_ORDER = 5000;

function classifyAddressZone(address) {
  const text = (address || '').toLowerCase();

  const islandAreas = [
    'ajah', 'lekki', 'victoria island', 'ikoyi', 'chevron', 'vgc',
    'victoria garden city', 'sangotedo', 'abraham adesanya',
    'ikate', 'oniru', 'eti-osa', 'etiosa'
  ];

  const mainlandAreas = [
    'yaba', 'surulere', 'ikeja', 'maryland', 'gbagada', 'ikorodu',
    'festac', 'isolo', 'egbeda', 'agege', 'oshodi', 'mushin',
    'ketu', 'ogudu', 'magodo'
  ];

  if (islandAreas.some(area => text.includes(area))) return 'island';
  if (mainlandAreas.some(area => text.includes(area))) return 'mainland';

  return null;
}

function prepareCheckoutItems(items) {
  return items.map(item => ({
    ...item,
    id: String(item.id || ''),
    product_id: item.product_id || String(item.id || '').split('__')[0],
    package_id: item.package_id || null,
    quantity: Number(item.quantity),
    variant_label: item.variant_label || item.details || '',
    size_label: item.size_label || '',
    protein_names: item.protein_names || [],
    selections: item.selections || [],
    addon_ids: item.addon_ids || (item.addons || []).map(addon => addon.id),
    image: item.image || '',
  }));
}

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const { location: selectedLocation } = useLocation();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [landmark, setLandmark] = useState('');
  const [zone, setZone] = useState(selectedLocation?.zone || 'mainland');

  const [placing, setPlacing] = useState(false);
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [rewardRef, setRewardRef] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);

  const [voucherCode, setVoucherCode] = useState('');
  const [voucher, setVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState('');
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  const [promoSettings, setPromoSettings] = useState(null);
  const [isFirstOrder, setIsFirstOrder] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState(null);

  useEffect(() => {
    if (selectedLocation?.zone === 'island' || selectedLocation?.zone === 'mainland') {
      setZone(selectedLocation.zone);
    }
  }, [selectedLocation?.zone]);

  useEffect(() => {
    let mounted = true;

    async function loadCheckoutData() {
      try {
        const me = await base44.auth.me();
        if (!me?.id || !mounted) return;

        // Load eligible referral reward.
        const asReferred = await base44.entities.Referral.filter({
          referred_user_id: me.id,
          status: 'first_order_placed',
          referred_rewarded: false,
        });

        if (asReferred?.length) {
          setReferralDiscount(Number(asReferred[0].reward_amount || 550));
          setRewardRef({ id: asReferred[0].id, type: 'referred' });
        } else {
          const asReferrer = await base44.entities.Referral.filter({
            referrer_id: me.id,
            status: 'first_order_placed',
            referrer_rewarded: false,
          });

          if (asReferrer?.length) {
            setReferralDiscount(Number(asReferrer[0].reward_amount || 550));
            setRewardRef({ id: asReferrer[0].id, type: 'referrer' });
          }
        }

        // Load previous addresses.
        const previousOrders = await base44.entities.Order.filter(
          { customer_email: me.email },
          '-created_date',
          50
        );

        if (mounted) {
          const seen = new Set();
          const addresses = [];

          (previousOrders || []).forEach(order => {
            const key = [
              order.customer_name,
              order.customer_phone,
              order.customer_address,
              order.landmark
            ].join('|');

            if (order.customer_address && !seen.has(key)) {
              seen.add(key);
              addresses.push({
                name: order.customer_name,
                phone: order.customer_phone,
                altPhone: order.alternate_phone,
                address: order.customer_address,
                landmark: order.landmark,
              });
            }
          });

          setSavedAddresses(addresses);
        }

        // Load promotion settings.
        const promoRes = await base44.entities.PromotionSetting.filter({}, { limit: 1 });
        if (mounted) setPromoSettings(promoRes.items?.[0] || null);

        // Load delivery settings.
        const deliveryRes = await base44.entities.DeliverySetting.filter({}, { limit: 1 });
        if (mounted) setDeliverySettings(deliveryRes.items?.[0] || null);

        // This is only a display estimate. The payment function checks
        // first-order eligibility again on the server.
        const paidOrders = await base44.entities.Order.filter({
          customer_email: me.email,
          payment_status: 'Paid',
        });

        if (mounted) setIsFirstOrder(!paidOrders || paidOrders.length === 0);
      } catch (error) {
        console.error('Checkout data loading error:', error);
      }
    }

    loadCheckoutData();

    return () => {
      mounted = false;
    };
  }, []);

  const handleAddressChange = nextAddress => {
    setAddress(nextAddress);
    setCoords({ lat: null, lng: null });
  };

  const applySaved = saved => {
    setName(saved.name || '');
    setPhone(saved.phone || '');
    setAltPhone(saved.altPhone || '');
    setAddress(saved.address || '');
    setCoords({ lat: null, lng: null });
    setLandmark(saved.landmark || '');

    const detectedZone = classifyAddressZone(saved.address);
    if (detectedZone) setZone(detectedZone);
  };

  const firstOrderDiscount =
    isFirstOrder && promoSettings?.first_order_enabled !== false
      ? Number(promoSettings?.first_order_discount || 500)
      : 0;

  const voucherDiscount = voucher
    ? voucher.discount_type === 'fixed_amount'
      ? Math.min(Number(voucher.discount_amount || 0), total)
      : Math.round(total * Number(voucher.discount_percent || 0) / 100)
    : 0;

  const appliedDiscount = Math.min(
    referralDiscount + voucherDiscount + firstOrderDiscount,
    total
  );

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
  const estimatedTotal = total - appliedDiscount + deliveryFee + serviceFee;

  const meetsMinimumOrder = total >= MINIMUM_ORDER;

  const canPlace =
    meetsMinimumOrder &&
    name.trim() &&
    phone.trim() &&
    address.trim() &&
    landmark.trim() &&
    !placing;

  const applyVoucher = async () => {
    setVoucherError('');

    if (!voucherCode.trim()) return;

    setApplyingVoucher(true);

    try {
      const result = await base44.functions.invoke('validateVoucher', {
        code: voucherCode.trim(),
      });

      if (!result.data?.valid) {
        setVoucherError(result.data?.error || 'Invalid or expired voucher code');
        return;
      }

      setVoucher(result.data);
      toast({
        title: 'Voucher applied',
        description: 'Your voucher will be checked again during payment.',
      });
    } catch (error) {
      setVoucherError(error?.message || 'Could not validate voucher');
    } finally {
      setApplyingVoucher(false);
    }
  };

  const placeOrder = async () => {
    if (!meetsMinimumOrder) {
      toast({
        title: 'Minimum order is ₦5,000',
        description: 'Please add more items to your cart.',
      });
      navigate('/cart');
      return;
    }

    if (!canPlace) return;

    setPlacing(true);

    try {
      const me = await base44.auth.me();

      if (!me?.email) {
        throw new Error('Please sign in again before placing your order.');
      }

      // Confirm that Supabase still has the authenticated session.
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData?.session?.access_token) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      const checkout = {
        items: prepareCheckoutItems(items),
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        alternate_phone: altPhone.trim(),
        customer_address: address.trim(),
        landmark: landmark.trim(),
        delivery_zone: zone,
        delivery_lat: coords.lat,
        delivery_lng: coords.lng,
        referral_id: rewardRef?.id || null,
        referral_type: rewardRef?.type || null,
        voucher_code: voucher?.code || null,
      };

      // The server recalculates all prices, fees and discounts.
      // No order is inserted from the browser.
      const { data, error } = await supabase.functions.invoke(
        'process-paystack-payment',
        {
          body: {
            action: 'initialize',
            checkout,
            callbackUrl: 'https://ukartapp.com/payment/callback',
          },
        }
      );

      if (error) {
        let message = error.message || 'Could not start payment';

        try {
          const response = error.context;
          if (response && typeof response.json === 'function') {
            const details = await response.json();
            message = details?.error || message;
          }
        } catch {}

        throw new Error(message);
      }

      if (!data?.ok || !data?.authorization_url || !data?.reference) {
        throw new Error(data?.error || 'Paystack could not initialize this payment.');
      }

      // Use the amount calculated by the server, not the browser estimate.
      console.info('Ukart payment initialized:', {
        reference: data.reference,
        total: data.total_naira,
      });

      // Paystack redirects the customer back to /payment/callback.
      window.location.assign(data.authorization_url);
    } catch (error) {
      console.error('Checkout payment initialization error:', error);

      setPlacing(false);

      toast({
        title: 'Could not start payment',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <ShoppingBag className="w-10 h-10 text-retail" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">Your cart is empty</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Add items before checking out
        </p>
        <Link to="/" className="bg-retail text-white text-sm font-bold px-6 py-3 rounded-full">
          Start Shopping
        </Link>
      </div>
    );
  }

  const fieldClass = 'uk-input';
  const labelClass =
    'text-[11px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5 mb-1.5';

  return (
    <div className="p-4 pb-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="uk-title">Checkout</h2>
      </div>

      {!meetsMinimumOrder && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-sm font-semibold text-amber-900">
            Minimum order: ₦5,000
          </p>
          <p className="text-xs text-amber-800 mt-1">
            Add ₦{(MINIMUM_ORDER - total).toLocaleString()} more to continue.
          </p>
          <button
            onClick={() => navigate('/cart')}
            className="text-xs font-bold text-amber-900 underline mt-2"
          >
            Return to cart
          </button>
        </div>
      )}

      {/* Cart summary */}
      <div className="uk-card p-3.5 mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">
            {items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)} items
          </span>
          <span className="font-bold text-retail">
            ₦{estimatedTotal.toLocaleString()}
          </span>
        </div>

        {firstOrderDiscount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-retail font-medium mb-2">
            <Tag className="w-3.5 h-3.5" />
            First order −₦{firstOrderDiscount.toLocaleString()} estimated
          </div>
        )}

        {referralDiscount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-retail font-medium mb-2">
            <Tag className="w-3.5 h-3.5" />
            Referral reward −₦{Math.min(referralDiscount, total).toLocaleString()}
          </div>
        )}

        {voucherDiscount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-retail font-medium mb-2">
            <Tag className="w-3.5 h-3.5" />
            Voucher {voucher.code} −₦{voucherDiscount.toLocaleString()}
          </div>
        )}

        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {items.map(item => (
            <img
              key={item.id}
              src={item.image}
              alt={item.name}
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
            />
          ))}
        </div>
      </div>

      {/* Delivery address */}
      <p className="uk-section-label mb-2">1. Delivery address</p>

      {savedAddresses.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
            <History className="w-3.5 h-3.5" />
            Use a saved address
          </p>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {savedAddresses.map((saved, index) => (
              <button
                key={index}
                onClick={() => applySaved(saved)}
                className="flex-shrink-0 text-left text-xs bg-card border border-border rounded-xl px-3 py-2 w-44 active:scale-95 transition-transform"
              >
                <span className="font-semibold text-foreground block line-clamp-1">
                  {saved.name}
                </span>
                <span className="text-muted-foreground line-clamp-2">
                  {saved.address}
                </span>
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
            <User className="w-3.5 h-3.5" />
            Full Name
          </label>
          <input
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder="e.g. Adaeze Okafor"
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            <MapPin className="w-3.5 h-3.5" />
            House Address
          </label>

          <AddressAutocomplete
            value={address}
            onChange={handleAddressChange}
            onResolved={details => {
              const detectedZone = classifyAddressZone(details?.address);

              if (detectedZone) setZone(detectedZone);
              else if (details?.zone === 'island' || details?.zone === 'mainland') {
                setZone(details.zone);
              }

              if (details?.lat != null && details?.lng != null) {
                setCoords({ lat: details.lat, lng: details.lng });
              }
            }}
            placeholder="Start typing your street or estate"
            className={fieldClass}
          />

          <p className="text-[11px] text-muted-foreground mt-1.5">
            Pick the suggestion so we find your exact street, then add your house or flat number.
          </p>

          <div className="mt-3">
            <AddressPickerMap
              onConfirmLocation={({ address: pickedAddress, lat, lng, zone: detectedZone }) => {
                if (pickedAddress) setAddress(pickedAddress);

                const addressZone = classifyAddressZone(pickedAddress);

                if (addressZone) setZone(addressZone);
                else if (detectedZone === 'island' || detectedZone === 'mainland') {
                  setZone(detectedZone);
                }

                setCoords({ lat, lng });
              }}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>
            <Navigation className="w-3.5 h-3.5" />
            Landmark
          </label>
          <input
            value={landmark}
            onChange={event => setLandmark(event.target.value)}
            placeholder="e.g. opposite Total filling station"
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            <Phone className="w-3.5 h-3.5" />
            Phone Number
          </label>
          <input
            value={phone}
            onChange={event => setPhone(event.target.value)}
            placeholder="e.g. 0803 123 4567"
            inputMode="tel"
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            <Phone className="w-3.5 h-3.5" />
            Alternative Phone
          </label>
          <input
            value={altPhone}
            onChange={event => setAltPhone(event.target.value)}
            placeholder="Optional — another number we can reach you on"
            inputMode="tel"
            className={fieldClass}
          />
        </div>
      </div>

      {/* Payment */}
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
          <Lock className="w-3 h-3" />
          Secured by Paystack
        </div>
      </div>

      {/* Voucher */}
      <div className="uk-card p-4 mb-4">
        <label className={labelClass}>
          <Tag className="w-3.5 h-3.5" />
          Voucher / Promo Code
        </label>

        {voucher ? (
          <div className="flex items-center justify-between bg-primary/10 rounded-xl px-3 py-2.5">
            <span className="text-sm font-semibold text-retail">
              {voucher.code}
              {' '}
              (
                {voucher.discount_type === 'fixed_amount'
                  ? `₦${Number(voucher.discount_amount || 0).toLocaleString()} off`
                  : `${voucher.discount_percent}% off`}
              )
            </span>

            <button
              onClick={() => {
                setVoucher(null);
                setVoucherCode('');
                setVoucherError('');
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
              onChange={event => setVoucherCode(event.target.value)}
              placeholder="Enter code"
              className="uk-input flex-1"
            />

            <button
              onClick={applyVoucher}
              disabled={applyingVoucher || !voucherCode.trim()}
              className="px-4 rounded-xl bg-retail text-white text-sm font-semibold disabled:opacity-50"
            >
              {applyingVoucher ? 'Checking...' : 'Apply'}
            </button>
          </div>
        )}

        {voucherError && (
          <p className="text-xs text-red-500 mt-1.5">{voucherError}</p>
        )}
      </div>

      {/* Order summary */}
      <div className="uk-card p-4 space-y-2">
        <p className="text-sm font-bold text-foreground mb-1">Order Summary</p>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-foreground font-medium">
            ₦{total.toLocaleString()}
          </span>
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
          <span className="text-foreground font-medium">
            ₦{serviceFee.toLocaleString()}
          </span>
        </div>

        {firstOrderDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">First Order Discount</span>
            <span className="text-retail font-semibold">
              −₦{firstOrderDiscount.toLocaleString()}
            </span>
          </div>
        )}

        {(referralDiscount + voucherDiscount) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Discount {voucher ? `(${voucher.code})` : ''}
            </span>
            <span className="text-retail font-semibold">
              −₦{(referralDiscount + voucherDiscount).toLocaleString()}
            </span>
          </div>
        )}

        <div className="border-t border-border pt-2 flex justify-between">
          <span className="text-sm font-bold text-foreground">
            Estimated Total
          </span>
          <span className="text-lg font-bold text-retail">
            ₦{estimatedTotal.toLocaleString()}
          </span>
        </div>

        <p className="text-[10px] text-muted-foreground">
          Final amount is calculated and confirmed securely before payment.
        </p>
      </div>

      {/* Delivery notice */}
      <div className="uk-card p-3.5 mt-4 flex items-start gap-2.5">
        <Clock className="w-4 h-4 text-retail shrink-0 mt-0.5" />
        <p className="text-[12px] font-medium text-foreground">
          Orders placed from 5pm will be delivered the next day.
        </p>
      </div>

      {/* Pay button */}
      <div className="mt-3">
        <button
          onClick={placeOrder}
          disabled={!canPlace}
          className="uk-btn"
        >
          {placing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Connecting to Paystack...
            </>
          ) : (
            <>Continue to Pay ₦{estimatedTotal.toLocaleString()}</>
          )}
        </button>
      </div>
    </div>
  );
}