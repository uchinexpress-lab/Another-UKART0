import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/context/CartContext';
import { toast } from '@/components/ui/use-toast';
import {
  Loader2,
  MapPin,
  Phone,
  User,
  Truck,
  Tag,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  PackageCheck,
  RotateCw,
} from 'lucide-react';
import RateDeliveryCard from '@/components/notifications/RateDeliveryCard';

const STEPS = [
  { key: 'new', title: 'Order Placed', icon: ShoppingBag, desc: 'We received your order.' },
  { key: 'processing', title: 'Preparing', icon: Package, desc: 'Your groceries are being packed.' },
  { key: 'ready', title: 'Ready for Delivery', icon: PackageCheck, desc: 'Packed and waiting for a rider.' },
  { key: 'on_the_way', title: 'Out for Delivery', icon: Truck, desc: 'Our rider is on the way.' },
  { key: 'delivered', title: 'Delivered', icon: CheckCircle2, desc: 'Your order has arrived.' },
];

const STEP_ORDER = ['new', 'processing', 'ready', 'on_the_way', 'delivered'];

function StatusBadge({ status }) {
  if (status === 'delivered')
    return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-[#2E7D32]">Completed</span>;
  if (status === 'cancelled')
    return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600">Cancelled</span>;
  return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#FFF3E0] text-[#E65100]">In Progress</span>;
}

function DeliveryCountdown({ startTime }) {
  const [secondsLeft, setSecondsLeft] = useState(null);

  useEffect(() => {
    const startMs = startTime ? new Date(startTime).getTime() : Date.now();
    const validStart = Number.isNaN(startMs) ? Date.now() : startMs;
    const endMs = validStart + 30 * 60 * 1000;

    const update = () => {
      const diff = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
      setSecondsLeft(diff);
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  if (secondsLeft === null) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-xs font-bold text-[#2E7D32]">
      <Clock className="w-3.5 h-3.5 animate-pulse shrink-0" />
      {secondsLeft > 0 ? (
        <span>Arriving in ~{formatted}</span>
      ) : (
        <span>Arriving any moment now</span>
      )}
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const { addItems } = useCart();
  const navigate = useNavigate();

  const payNow = async () => {
    if (!order) return;
    setPaying(true);
    try {
      const callbackUrl = `${window.location.origin}/payment/callback`;
      const res = await base44.functions.invoke('process-paystack-payment', {
        action: 'initialize',
        orderId: order.id,
        callbackUrl,
      });
      if (res?.ok && res?.access_code) {
        const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';
        try {
          await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://paystack.co';
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('Could not load Paystack'));
            document.head.appendChild(s);
          });
        } catch {}
        if (window.PaystackPop) {
          const handler = window.PaystackPop.setup({
            key: PAYSTACK_KEY,
            access_code: res.access_code,
            onClose: () => {
              setPaying(false);
            },
            callback: (resp) => {
              const ref = resp.reference || res.reference;
              window.location.href = `${window.location.origin}/payment/callback?reference=${encodeURIComponent(ref)}`;
            },
          });
          handler.openIframe();
          return;
        }
      }
      if (res?.ok && res?.authorization_url) {
        window.location.href = res.authorization_url;
      } else {
        setPaying(false);
      }
    } catch {
      setPaying(false);
    }
  };

  const reorder = () => {
    const cartItems = (order.items || [])
      .map((it) => ({
        id: it.product_id || it.name,
        name: it.product_name || it.name,
        details: it.variant_label || '',
        price: it.price || 0,
        quantity: it.quantity || 1,
        unit: it.unit || '',
        addons: it.addons || [],
        addons_total: it.addons_total || 0,
      }))
      .filter((it) => it.id);
    if (cartItems.length === 0) {
      toast({ title: 'No items to reorder' });
      return;
    }
    addItems(cartItems);
    toast({ title: `Added ${cartItems.length} item${cartItems.length > 1 ? 's' : ''} to cart` });
    navigate('/cart');
  };

  useEffect(() => {
    base44.entities.Order
      .get(id)
      .then((o) => {
        setOrder(o);
        base44.entities.Delivery
          .filter({ order_id: id }, { limit: 1 })
          .then((r) => setDelivery(r.items?. || null))
          .catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/context/CartContext';
import { toast } from '@/components/ui/use-toast';
import {
  Loader2,
  MapPin,
  Phone,
  User,
  Truck,
  Tag,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  PackageCheck,
  RotateCw,
} from 'lucide-react';
import RateDeliveryCard from '@/components/notifications/RateDeliveryCard';

const STEPS = [
  { key: 'new', title: 'Order Placed', icon: ShoppingBag, desc: 'We received your order.' },
  { key: 'processing', title: 'Preparing', icon: Package, desc: 'Your groceries are being packed.' },
  { key: 'ready', title: 'Ready for Delivery', icon: PackageCheck, desc: 'Packed and waiting for a rider.' },
  { key: 'on_the_way', title: 'Out for Delivery', icon: Truck, desc: 'Our rider is on the way.' },
  { key: 'delivered', title: 'Delivered', icon: CheckCircle2, desc: 'Your order has arrived.' },
];

const STEP_ORDER = ['new', 'processing', 'ready', 'on_the_way', 'delivered'];

function StatusBadge({ status }) {
  if (status === 'delivered')
    return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-[#2E7D32]">Completed</span>;
  if (status === 'cancelled')
    return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600">Cancelled</span>;
  return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#FFF3E0] text-[#E65100]">In Progress</span>;
}

function DeliveryCountdown({ startTime }) {
  const [secondsLeft, setSecondsLeft] = useState(null);

  useEffect(() => {
    const startMs = startTime ? new Date(startTime).getTime() : Date.now();
    const validStart = Number.isNaN(startMs) ? Date.now() : startMs;
    const endMs = validStart + 30 * 60 * 1000;

    const update = () => {
      const diff = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
      setSecondsLeft(diff);
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  if (secondsLeft === null) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-xs font-bold text-[#2E7D32]">
      <Clock className="w-3.5 h-3.5 animate-pulse shrink-0" />
      {secondsLeft > 0 ? (
        <span>Arriving in ~{formatted}</span>
      ) : (
        <span>Arriving any moment now</span>
      )}
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const { addItems } = useCart();
  const navigate = useNavigate();

  const payNow = async () => {
    if (!order) return;
    setPaying(true);
    try {
      const callbackUrl = `${window.location.origin}/payment/callback`;
      const res = await base44.functions.invoke('process-paystack-payment', {
        action: 'initialize',
        orderId: order.id,
        callbackUrl,
      });
      if (res?.ok && res?.access_code) {
        const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';
        try {
          await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://paystack.co';
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('Could not load Paystack'));
            document.head.appendChild(s);
          });
        } catch {}
        if (window.PaystackPop) {
          const handler = window.PaystackPop.setup({
            key: PAYSTACK_KEY,
            access_code: res.access_code,
            onClose: () => {
              setPaying(false);
            },
            callback: (resp) => {
              const ref = resp.reference || res.reference;
              window.location.href = `${window.location.origin}/payment/callback?reference=${encodeURIComponent(ref)}`;
            },
          });
          handler.openIframe();
          return;
        }
      }
      if (res?.ok && res?.authorization_url) {
        window.location.href = res.authorization_url;
      } else {
        setPaying(false);
      }
    } catch {
      setPaying(false);
    }
  };

  const reorder = () => {
    const cartItems = (order.items || [])
      .map((it) => ({
        id: it.product_id || it.name,
        name: it.product_name || it.name,
        details: it.variant_label || '',
        price: it.price || 0,
        quantity: it.quantity || 1,
        unit: it.unit || '',
        addons: it.addons || [],
        addons_total: it.addons_total || 0,
      }))
      .filter((it) => it.id);
    if (cartItems.length === 0) {
      toast({ title: 'No items to reorder' });
      return;
    }
    addItems(cartItems);
    toast({ title: `Added ${cartItems.length} item${cartItems.length > 1 ? 's' : ''} to cart` });
    navigate('/cart');
  };

  useEffect(() => {
    base44.entities.Order
      .get(id)
      .then((o) => {
        setOrder(o);
        base44.entities.Delivery
          .filter({ order_id: id }, { limit: 1 })
          .then((r) => setDelivery(r.items?. || null))
          .catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);
