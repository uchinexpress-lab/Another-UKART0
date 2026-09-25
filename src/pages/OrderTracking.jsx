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
  const currentStepIndex = order ? STEP_ORDER.indexOf(order.status) : -1;
  const progressPct = order && currentStepIndex >= 0 ? (currentStepIndex / (STEPS.length - 1)) * 100 : 0;

  return (
    <div className="p-4 pb-10">
      <h1 className="text-xl font-bold text-foreground mb-4">Track Your Order</h1>

      {/* Search bar — always visible so users can track another order */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Enter order number (e.g. UK-123456)"
            className="w-full text-sm border border-border rounded-xl pl-10 pr-3 py-2.5 outline-none focus:border-primary bg-card text-foreground placeholder:text-muted-foreground"
          />
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
        <button
          type="submit"
          disabled={!searchValue.trim() || loading}
          className="w-full mt-3 h-11 rounded-2xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? 'Tracking...' : 'Track Order'}
        </button>
      </form>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-10">
          <Search className="w-12 h-12 text-muted/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      )}

      {!order && !error && !loading && (
        <div className="text-center py-10">
          <Truck className="w-12 h-12 text-muted/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Enter your order number to see live delivery status.</p>
        </div>
      )}

      {order && !loading && (
        <div className="space-y-4">
          {/* Status hero card */}
          <div className="bg-card rounded-2xl border border-border p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm font-bold text-foreground">{order.order_number}</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {order.items?.length || 0} items · ₦{(order.total || 0).toLocaleString()}
                </p>
              </div>
              {isCancelled ? (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Cancelled
                </span>
              ) : isDelivered ? (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-[#2E7D32] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Completed
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#FFF3E0] text-[#E65100] flex items-center gap-1">
                  <Clock className="w-3 h-3" /> In Progress
                </span>
              )}
            </div>

            {/* Current status banner */}
            {!isCancelled && (
              <div className="rounded-xl bg-primary/10 p-3 mb-4">
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = STEPS[currentStepIndex]?.icon || ShoppingBag;
                    return <Icon className="w-5 h-5 text-[#2E7D32] shrink-0" />;
                  })()}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#2E7D32]">{STEPS[currentStepIndex]?.title}</p>
                    <p className="text-xs text-[#2E7D32]/70 truncate">{STEPS[currentStepIndex]?.description}</p>
                  </div>
                  {!isDelivered && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#2E7D32] whitespace-nowrap">
                      <Bike className="w-3.5 h-3.5" /> {ETA_BY_STATUS[order.status]}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Horizontal progress bar */}
            {!isCancelled && (
              <div className="relative mb-2">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#2E7D32] transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  {STEPS.map((step, i) => {
                    const Icon = step.icon;
                    const reached = i <= currentStepIndex;
                    return (
                      <div key={step.key} className="flex flex-col items-center" style={{ width: '20%' }}>
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 transition-colors ${
                            reached ? 'bg-[#2E7D32]' : 'bg-muted'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${reached ? 'text-white' : 'text-muted-foreground'}`} strokeWidth={2.5} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Order items */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Order Items</h3>
            <div className="flex gap-1 overflow-x-auto scrollbar-hide mb-3">
              {order.items?.map((item, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 bg-muted/50 rounded-lg px-2.5 py-1.5 text-[11px] text-foreground font-medium"
                >
                  {item.quantity}× {item.name}
                </div>
              ))}
            </div>
            <Link
              to={`/orders/${order.id}`}
              className="flex items-center justify-between text-sm font-bold text-[#2E7D32] pt-2 border-t border-border"
            >
              <span>View full order details</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Delivery address */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Delivery Address</h3>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#2E7D32] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-foreground font-medium flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" /> {order.customer_name}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">{order.customer_address}</p>
                {order.landmark && (
                  <p className="text-xs text-muted-foreground/70 mt-0.5">Near {order.landmark}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {order.customer_phone}
                </p>
              </div>
            </div>
          </div>

          {/* Vertical tracking timeline */}
          {!isCancelled ? (
            <div className="bg-card rounded-2xl border border-border p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-4">Delivery Progress</h3>
              <div className="space-y-0">
                {STEPS.map((step, i) => {
                  const isCompleted = i < currentStepIndex;
                  const isCurrent = i === currentStepIndex;
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCompleted || isCurrent ? 'bg-primary/10' : 'bg-muted'
                          } ${isCurrent ? 'ring-2 ring-[#2E7D32] ring-offset-1 ring-offset-card' : ''}`}
                        >
                          <Icon
                            className={`w-4 h-4 ${
                              isCompleted ? 'text-[#2E7D32]' : isCurrent ? 'text-[#2E7D32]' : 'text-muted-foreground'
                            }`}
                            strokeWidth={isCompleted || isCurrent ? 2.5 : 2}
                          />
                        </div>
                        {i < STEPS.length - 1 && (
                          <div className={`w-0.5 flex-1 min-h-[28px] my-1 rounded-full ${isCompleted ? 'bg-[#2E7D32]' : 'bg-muted'}`} />
                        )}
                      </div>
                      <div className={`pb-6 ${i === STEPS.length - 1 ? 'pb-0' : ''}`}>
                        <p className={`text-sm font-bold ${isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {step.title}
                        </p>
                        <p className={`text-xs mt-0.5 ${isCompleted || isCurrent ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                          {step.description}
                        </p>
                        {isCompleted && (
                          <p className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo(order.updated_date)}</p>
                        )}
                        {isCurrent && !isDelivered && (
                          <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-[#2E7D32] bg-primary/10 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] animate-pulse" />
                            Current step
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {order.status === 'on_the_way' && (
                <div className="mt-2 p-3 rounded-xl bg-primary/10 text-center">
                  <p className="text-sm font-bold text-[#2E7D32]">Your rider is on the way! 🛵</p>
                  <p className="text-xs text-[#2E7D32]/70 mt-0.5">Estimated arrival: 15–40 minutes</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-100 dark:border-red-900 p-4 text-center">
              <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-red-700 dark:text-red-400">This order was cancelled</p>
              <p className="text-xs text-red-500 dark:text-red-400/70 mt-1">If this is a mistake, please contact support.</p>
            </div>
          )}

          <Link
            to="/orders"
            className="block w-full text-center bg-card border border-border text-foreground text-sm font-bold px-6 py-3 rounded-2xl active:scale-[0.98] transition-transform"
          >
            Back to My Orders
          </Link>
        </div>
      )}
    </div>
  );
}