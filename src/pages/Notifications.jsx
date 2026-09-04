import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Loader2,
  Package,
  Tag,
  CheckCircle2,
  Truck,
  Star,
  Bell,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import RateDeliveryCard from '@/components/notifications/RateDeliveryCard';
import PullToRefresh from '@/components/home/PullToRefresh';

const DEFAULTS = {
  order_updates: true,
  promotions: true,
  new_products: true,
  delivery_updates: true,
  push_enabled: true,
};

const ITEMS = [
  { key: 'order_updates', label: 'Order Updates', desc: 'Status changes on your orders', icon: Package },
  { key: 'delivery_updates', label: 'Delivery Updates', desc: 'Rider dispatch and arrival alerts', icon: Truck },
  { key: 'promotions', label: 'Promotions & Discounts', desc: 'Deals, offers and seasonal sales', icon: Tag },
  { key: 'new_products', label: 'New Products', desc: 'Fresh arrivals and restocks', icon: Star },
];

const STATUS_LABELS = {
  processing: 'Being Prepared',
  ready: 'Ready for Delivery',
  on_the_way: 'Out for Delivery',
};

const timeAgo = (d) => {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
};

const naira = (n) => '\u20A6' + (n || 0).toLocaleString();

const itemKey = (it) => {
  if (it.kind === 'deal') return `deal-${it.product.id}`;
  if (it.kind === 'placed') return `placed-${it.order.id}`;
  if (it.kind === 'status') return `status-${it.order.id}-${it.order.status}`;
  if (it.kind === 'delivered') return `delivered-${it.order.id}`;
  return '';
};

