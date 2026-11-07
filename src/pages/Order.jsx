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
import { Image } from '@/components/ui/image';

const ACTIVE = ['awaiting_payment', 'new', 'processing', 'ready', 'on_the_way'];

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
      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-secondary text-[#2E7D32] flex items-center gap-1">
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
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      );
    if (list.length === 0)
      return (
        <div className="text-center py-16">
          <ShoppingBag className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="uk-sub">{emptyLabel}</p>
          <Link
            to="/"
            className="inline-block mt-4 bg-[#2E7D32] text-white text-sm font-bold px-5 py-2.5 rounded-xl"
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
            className="block uk-card p-3.5 active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[13px] font-bold text-foreground">{o.order_number}</span>
              <StatusBadge status={o.status} />
            </div>
            <p className="uk-meta mb-2">{formatDate(o.created_date)}</p>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="uk-meta">
                {(o.items?.length || 0)} item{(o.items?.length || 0) > 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1 font-bold text-[#2E7D32] text-[13px]">
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
    <div className="uk-page pb-40">
      <h1 className="uk-title mb-3">Orders</h1>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 -mx-1 px-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`uk-chip ${tab === t.key ? 'uk-chip-active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'cart' &&
        (items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="uk-sub">Your cart is empty.</p>
            <Link
              to="/"
              className="inline-block mt-4 bg-[#2E7D32] text-white text-sm font-bold px-5 py-2.5 rounded-xl"
            >
              Add Items
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((i) => (
              <div key={i.id} className="uk-card p-3 flex items-start gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted shrink-0">
                  <Image src={i.image} alt={i.name} className="w-14 h-14" fittingType="fill" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground line-clamp-1">{i.name}</p>
                  <p className="text-[11px] text-muted-foreground">{i.unit || '1 pack'}</p>
                  <p className="text-[13px] font-bold text-foreground mt-0.5">
                    ₦{(i.price * i.quantity).toLocaleString()}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-border rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(i.id, i.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="w-9 h-8 flex items-center justify-center active:bg-muted"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-[13px] font-bold">{i.quantity}</span>
                      <button
                        onClick={() => updateQuantity(i.id, i.quantity + 1)}
                        aria-label="Increase quantity"
                        className="w-9 h-8 flex items-center justify-center text-white bg-[#2E7D32] active:opacity-80"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(i.id)}
                      aria-label="Remove item"
                      className="w-10 h-8 rounded-lg bg-muted flex items-center justify-center active:scale-95 transition-transform"
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

      {tab === 'ongoing' && renderOrderList(ongoing, 'No ongoing orders.')}
      {tab === 'completed' && renderOrderList(completed, 'No completed orders yet.')}

      {tab === 'cart' && items.length > 0 && (
        <div
          className="fixed left-0 right-0 max-w-md mx-auto px-4 pt-3 bg-card border-t border-border"
          style={{ bottom: 0, paddingBottom: 'calc(env(safe-area-inset-bottom) + 72px)' }}
        >
          <div className="flex items-center justify-between text-[11px] mb-2">
            <span className="text-muted-foreground">
              {itemCount} items · Delivery ₦{deliveryFee.toLocaleString()}
            </span>
            <span className="font-bold text-foreground">Total ₦{grandTotal.toLocaleString()}</span>
          </div>
          <button onClick={() => navigate('/checkout')} className="uk-btn">
            Checkout — ₦{grandTotal.toLocaleString()}
          </button>
        </div>
      )}
    </div>
  );
}