import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2, Package, ChevronRight, Clock, Truck, CheckCircle2, XCircle, ChefHat } from 'lucide-react';

const naira = (n) => '\u20A6' + (n || 0).toLocaleString();

const STATUS_CONFIG = {
  new: { label: 'Order Placed', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
  processing: { label: 'Being Prepared', icon: ChefHat, color: 'text-amber-600', bg: 'bg-amber-50' },
  ready: { label: 'Ready for Delivery', icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
  on_the_way: { label: 'Out for Delivery', icon: Truck, color: 'text-[#2E7D32]', bg: 'bg-[#2E7D32]/10' },
  delivered: { label: 'Delivered', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
};

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const me = await base44.auth.me();
        const all = await base44.entities.Order.list('-created_date', 20);
        const mine = me?.id ? all.filter((o) => o.created_by_id === me.id) : all;
        if (!cancelled) setOrders(mine);
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const unsub = base44.entities.Order.subscribe(() => load());
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );

  if (orders.length === 0)
    return (
      <div className="bg-card rounded-2xl border border-border p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
          <Package className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm font-semibold text-foreground">No orders yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Your past orders will appear here once you start shopping.
        </p>
      </div>
    );

  return (
    <div className="space-y-2.5">
      {orders.map((o) => {
        const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.new;
        const Icon = cfg.icon;
        const isActive = o.status !== 'delivered' && o.status !== 'cancelled';
        return (
          <Link
            key={o.id}
            to={isActive ? `/track?order=${o.order_number}` : `/orders/${o.id}`}
            className="block bg-card rounded-2xl border border-border p-3.5 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-foreground">#{o.order_number}</p>
                  <span className={`text-[10px] font-bold ${cfg.color} ${cfg.bg} px-2 py-0.5 rounded-full`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(o.created_date)} · {naira(o.total)} · {(o.items || []).length} item{(o.items || []).length !== 1 ? 's' : ''}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}