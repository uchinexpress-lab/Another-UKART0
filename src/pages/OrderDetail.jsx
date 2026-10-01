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

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addItems } = useCart();
  const navigate = useNavigate();

  const reorder = () => {
    const cartItems = (order.items || []).map((it) => ({
      id: it.name,
      name: it.name,
      price: it.price || 0,
      quantity: it.quantity || 1,
      unit: it.unit || '',
    }));
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
        // Fetch delivery record for this order
        base44.entities.Delivery
          .filter({ order_id: id }, { limit: 1 })
          .then((r) => setDelivery(r.items?.[0] || null))
          .catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );

  if (!order)
    return (
      <div className="text-center py-16">
        <p className="text-sm text-muted-foreground">Order not found.</p>
        <Link to="/orders" className="text-[#2E7D32] text-sm font-medium mt-2 inline-block">
          Back to orders
        </Link>
      </div>
    );

  const isCancelled = order.status === 'cancelled';
  const currentStepIndex = STEP_ORDER.indexOf(order.status);
  const discount = order.discount || 0;

  return (
    <div className="p-4 space-y-4">
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-foreground">{order.order_number}</span>
          <StatusBadge status={order.status} />
        </div>
        <p className="text-xs text-gray-400">
          {new Date(order.created_date).toLocaleString('en-NG')}
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Items</h3>
        <div className="space-y-2">
          {order.items?.map((it, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">
                {it.quantity}× {it.name}
              </span>
              <span className="font-medium text-foreground">
                ₦{((it.price || 0) * (it.quantity || 1)).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-50 space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>₦{(order.subtotal || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Delivery fee</span>
            <span>₦{(order.delivery_fee || 0).toLocaleString()}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-[#2E7D32] font-medium">
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Referral discount
              </span>
              <span>−₦{discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-foreground pt-1">
            <span>Total</span>
            <span className="text-[#2E7D32]">₦{(order.total || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Delivery Details</h3>
        <div className="space-y-1.5 text-sm">
          <p className="flex items-center gap-2 text-foreground font-medium">
            <User className="w-4 h-4 text-gray-400" /> {order.customer_name}
          </p>
          <p className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400" /> {order.customer_address}
            {order.landmark ? ` — ${order.landmark}` : ''}
          </p>
          <p className="flex items-center gap-2 text-gray-600">
            <Phone className="w-4 h-4 text-gray-400" /> {order.customer_phone}
          </p>
          <p className="flex items-center gap-2 text-muted-foreground text-xs pt-1">
            <span className="font-medium">Payment:</span> {order.payment_method}
          </p>
        </div>
      </div>

      {!isCancelled ? (
        <div className="bg-card rounded-2xl border border-border p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-4">Delivery Progress</h3>
          <div className="space-y-0">
            {STEPS.map((step, i) => {
              const done = i < currentStepIndex;
              const current = i === currentStepIndex;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        done || current ? 'bg-primary/10' : 'bg-muted'
                      } ${current ? 'ring-2 ring-[#2E7D32] ring-offset-1' : ''}`}
                    >
                      <Icon
                        className={`w-4 h-4 ${done || current ? 'text-[#2E7D32]' : 'text-gray-400'}`}
                        strokeWidth={done || current ? 2.5 : 2}
                      />
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className={`w-0.5 flex-1 min-h-[24px] my-1 rounded-full ${
                          done ? 'bg-[#2E7D32]' : 'bg-muted'
                        }`}
                      />
                    )}
                  </div>
                  <div className="pb-5">
                    <p className={`text-sm font-bold ${done || current ? 'text-foreground' : 'text-gray-400'}`}>
                      {step.title}
                    </p>
                    <p className={`text-xs ${done || current ? 'text-muted-foreground' : 'text-gray-400'}`}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {delivery && ['on_the_way', 'arriving_soon', 'picked_up'].includes(delivery.status) ? (
            <Link
              to={`/track-order/${delivery.id}`}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-[#2E7D32] text-white text-sm font-bold py-3 rounded-2xl animate-pulse"
            >
              <Truck className="w-4 h-4" /> Live Track Order
            </Link>
          ) : delivery && delivery.status === 'delivered' ? (
            <Link
              to={`/track-order/${delivery.id}`}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-600 text-sm font-bold py-3 rounded-2xl"
            >
              <CheckCircle2 className="w-4 h-4" /> View Delivery
            </Link>
          ) : (
            <Link
              to={`/track?order=${order.order_number}`}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-[#2E7D32] text-white text-sm font-bold py-3 rounded-2xl"
            >
              <Truck className="w-4 h-4" /> Track Order
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-red-50 rounded-2xl border border-red-100 p-4 text-center">
          <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-red-700">This order was cancelled</p>
          <p className="text-xs text-red-500 mt-1">Contact support if this is a mistake.</p>
        </div>
      )}

      {order.status === 'delivered' && (
        <div className="bg-card rounded-2xl border border-border p-4">
          <h3 className="text-sm font-bold text-foreground mb-1">Rate your delivery</h3>
          <p className="text-xs text-muted-foreground mb-3">Tell us about your experience</p>
          <RateDeliveryCard order={order} />
        </div>
      )}

      {order.status !== 'cancelled' && (order.items?.length || 0) > 0 && (
        <button
          onClick={reorder}
          className="w-full flex items-center justify-center gap-2 bg-[#2E7D32] text-white text-sm font-bold py-3 rounded-2xl active:scale-[0.98] transition-transform"
        >
          <RotateCw className="w-4 h-4" /> Reorder these items
        </button>
      )}

      <Link
        to="/orders"
        className="block w-full text-center bg-card border border-gray-200 text-gray-700 text-sm font-bold py-3 rounded-2xl"
      >
        Back to Orders
      </Link>
    </div>
  );
}