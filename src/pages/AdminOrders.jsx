import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { notifyOrderStatusChanged } from '@/lib/notifications';
import { getStatusLabel } from '@/lib/emailTemplates';
import {
  ArrowLeft,
  Loader2,
  Lock,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
} from 'lucide-react';

const STATUSES = [
  { value: 'new', label: 'Order Placed', color: 'bg-gray-100 text-gray-700' },
  { value: 'processing', label: 'Being Prepared', color: 'bg-amber-100 text-amber-700' },
  { value: 'ready', label: 'Ready for Delivery', color: 'bg-blue-100 text-blue-700' },
  { value: 'on_the_way', label: 'Out for Delivery', color: 'bg-purple-100 text-purple-700' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700' },
];

function StatusBadge({ status }) {
  const s = STATUSES.find((x) => x.value === status) || STATUSES[0];
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.color}`}>
      {s.label}
    </span>
  );
}

function OrderCard({ order, onStatusChange, updatingId, highlighted }) {
  const [expanded, setExpanded] = useState(highlighted);

  return (
    <div
      className={`bg-white rounded-2xl border p-4 ${
        highlighted ? 'border-[#2E7D32] ring-1 ring-[#2E7D32]/20' : 'border-gray-100'
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-gray-900">{order.order_number}</span>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-xs text-gray-500">
            {order.customer_name} · {order.items?.length || 0} items · ₦
            {order.total.toLocaleString()}
          </p>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-50 space-y-3">
          {/* Customer info */}
          <div className="space-y-1.5">
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <Mail className="w-3 h-3" /> {order.customer_email || 'No email'}
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <Phone className="w-3 h-3" /> {order.customer_phone}
            </p>
            <p className="text-xs text-gray-500 flex items-start gap-1.5">
              <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <span>
                {order.customer_address}
                {order.landmark ? ` (Near ${order.landmark})` : ''}
              </span>
            </p>
          </div>

          {/* Items */}
          <div className="bg-gray-50 rounded-xl p-2 space-y-1">
            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-gray-700">
                  {item.quantity}x {item.name}
                </span>
                <span className="text-gray-500 font-medium">
                  ₦{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total</span>
            <span className="font-bold text-[#2E7D32]">
              ₦{order.total.toLocaleString()}
            </span>
          </div>

          {/* Status selector */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1.5">Update Status</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => onStatusChange(order.id, s.value)}
                  disabled={updatingId === order.id || order.status === s.value}
                  className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                    order.status === s.value
                      ? 'bg-[#2E7D32] text-white border-[#2E7D32]'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-[#2E7D32]'
                  } ${updatingId === order.id ? 'opacity-50' : ''}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {updatingId === order.id && (
              <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Updating & sending email...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminOrders() {
  const [params] = useSearchParams();
  const highlightOrder = params.get('order');
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.Order.list('-created_date', 100);
      setOrders(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') loadOrders();
    else if (user !== null) setLoading(false);
  }, [user]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await base44.entities.Order.update(orderId, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      await notifyOrderStatusChanged(orderId, newStatus);
    } catch (e) {
      alert('Failed to update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (!user || loading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#2E7D32] mx-auto" />
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="p-8 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <Lock className="w-12 h-12 text-gray-300 mb-3" />
        <h2 className="text-lg font-bold text-gray-900 mb-1">Admins Only</h2>
        <p className="text-sm text-gray-500 mb-4">
          You need an admin account to manage orders.
        </p>
        <Link to="/" className="text-[#2E7D32] font-bold text-sm">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 pb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Link to="/profile" className="p-1.5 -ml-1.5 rounded-full hover:bg-black/5">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Manage Orders</h1>
        </div>
        <button
          onClick={loadOrders}
          className="p-2 rounded-full hover:bg-gray-100"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <p className="text-xs text-gray-500 mb-4">
        Tap an order to expand it and update its status. The customer is emailed
        automatically when the status changes.
      </p>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-gray-400">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
              updatingId={updatingId}
              highlighted={highlightOrder === order.order_number}
            />
          ))}
        </div>
      )}
    </div>
  );
}