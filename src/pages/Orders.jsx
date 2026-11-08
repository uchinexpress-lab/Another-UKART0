import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/context/CartContext';
import { toast } from '@/components/ui/use-toast';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  ShoppingBag,
  Truck,
  RotateCw,
} from 'lucide-react';
import PullToRefresh from '@/components/home/PullToRefresh';

const ACTIVE = ['awaiting_payment', 'new', 'processing', 'ready', 'on_the_way'];
const ACTIVE_STEP_INDEX = { new: 0, processing: 1, ready: 2, on_the_way: 3 };

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
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
  if (status === 'awaiting_payment')
    return (
      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FFF3E0] text-[#E65100] flex items-center gap-1">
        <Clock className="w-3 h-3" /> Awaiting Payment
      </span>
    );
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
    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-secondary text-[#2E7D32] flex items-center gap-1">
      <Truck className="w-3 h-3" /> In Progress
    </span>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');
  const [payingId, setPayingId] = useState(null);
  const { addItems } = useCart();
  const navigate = useNavigate();

  const payNow = async (e, order) => {
    e.preventDefault();
    e.stopPropagation();
    setPayingId(order.id);
    try {
      const callbackUrl = `${window.location.origin}/payment/callback`;
      const res = await base44.functions.invoke('initiatePaystackPayment', {
        orderId: order.id,
        callbackUrl,
      });
      if (res.data?.authorization_url) {
        window.location.href = res.data.authorization_url;
        return;
      }
      toast({ title: 'Could not start payment', description: res.data?.error || 'Please try again.' });
    } catch (err) {
      toast({ title: 'Could not start payment', description: err?.message || 'Please try again.' });
    }
    setPayingId(null);
  };

  const reorder = (e, order) => {
    e.preventDefault();
    e.stopPropagation();
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

  const loadOrders = async () => {
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
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filtered = orders.filter((o) => {
    // An abandoned checkout lives in the cart, never as a pending order.
    if (o.payment_status === 'Abandoned') return false;
    if (tab === 'active') return ACTIVE.includes(o.status);
    if (tab === 'delivered') return o.status === 'delivered';
    return o.status === 'cancelled';
  });

  return (
    <PullToRefresh onRefresh={loadOrders}>
    <div className="uk-page">
      <div className="uk-tabs mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`uk-tab ${tab === t.key ? 'uk-tab-active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14">
          <ShoppingBag className="w-9 h-9 text-muted-foreground/40 mx-auto mb-2.5" />
          <p className="uk-sub">No {tab} orders yet.</p>
          <Link
            to="/"
            className="inline-block mt-3.5 bg-retail text-retail-foreground text-[13px] font-bold px-5 py-2.5 rounded-lg"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const isActive = ACTIVE.includes(o.status);
            const stepIdx = ACTIVE_STEP_INDEX[o.status] ?? -1;
            const progressPct = stepIdx >= 0 ? ((stepIdx + 1) / 5) * 100 : 100;
            return (
              <div key={o.id} className="uk-card px-3.5 py-3">
                <Link
                  to={isActive && o.payment_status === 'Paid' ? `/track?id=${o.id}` : `/orders/${o.id}`}
                  className="block active:opacity-70 transition-opacity"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-foreground truncate">{o.order_number}</p>
                      <p className="uk-list-sub">
                        {formatDate(o.created_date)} · {(o.items?.length || 0)} item
                        {(o.items?.length || 0) === 1 ? '' : 's'}
                      </p>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>

                  <div className="flex items-end justify-between gap-2 mt-2.5">
                    <div>
                      <p className="text-[15px] font-bold text-foreground">
                        ₦{(o.total || 0).toLocaleString()}
                      </p>
                      <p
                        className={`flex items-center gap-1 text-[11px] font-medium ${
                          o.payment_status === 'Paid'
                            ? 'text-retail'
                            : o.payment_status === 'Failed'
                            ? 'text-red-600'
                            : 'text-amber-600'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        Payment {o.payment_status || 'Pending'}
                      </p>
                    </div>

                    {isActive ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-retail pb-0.5">
                        Track Order <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    ) : (o.items?.length || 0) > 0 ? (
                      <button
                        onClick={(e) => reorder(e, o)}
                        className="flex items-center gap-1.5 border border-retail text-retail text-[11px] font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                      >
                        <RotateCw className="w-3 h-3" /> Reorder
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground pb-0.5">
                        Details <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  {isActive && o.payment_status === 'Paid' && (
                    <div className="mt-2.5">
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-retail transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </Link>

                {o.payment_status !== 'Paid' && (
                  <button
                    onClick={(e) => payNow(e, o)}
                    disabled={payingId === o.id}
                    className="w-full mt-2.5 h-9 rounded-lg bg-retail text-retail-foreground text-[12px] font-bold disabled:opacity-50"
                  >
                    {payingId === o.id
                      ? 'Starting…'
                      : o.payment_status === 'Failed'
                      ? 'Retry Payment'
                      : 'Pay Now'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}