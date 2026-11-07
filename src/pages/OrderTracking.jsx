import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Search,
  Package,
  PackageCheck,
  Clock,
  Truck,
  CheckCircle2,
  MapPin,
  Phone,
  ShoppingBag,
  XCircle,
  Loader2,
  ChevronRight,
  Bike,
  User,
} from 'lucide-react';

const STEPS = [
  { key: 'new', title: 'Order Placed', description: 'We received your order and are getting it ready.', icon: ShoppingBag },
  { key: 'processing', title: 'Preparing Your Order', description: 'Your groceries are being packed with care.', icon: Package },
  { key: 'ready', title: 'Ready for Delivery', description: 'Your order is packed and waiting for a rider.', icon: PackageCheck },
  { key: 'on_the_way', title: 'Out for Delivery', description: 'Our rider is on the way to your Lagos address.', icon: Truck },
  { key: 'delivered', title: 'Delivered', description: 'Your order has arrived. Enjoy your groceries!', icon: CheckCircle2 },
];
const STEP_ORDER = ['new', 'processing', 'ready', 'on_the_way', 'delivered'];

const ETA_BY_STATUS = {
  new: '45–90 mins',
  processing: '30–75 mins',
  ready: '20–45 mins',
  on_the_way: '15–40 mins',
  delivered: 'Delivered',
};

