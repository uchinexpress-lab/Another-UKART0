import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/context/CartContext';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import OrderSuccessHero from '@/components/order/OrderSuccessHero';
import OrderInfoGrid from '@/components/order/OrderInfoGrid';
import PurchasedItemsCard from '@/components/order/PurchasedItemsCard';
import DispatchStatusCard from '@/components/order/DispatchStatusCard';
import { CUSTOMER_STATUS_MAP } from '@/lib/deliveryStatus';

const ORDER_STATUS_LABELS = {
  awaiting_payment: 'Awaiting Payment',
  new: 'Paid & Processing',
  processing: 'Paid & Processing',
  ready: 'Packed & Ready',
  on_the_way: 'On the Way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const CHANNEL_LABELS = {
  card: 'Card',
  bank: 'Bank',
  bank_transfer: 'Bank Transfer',
  ussd: 'USSD',
  qr: 'QR',
  mobile_money: 'Mobile Money',
};

function formatDateTime(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-NG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PaymentSuccess() {
  const { id } = useParams();
  const { clearCart } = useCart();
  const [order, setOrder] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [images, setImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const o = await base44.entities.Order.get(id);
        if (!active) return;
        setOrder(o);
        if (o?.payment_status === 'Paid') clearCart();

        // Product photos for the purchased items list (nice-to-have only).
        const ids = [...new Set((o.items || []).map((it) => it.product_id).filter(Boolean))];
        if (ids.length > 0) {
          try {
            const res = await base44.entities.Product.filter(
              { id: { $in: ids } },
              { limit: 50 }
            );
            if (!active) return;
            const map = {};
            (res.items || []).forEach((p) => {
              map[p.id] = p.image;
            });
            setImages(map);
          } catch {}
        }

        try {
          const dRes = await base44.entities.Delivery.filter(
            { order_id: id },
            { limit: 1 }
          );
          if (active) setDelivery(dRes.items?.[0] || null);
        } catch {}
      } catch {
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const payNow = async () => {
    if (!order) return;
    setPaying(true);
    try {
      const callbackUrl = `${window.location.origin}/payment/callback`;
      const res = await base44.functions.invoke('initiatePaystackPayment', {
        orderId: order.id,
        callbackUrl,
      });
      if (res.data?.authorization_url) {
        window.location.href = res.data.authorization_url;
      } else {
        setPaying(false);
      }
    } catch {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16 px-6">
        <p className="text-sm text-muted-foreground">Order not found.</p>
        <Link to="/orders" className="text-retail text-sm font-medium mt-2 inline-block">
          Back to orders
        </Link>
      </div>
    );
  }

  if (order.payment_status !== 'Paid') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[70vh]">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
          <AlertTriangle className="w-10 h-10 text-retail" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">
          {order.payment_status === 'Failed' ? 'Payment Failed' : 'Payment Not Confirmed'}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Your payment was not completed, so order {order.order_number} is not confirmed.
        </p>
        <button
          onClick={payNow}
          disabled={paying}
          className="uk-btn mb-3"
        >
          {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {order.payment_status === 'Failed' ? 'Retry Payment' : 'Pay Now'}
        </button>
        <Link to="/orders" className="uk-btn-outline">
          Back to My Orders
        </Link>
      </div>
    );
  }

  const items = (order.items || []).map((it, i) => ({
    key: `${i}-${it.name}`,
    name: it.name,
    sub: [it.unit, `Qty: ${it.quantity}`].filter(Boolean).join(' • '),
    image: images[it.product_id] || '',
    price: ((it.price || 0) + (it.addons_total || 0)) * (it.quantity || 1),
  }));

  const rows = [
    { label: 'Items Subtotal', value: order.subtotal || 0 },
    { label: 'Delivery Fee', value: order.delivery_fee || 0 },
  ];
  if (order.service_fee > 0) rows.push({ label: 'Service Fee', value: order.service_fee });
  if (order.first_order_discount > 0) {
    rows.push({
      label: 'First Order Discount',
      value: order.first_order_discount,
      discount: true,
    });
  }
  const otherDiscount = (order.discount || 0) - (order.first_order_discount || 0);
  if (otherDiscount > 0) {
    rows.push({
      label: order.voucher_code ? `Voucher (${order.voucher_code})` : 'Referral Discount',
      value: otherDiscount,
      discount: true,
    });
  }

  const dispatchLabel = delivery
    ? CUSTOMER_STATUS_MAP[delivery.status] || 'Preparing Order'
    : 'Preparing Order';
  const dispatchSubtext = delivery?.rider_name
    ? `${delivery.rider_name} is handling your order`
    : 'We are packing your groceries';

  return (
    <div className="uk-page space-y-4">
      <OrderSuccessHero />

      <OrderInfoGrid
        date={formatDateTime(order.payment_timestamp || order.created_date)}
        payment={CHANNEL_LABELS[order.payment_channel] || order.payment_method || 'Pay Online'}
        status={ORDER_STATUS_LABELS[order.status] || 'Paid & Processing'}
        delivery={
          delivery?.estimated_minutes
            ? `Est. ${delivery.estimated_minutes} mins`
            : 'Est. 35–90 mins'
        }
      />

      <PurchasedItemsCard items={items} rows={rows} total={order.total || 0} />

      <DispatchStatusCard label={dispatchLabel} subtext={dispatchSubtext} />

      <div className="space-y-2.5">
        <Link to="/" className="uk-btn">
          Back to Home
        </Link>
        <Link
          to={delivery ? `/track-order/${delivery.id}` : `/track?id=${order.id}`}
          className="uk-btn-outline"
        >
          Track this order
        </Link>
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        Order #{order.order_number}
      </p>
    </div>
  );
}