export default function Notifications() {
  const [prefs, setPrefs] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [weeklyDeals, setWeeklyDeals] = useState([]);
  const [feed, setFeed] = useState([]);

  const seenRef = useRef(new Set());
  const firstLoadRef = useRef(true);
  const pushEnabledRef = useRef(true);

  const loadData = async () => {
    let u = null;
    try {
      u = await base44.auth.me();
      setPrefs({ ...DEFAULTS, ...(u?.notification_preferences || {}) });
      pushEnabledRef.current = !!(u?.notification_preferences?.push_enabled ?? true);
    } catch {}
    try {
      const [prods, ords] = await Promise.all([
        base44.entities.Product.list(),
        base44.entities.Order.list('-created_date', 50),
      ]);
      setWeeklyDeals(prods.filter((p) => p.is_weekly_deal));
      setOrders(u?.id ? ords.filter((o) => o.created_by_id === u.id) : ords);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Realtime: refresh the feed whenever an order or product changes
  useEffect(() => {
    const unsubO = base44.entities.Order.subscribe(() => loadData());
    const unsubP = base44.entities.Product.subscribe(() => loadData());
    return () => {
      unsubO();
      unsubP();
    };
  }, []);

  useEffect(() => {
    const items = [];
    weeklyDeals.forEach((p) =>
      items.push({ kind: 'deal', date: p.updated_date || p.created_date, product: p })
    );
    orders.forEach((o) => {
      items.push({ kind: 'placed', date: o.created_date, order: o });
      if (STATUS_LABELS[o.status]) {
        items.push({ kind: 'status', date: o.updated_date || o.created_date, order: o });
      }
      if (o.status === 'delivered')
        items.push({ kind: 'delivered', date: o.updated_date || o.created_date, order: o });
    });
    items.sort((a, b) => new Date(b.date) - new Date(a.date));
    setFeed(items);
  }, [orders, weeklyDeals]);

  const fireNotification = (title, body) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    if (!pushEnabledRef.current) return;
    try {
      const n = new Notification(title, { body, tag: title + body });
      setTimeout(() => n.close(), 6000);
    } catch {}
  };

  // Fire a browser push notification for newly-seen feed items
  useEffect(() => {
    if (loading) return;
    if (firstLoadRef.current) {
      feed.forEach((it) => seenRef.current.add(itemKey(it)));
      firstLoadRef.current = false;
      return;
    }
    feed.forEach((it) => {
      const k = itemKey(it);
      if (!seenRef.current.has(k)) {
        seenRef.current.add(k);
        if (it.kind === 'deal') fireNotification('\uD83D\uDED2 New weekly deal', it.product.name);
        else if (it.kind === 'placed')
          fireNotification('\uD83D\uDED2 Order placed', `#${it.order.order_number} confirmed`);
        else if (it.kind === 'status')
          fireNotification('\uD83D\uDEF5 Order update', `#${it.order.order_number}: ${STATUS_LABELS[it.order.status]}`);
        else if (it.kind === 'delivered')
          fireNotification('\u2705 Delivered', `#${it.order.order_number} has been delivered`);
      }
    });
  }, [feed, loading]);

  const toggle = async (key) => {
    // Enabling push -> request browser notification permission first
    if (key === 'push_enabled' && !prefs.push_enabled) {
      if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
        try {
          const perm = await Notification.requestPermission();
          if (perm !== 'granted') {
            toast({
              title: 'Push blocked',
              description: 'Enable notifications in your browser settings to get alerts.',
              variant: 'destructive',
            });
            return;
          }
        } catch {
          toast({ title: 'Could not enable push', variant: 'destructive' });
          return;
        }
      }
    }
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    pushEnabledRef.current = next.push_enabled;
    try {
      await base44.auth.updateMe({ notification_preferences: next });
      if (key === 'push_enabled') {
        toast({ title: next.push_enabled ? 'Push notifications on' : 'Push notifications off' });
      }
    } catch {
      setPrefs(prefs);
      pushEnabledRef.current = prefs.push_enabled;
      toast({ title: 'Could not update preference', variant: 'destructive' });
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );

  return (
    <PullToRefresh onRefresh={loadData}>
    <div className="p-4 space-y-6">
      {/* Feed */}
      <div>
        <h2 className="text-sm font-bold text-gray-900 mb-3 px-1">Recent</h2>
        {feed.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-[#2E7D32]/10 flex items-center justify-center mx-auto mb-3">
              <Bell className="w-7 h-7 text-[#2E7D32]" />
            </div>
            <p className="text-sm font-semibold text-gray-900">No notifications yet</p>
            <p className="text-xs text-gray-500 mt-1">Order updates and weekly deals will show here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {feed.map((item, i) => {
              if (item.kind === 'deal') {
                const p = item.product;
                return (
                  <Link
                    key={`deal-${p.id}-${i}`}
                    to={`/search?q=${encodeURIComponent(p.name)}`}
                    className="block bg-white rounded-2xl border border-gray-100 p-4 active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <Tag className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-amber-600">Weekly Deal</p>
                        <p className="text-sm font-semibold text-gray-900 line-clamp-1">{p.name}</p>
                        <p className="text-xs text-gray-500">
                          {naira(p.price)}
                          {p.original_price ? (
                            <span className="line-through ml-1 text-gray-400">{naira(p.original_price)}</span>
                          ) : null}
                        </p>
                      </div>
                      <span className="text-[11px] text-gray-400 shrink-0">{timeAgo(item.date)}</span>
                    </div>
                  </Link>
                );
              }
              if (item.kind === 'placed') {
                const o = item.order;
                const showTrack = o.status !== 'delivered' && o.status !== 'cancelled';
                return (
                  <div key={`placed-${o.id}`} className="bg-white rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#2E7D32]/10 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-[#2E7D32]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">Order placed</p>
                        <p className="text-xs text-gray-500">#{o.order_number} · {naira(o.total)}</p>
                      </div>
                      <span className="text-[11px] text-gray-400 shrink-0">{timeAgo(item.date)}</span>
                    </div>
                    {showTrack && (
                      <Link
                        to={`/track?order=${o.order_number}`}
                        className="mt-3 inline-flex text-xs font-semibold text-[#2E7D32] bg-[#E8F5E9] px-3 py-1.5 rounded-full"
                      >
                        Track order
                      </Link>
                    )}
                  </div>
                );
              }
              if (item.kind === 'status') {
                const o = item.order;
                return (
                  <div key={`status-${o.id}-${o.status}`} className="bg-white rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#2E7D32]/10 flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5 text-[#2E7D32]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{STATUS_LABELS[o.status]}</p>
                        <p className="text-xs text-gray-500">#{o.order_number} · {naira(o.total)}</p>
                      </div>
                      <span className="text-[11px] text-gray-400 shrink-0">{timeAgo(item.date)}</span>
                    </div>
                    <Link
                      to={`/track?order=${o.order_number}`}
                      className="mt-3 inline-flex text-xs font-semibold text-[#2E7D32] bg-[#E8F5E9] px-3 py-1.5 rounded-full"
                    >
                      Track order
                    </Link>
                  </div>
                );
              }
              const o = item.order;
              return (
                <div key={`delivered-${o.id}`} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#2E7D32]/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-[#2E7D32]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">Order delivered</p>
                      <p className="text-xs text-gray-500">#{o.order_number} · {naira(o.total)}</p>
                    </div>
                    <span className="text-[11px] text-gray-400 shrink-0">{timeAgo(item.date)}</span>
                  </div>
                  <RateDeliveryCard order={o} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preferences */}
      <div>
        <h2 className="text-sm font-bold text-gray-900 mb-3 px-1">Preferences</h2>
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.key} className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-xl bg-[#2E7D32]/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#2E7D32]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <Switch checked={!!prefs[item.key]} onCheckedChange={() => toggle(item.key)} />
              </div>
            );
          })}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 mt-3">
          <div className="w-10 h-10 rounded-xl bg-[#2E7D32]/10 flex items-center justify-center">
            <Truck className="w-5 h-5 text-[#2E7D32]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Push Notifications</p>
            <p className="text-xs text-gray-500">Receive push alerts on this device</p>
          </div>
          <Switch checked={!!prefs.push_enabled} onCheckedChange={() => toggle('push_enabled')} />
        </div>
        <p className="text-xs text-gray-400 text-center px-6 mt-3">
          You'll still receive order confirmation emails for any placed order.
        </p>
      </div>
    </div>
    </PullToRefresh>
  );
}