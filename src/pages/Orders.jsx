import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/context/CartContext';
import { toast } from '@/components/ui/use-toast';
import {
  Package,
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
      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-[#2E7D32] flex items-center gap-1">
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
    if (tab === 'active') return ACTIVE.includes(o.status);
    if (tab === 'delivered') return o.status === 'delivered';
    return o.status === 'cancelled';
  });

  return (
    <PullToRefresh onRefresh={loadOrders}>
    <div className="p-4">
      <div className="flex bg-muted rounded-2xl p-1 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 text-sm font-semibold py-2 rounded-xl transition-colors ${
              tab === t.key ? 'bg-card text-[#2E7D32] shadow-sm' : 'text-muted-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No {tab} orders yet.</p>
          <Link
            to="/"
            className="inline-block mt-4 bg-[#2E7D32] text-white text-sm font-bold px-5 py-2.5 rounded-full"
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
              <Link
                key={o.id}
                to={isActive && o.payment_status === 'Paid' ? `/track?id=${o.id}` : `/orders/${o.id}`}
                className="block bg-card rounded-2xl border border-border p-4 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-foreground">{o.order_number}</span>
                  <StatusBadge status={o.status} />
                </div>
                {o.payment_status === 'Paid' ? (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-[#2E7D32] mb-1">
                    <CheckCircle2 className="w-3 h-3" /> Payment Confirmed
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`flex items-center gap-1 text-[10px] font-bold ${o.payment_status === 'Failed' ? 'text-red-600' : 'text-[#E65100]'}`}>
                      <XCircle className="w-3 h-3" />
                      {o.payment_status === 'Failed' ? 'Payment Failed' : 'Payment Pending'}
                    </span>
                    <button
                      onClick={(e) => payNow(e, o)}
                      disabled={payingId === o.id}
                      className="text-[10px] font-bold text-white bg-[#2E7D32] px-2.5 py-1 rounded-full disabled:opacity-50"
                    >
                      {payingId === o.id ? 'Starting…' : o.payment_status === 'Failed' ? 'Retry Payment' : 'Pay Now'}
                    </button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mb-3">{formatDate(o.created_date)}</p>

                {/* Mini progress bar for active orders */}
                {isActive && (
                  <div className="mb-3">
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#2E7D32] transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] font-bold text-[#2E7D32]">
                      <Truck className="w-3 h-3" />
                      <span>Track shipment · {Math.round(progressPct)}% complete</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {o.items?.length || 0} item{(o.items?.length || 0) > 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1 font-bold text-[#2E7D32] text-sm">
                    ₦{(o.total || 0).toLocaleString()}
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>

                {!isActive && (o.items?.length || 0) > 0 && (
                  <button
                    onClick={(e) => reorder(e, o)}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 bg-[#2E7D32]/10 text-[#2E7D32] text-sm font-bold py-2.5 rounded-xl active:scale-[0.98] transition-transform"
                  >
                    <RotateCw className="w-4 h-4" /> Reorder
                  </button>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}