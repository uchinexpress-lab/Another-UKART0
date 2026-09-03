import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/context/CartContext';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Plus,
  Minus,
  Trash2,
  Loader2,
} from 'lucide-react';

const ACTIVE = ['new', 'processing', 'ready', 'on_the_way'];

const TABS = [
  { key: 'cart', label: 'Cart' },
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'completed', label: 'Completed' },
];

function formatDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function StatusBadge({ status }) {
  if (status === 'delivered')
    return (
      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" /> Completed
      </span>
    );
  if (status === 'cancelled')
    return (
      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 flex items-center gap-1">
        <XCircle className="w-3 h-3" /> Cancelled
      </span>
    );
  return (
    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FFF3E0] text-[#E65100] flex items-center gap-1">
      <Clock className="w-3 h-3" /> In Progress
    </span>
  );
}

export default function Order() {
  const [tab, setTab] = useState('cart');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { items, total, updateQuantity, removeItem, itemCount } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        const list = await base44.entities.Order.filter(
          { customer_email: me?.email || '' },
          '-created_date',
          100
        );
        setOrders(list);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const ongoing = orders.filter((o) => ACTIVE.includes(o.status));
  const completed = orders.filter((o) => !ACTIVE.includes(o.status));
  const deliveryFee = total > 0 ? (total > 30000 ? 0 : 1500) : 0;
  const grandTotal = total + deliveryFee;

  const renderOrderList = (list, emptyLabel) => {
    if (loading)
      return (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      );
    if (list.length === 0)
      return (
        <div className="text-center py-16">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">{emptyLabel}</p>
          <Link
            to="/"
            className="inline-block mt-4 bg-[#2E7D32] text-white text-sm font-bold px-5 py-2.5 rounded-full"
          >
            Start Shopping
          </Link>
        </div>
      );
    return (
      <div className="space-y-3">
        {list.map((o) => (
          <Link
            key={o.id}
            to={`/orders/${o.id}`}
            className="block bg-white rounded-2xl border border-gray-100 p-4 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-900">{o.order_number}</span>
              <StatusBadge status={o.status} />
            </div>
            <p className="text-xs text-gray-400 mb-3">{formatDate(o.created_date)}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {o.items?.length || 0} item{(o.items?.length || 0) > 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1 font-bold text-[#2E7D32] text-sm">
                ₦{(o.total || 0).toLocaleString()}
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 pb-32">
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 text-sm font-semibold py-2 rounded-xl transition-colors ${
              tab === t.key ? 'bg-white text-[#2E7D32] shadow-sm' : 'text-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'cart' &&
        (items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Your cart is empty.</p>
            <Link
              to="/"
              className="inline-block mt-4 bg-[#2E7D32] text-white text-sm font-bold px-5 py-2.5 rounded-full"
            >
              Add Items
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((i) => (
              <div
                key={i.id}
                className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-3"
              >
                <img
                  src={i.image}
                  alt={i.name}
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-1">{i.name}</p>
                  <p className="text-xs text-gray-400">{i.unit || '1 pack'}</p>
                  <p className="text-sm font-bold text-[#2E7D32] mt-0.5">
                    ₦{(i.price * i.quantity).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(i.id, i.quantity - 1)}
                    className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="text-sm font-bold w-6 text-center">{i.quantity}</span>
                  <button
                    onClick={() => updateQuantity(i.id, i.quantity + 1)}
                    className="w-11 h-11 rounded-full bg-[#2E7D32] flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={() => removeItem(i.id)}
                    className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center active:scale-90 transition-transform ml-1"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}

      {tab === 'ongoing' && renderOrderList(ongoing, 'No ongoing orders.')}
      {tab === 'completed' && renderOrderList(completed, 'No completed orders yet.')}

      {tab === 'cart' && items.length > 0 && (
        <div
          className="fixed left-0 right-0 max-w-md mx-auto px-4 py-3 bg-white border-t border-gray-100"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 76px)' }}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-500">
              {itemCount} items · Delivery ₦{deliveryFee.toLocaleString()}
            </span>
            <span className="font-bold text-gray-900">Total ₦{grandTotal.toLocaleString()}</span>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            className="w-full h-12 rounded-2xl bg-[#2E7D32] text-white font-bold text-sm"
          >
            Checkout — ₦{grandTotal.toLocaleString()}
          </button>
        </div>
      )}
    </div>
  );
}