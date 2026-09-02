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
} from 'lucide-react';

const STEPS = [
  {
    key: 'new',
    title: 'Order Placed',
    description: 'We received your order and are getting it ready.',
    icon: ShoppingBag,
  },
  {
    key: 'processing',
    title: 'Preparing Your Order',
    description: 'Your groceries are being packed with care.',
    icon: Package,
  },
  {
    key: 'ready',
    title: 'Ready for Delivery',
    description: 'Your order is packed and waiting for a rider.',
    icon: PackageCheck,
  },
  {
    key: 'on_the_way',
    title: 'Out for Delivery',
    description: 'Our rider is on the way to your Lagos address.',
    icon: Truck,
  },
  {
    key: 'delivered',
    title: 'Delivered',
    description: 'Your order has arrived. Enjoy your groceries!',
    icon: CheckCircle2,
  },
];

const STEP_ORDER = ['new', 'processing', 'ready', 'on_the_way', 'delivered'];

export default function OrderTracking() {
  const [params, setParams] = useSearchParams();
  const queryOrder = params.get('order') || '';
  const [searchValue, setSearchValue] = useState(queryOrder);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrder = async (orderNumber) => {
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const orders = await base44.entities.Order.list();
      const found = orders.find((o) =>
        o.order_number.toLowerCase() === orderNumber.toLowerCase()
      );
      if (found) {
        setOrder(found);
      } else {
        setError('Order not found. Check your order number and try again.');
      }
    } catch {
      setError('Could not load order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryOrder) {
      setSearchValue(queryOrder);
      fetchOrder(queryOrder);
    }
  }, [queryOrder]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      setParams({ order: searchValue.trim() });
    }
  };

  const isCancelled = order?.status === 'cancelled';
  const currentStepIndex = order
    ? STEP_ORDER.indexOf(order.status)
    : -1;

  return (
    <div className="p-4 pb-10">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Track Your Order</h1>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Enter your order number (e.g. UK-123456)"
            className="w-full text-sm border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 outline-none focus:border-[#2E7D32]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
        <button
          type="submit"
          disabled={!searchValue.trim() || loading}
          className="w-full mt-3 h-11 rounded-2xl bg-[#2E7D32] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1B5E20] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Tracking...' : 'Track Order'}
        </button>
      </form>

      {error && (
        <div className="text-center py-10">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{error}</p>
        </div>
      )}

      {!order && !error && !loading && (
        <div className="text-center py-10">
          <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Enter your order number to see live delivery status.</p>
        </div>
      )}

      {order && (
        <div className="space-y-4">
          {/* Order summary header */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-900">{order.order_number}</span>
              {isCancelled ? (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Cancelled
                </span>
              ) : order.status === 'delivered' ? (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Completed
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#FFF3E0] text-[#E65100] flex items-center gap-1">
                  <Clock className="w-3 h-3" /> In Progress
                </span>
              )}
            </div>
            <div className="flex gap-1 overflow-x-auto scrollbar-hide mb-3">
              {order.items?.map((item, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 bg-gray-50 rounded-lg px-2 py-1.5 text-[10px] text-gray-600 font-medium"
                >
                  {item.quantity}x {item.name}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-50">
              <span className="text-gray-500">{order.items?.length || 0} items</span>
              <span className="font-bold text-[#2E7D32]">
                ₦{order.total.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Delivery address */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Delivery Address</h3>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#2E7D32] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-900 font-medium">{order.customer_name}</p>
                <p className="text-sm text-gray-600">{order.customer_address}</p>
                {order.landmark && (
                  <p className="text-xs text-gray-400 mt-0.5">Near {order.landmark}</p>
                )}
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {order.customer_phone}
                </p>
              </div>
            </div>
          </div>

          {/* Tracking timeline */}
          {!isCancelled ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-4">
                Delivery Progress
              </h3>
              <div className="space-y-0">
                {STEPS.map((step, i) => {
                  const isCompleted = i < currentStepIndex;
                  const isCurrent = i === currentStepIndex;
                  const isUpcoming = i > currentStepIndex;
                  const Icon = step.icon;

                  return (
                    <div key={step.key} className="flex gap-3">
                      {/* Icon + connecting line */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCompleted || isCurrent
                              ? 'bg-[#E8F5E9]'
                              : 'bg-gray-100'
                          } ${isCurrent ? 'ring-2 ring-[#2E7D32] ring-offset-1' : ''}`}
                        >
                          <Icon
                            className={`w-4 h-4 ${
                              isCompleted
                                ? 'text-[#2E7D32]'
                                : isCurrent
                                ? 'text-[#2E7D32]'
                                : 'text-gray-400'
                            }`}
                            strokeWidth={isCompleted || isCurrent ? 2.5 : 2}
                          />
                        </div>
                        {i < STEPS.length - 1 && (
                          <div
                            className={`w-0.5 flex-1 min-h-[28px] my-1 rounded-full ${
                              isCompleted ? 'bg-[#2E7D32]' : 'bg-gray-100'
                            }`}
                          />
                        )}
                      </div>

                      {/* Text */}
                      <div className={`pb-6 ${i === STEPS.length - 1 ? 'pb-0' : ''}`}>
                        <p
                          className={`text-sm font-bold ${
                            isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'
                          }`}
                        >
                          {step.title}
                        </p>
                        <p
                          className={`text-xs mt-0.5 ${
                            isCompleted || isCurrent ? 'text-gray-500' : 'text-gray-400'
                          }`}
                        >
                          {step.description}
                        </p>
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-full">
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
                <div className="mt-2 p-3 rounded-xl bg-[#E8F5E9] text-center">
                  <p className="text-sm font-bold text-[#2E7D32]">Your rider is on the way! 🛵</p>
                  <p className="text-xs text-[#2E7D32]/70 mt-0.5">
                    Estimated arrival: 30–60 minutes within Lagos
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-50 rounded-2xl border border-red-100 p-4 text-center">
              <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-red-700">This order was cancelled</p>
              <p className="text-xs text-red-500 mt-1">
                If this is a mistake, please contact support.
              </p>
            </div>
          )}

          <Link
            to="/"
            className="block w-full text-center bg-white border border-gray-200 text-gray-700 text-sm font-bold px-6 py-3 rounded-2xl"
          >
            Continue Shopping
          </Link>
        </div>
      )}
    </div>
  );
}