function timeAgo(d) {
  if (!d) return '';
  try {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

export default function OrderTracking() {
  const [params, setParams] = useSearchParams();
  const orderId = params.get('id') || '';
  const queryOrder = params.get('order') || '';
  const [searchValue, setSearchValue] = useState(queryOrder);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrder = async () => {
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      let found = null;
      if (orderId) {
        found = await base44.entities.Order.get(orderId).catch(() => null);
      } else if (queryOrder) {
        const orders = await base44.entities.Order.list();
        found = orders.find((o) => o.order_number.toLowerCase() === queryOrder.toLowerCase());
      }
      if (found) setOrder(found);
      else setError('Order not found. Check your order number and try again.');
    } catch {
      setError('Could not load order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId || queryOrder) {
      if (queryOrder) setSearchValue(queryOrder);
      fetchOrder();
    }
  }, [orderId, queryOrder]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchValue.trim()) setParams({ order: searchValue.trim() });
  };

  const isCancelled = order?.status === 'cancelled';
  const isDelivered = order?.status === 'delivered';
  const currentStepIndex = order ? Math.max(0, STEP_ORDER.indexOf(order.status)) : -1;

  return (
    <div className="uk-page">
      {/* Compact search — always visible so users can track another order */}
      <form onSubmit={handleSearch} className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Enter order number"
            className="uk-input pl-9 !py-2"
          />
        </div>
        <button
          type="submit"
          disabled={!searchValue.trim() || loading}
          className="h-10 px-4 rounded-lg bg-retail text-retail-foreground text-[12px] font-bold flex items-center gap-1.5 disabled:opacity-50 shrink-0"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Track
        </button>
      </form>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-retail" />
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-10">
          <Search className="w-9 h-9 text-muted-foreground/40 mx-auto mb-2.5" />
          <p className="uk-sub">{error}</p>
        </div>
      )}

      {!order && !error && !loading && (
        <div className="text-center py-10">
          <Truck className="w-9 h-9 text-muted-foreground/40 mx-auto mb-2.5" />
          <p className="uk-sub">Enter your order number to see live delivery status.</p>
        </div>
      )}

      {order && !loading && (
        <div className="space-y-3">
          {/* Status hero */}
          <div className="uk-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-[17px] font-bold text-foreground">#{order.order_number}</h2>
                <p className="uk-sub mt-0.5">
                  {order.items?.length || 0} items · ₦{(order.total || 0).toLocaleString()}
                </p>
              </div>
              {isCancelled ? (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Cancelled
                </span>
              ) : isDelivered ? (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-secondary text-retail flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Delivered
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-secondary text-retail flex items-center gap-1">
                  <Bike className="w-3 h-3" /> {ETA_BY_STATUS[order.status]}
                </span>
              )}
            </div>

            {!isCancelled && (
              <div className="rounded-xl bg-secondary p-3 mt-3 flex items-center gap-2.5">
                {(() => {
                  const Icon = STEPS[currentStepIndex]?.icon || ShoppingBag;
                  return <Icon className="w-5 h-5 text-retail shrink-0" strokeWidth={2.2} />;
                })()}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-retail">{STEPS[currentStepIndex]?.title}</p>
                  <p className="text-[11px] text-retail/75 truncate">
                    {STEPS[currentStepIndex]?.description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Vertical tracking timeline */}
          {!isCancelled ? (
            <div className="uk-card p-4">
              <p className="uk-section-label mb-3">Delivery progress</p>
              <div>
                {STEPS.map((step, i) => {
                  const isCompleted = i < currentStepIndex || (isDelivered && i === currentStepIndex);
                  const isCurrent = i === currentStepIndex && !isDelivered;
                  const Icon = step.icon;
                  const reached = i <= currentStepIndex;
                  return (
                    <div key={step.key} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            reached ? 'bg-retail' : 'bg-muted'
                          }`}
                        >
                          <Icon
                            className={`w-3.5 h-3.5 ${reached ? 'text-white' : 'text-muted-foreground'}`}
                            strokeWidth={2.4}
                          />
                        </div>
                        {i < STEPS.length - 1 &&
                          (isCompleted ? (
                            <div className="w-0.5 flex-1 min-h-[26px] my-1 rounded-full bg-retail" />
                          ) : (
                            <div className="flex-1 min-h-[26px] my-1 border-l-2 border-dashed border-border" />
                          ))}
                      </div>
                      <div className={`pb-5 min-w-0 ${i === STEPS.length - 1 ? 'pb-0' : ''}`}>
                        <p
                          className={`text-[13px] ${
                            reached ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'
                          }`}
                        >
                          {step.title}
                        </p>
                        <p className={`text-[11px] mt-0.5 ${reached ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                          {step.description}
                        </p>
                        {isCompleted && (
                          <p className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo(order.updated_date)}</p>
                        )}
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-retail bg-secondary px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-retail animate-pulse" />
                            In progress
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {order.status === 'on_the_way' && (
                <div className="mt-2 p-3 rounded-xl bg-secondary text-center">
                  <p className="text-[13px] font-bold text-retail">Your rider is on the way! 🛵</p>
                  <p className="text-[11px] text-retail/75 mt-0.5">Estimated arrival: 15–40 minutes</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-50 rounded-2xl border border-red-100 p-4 text-center">
              <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-[13px] font-bold text-red-700">This order was cancelled</p>
              <p className="text-[11px] text-red-500 mt-1">If this is a mistake, please contact support.</p>
            </div>
          )}

          {/* Delivery address */}
          <div className="uk-card p-4">
            <p className="uk-section-label mb-2">Delivery address</p>
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-retail shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[13px] text-foreground font-semibold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" /> {order.customer_name}
                </p>
                <p className="text-[13px] text-muted-foreground mt-0.5">{order.customer_address}</p>
                {order.landmark && (
                  <p className="text-[11px] text-muted-foreground/80 mt-0.5">Near {order.landmark}</p>
                )}
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {order.customer_phone}
                </p>
              </div>
            </div>
          </div>

          {/* Order items */}
          <div className="uk-card p-4">
            <p className="uk-section-label mb-2.5">Order items</p>
            <div className="space-y-1.5 mb-3">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-[13px]">
                  <span className="text-foreground truncate pr-2">
                    {item.quantity}× {item.name}
                  </span>
                  <span className="font-semibold text-foreground shrink-0">
                    ₦{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <Link
              to={`/orders/${order.id}`}
              className="flex items-center justify-between text-[13px] font-bold text-retail pt-2.5 border-t border-border"
            >
              <span>View full order details</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
            <Clock className="w-3.5 h-3.5" /> Last update {timeAgo(order.updated_date) || 'just now'}
          </div>

          <Link to="/orders" className="uk-btn-outline">
            Back to My Orders
          </Link>
        </div>
      )}
    </div>
  );
}