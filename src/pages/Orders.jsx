import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react';
import PullToRefresh from '@/components/home/PullToRefresh';

const ACTIVE = ['new', 'processing', 'ready', 'on_the_way'];

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
          {filtered.map((o) => (
            <Link
              key={o.id}
              to={`/orders/${o.id}`}
              className="block bg-card rounded-2xl border border-border p-4 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-foreground">{o.order_number}</span>
                <StatusBadge status={o.status} />
              </div>
              <p className="text-xs text-gray-400 mb-3">{formatDate(o.created_date)}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
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
      )}
    </div>
    </PullToRefresh>
  );
}