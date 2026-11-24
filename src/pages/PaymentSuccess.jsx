
import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/context/CartContext';
import { Loader2 } from 'lucide-react';
import OrderSuccessHero from '@/components/order/OrderSuccessHero';
import OrderInfoGrid from '@/components/order/OrderInfoGrid';
import PurchasedItemsCard from '@/components/order/PurchasedItemsCard';
import DispatchStatusCard from '@/components/order/DispatchStatusCard';
import { CUSTOMER_STATUS_MAP } from '@/lib/deliveryStatus';

const ORDER_STATUS_LABELS = {
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
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;

    const loadOrder = async () => {
      setLoading(true);
      setNotFound(false);

      try {
        const result = await base44.entities.Order.get(id);

        if (!active) return;

        if (!result || result.payment_status !== 'Paid') {
          setNotFound(true);
          return;
        }

        setOrder(result);
        clearCart();

        const productIds = [
          ...new Set(
            (result.items || [])
              .map((item) => item.product_id)
              .filter(Boolean)
          ),
        ];

        if (productIds.length > 0) {
          try {
            const products = await base44.entities.Product.filter(
              { id: { $in: productIds } },
              { limit: 50 }
            );

            if (!active) return;

            const imageMap = {};

            (products?.items || []).forEach((product) => {
              imageMap[product.id] = product.image;
            });

            setImages(imageMap);
          } catch {
            // Product images are optional on the success page.
          }
        }

        try {
          const deliveries = await base44.entities.Delivery.filter(
            { order_id: id },
            { limit: 1 }
          );

          if (active) {
            setDelivery(deliveries?.items?.[0] || null);
          }
        } catch {
          if (active) setDelivery(null);
        }
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadOrder();

    return () => {
      active = false;
    };
  }, [id, clearCart]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !order || order.payment_status !== 'Paid') {
    return (
      <Navigate to="/orders" replace />
    );
  }

  const purchasedItems = (order.items || []).map((item, index) => ({
    key: `${index}-${item.name}`,
    name: item.name,
    sub: [
      item.unit,
      `Qty: ${item.quantity}`,
    ]
      .filter(Boolean)
      .join(' • '),
    image: images[item.product_id] || '',
    price:
      ((item.price || 0) + (item.addons_total || 0)) *
      (item.quantity || 1),
  }));

  const rows = [
    {
      label: 'Items Subtotal',
      value: order.subtotal || 0,
    },
    {
      label: 'Delivery Fee',
      value: order.delivery_fee || 0,
    },
  ];

  if (order.service_fee > 0) {
    rows.push({
      label: 'Service Fee',
      value: order.service_fee,
    });
  }

  if (order.first_order_discount > 0) {
    rows.push({
      label: 'First Order Discount',
      value: order.first_order_discount,
      discount: true,
    });
  }

  const otherDiscount =
    (order.discount || 0) -
    (order.first_order_discount || 0);

  if (otherDiscount > 0) {
    rows.push({
      label: order.voucher_code
        ? `Voucher (${order.voucher_code})`
        : 'Referral Discount',
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
        date={formatDateTime(
          order.payment_timestamp || order.created_date
        )}
        payment={
          CHANNEL_LABELS[order.payment_channel] ||
          order.payment_method ||
          'Pay Online'
        }
        status={
          ORDER_STATUS_LABELS[order.status] ||
          'Paid & Processing'
        }
        delivery={
          delivery?.estimated_minutes
            ? `Est. ${delivery.estimated_minutes} mins`
            : 'Est. 15–30 mins'
        }
      />

      <PurchasedItemsCard
        items={purchasedItems}
        rows={rows}
        total={order.total || 0}
      />

      <DispatchStatusCard
        label={dispatchLabel}
        subtext={dispatchSubtext}
      />

      <div className="space-y-2.5">
        <Link to="/" className="uk-btn">
          Back to Home
        </Link>

        <Link
          to={
            delivery
              ? `/track-order/${delivery.id}`
              : `/track?id=${order.id}`
          }
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