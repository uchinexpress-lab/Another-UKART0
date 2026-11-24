
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/context/CartContext';
import { toast } from '@/components/ui/use-toast';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  ShoppingBag,
  Truck,
  RotateCw,
  ShoppingCart,
  ArrowRight,
  Plus,
  Minus,
} from 'lucide-react';
import PullToRefresh from '@/components/home/PullToRefresh';

const ACTIVE = ['new', 'processing', 'ready', 'on_the_way'];
const ACTIVE_STEP_INDEX = {
  new: 0,
  processing: 1,
  ready: 2,
  on_the_way: 3,
};

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

function money(value) {
  return `₦${Number(value || 0).toLocaleString('en-NG')}`;
}

function StatusBadge({ status }) {
  if (status === 'delivered') {
    return (
      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-secondary text-[#2E7D32] flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" /> Completed
      </span>
    );
  }

  if (status === 'cancelled') {
    return (
      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 flex items-center gap-1">
        <XCircle className="w-3 h-3" /> Cancelled
      </span>
    );
  }

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

  const {
    items = [],
    total = 0,
    itemCount = 0,
    addItems,
  } = useCart();

  const navigate = useNavigate();

  const cartHasItems = items.length > 0;

  const displayedItemCount =
    itemCount || items.reduce((sum, item) => sum + Number(item.quantity || 1), 0);

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
    toast({
      title: `Added ${cartItems.length} item${cartItems.length > 1 ? 's' : ''} to cart`,
    });
    navigate('/cart');
  };

  const loadOrders = async () => {
    setLoading(true);

    try {
      const me = await base44.auth.me();

      const result = await base44.entities.Order.filter(
        { customer_email: me?.email || '' },
        { sort: '-created_date', limit: 100 }
      );

      // Only successfully paid orders belong in order history.
      setOrders(
        (result.items || []).filter(
          (order) => order.payment_status === 'Paid'
        )
      );
    } catch (error) {
      console.error('Unable to load orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filtered = orders.filter((order) => {
    if (tab === 'active') return ACTIVE.includes(order.status);
    if (tab === 'delivered') return order.status === 'delivered';
    return order.status === 'cancelled';
  });

  return (
    <PullToRefresh onRefresh={loadOrders}>
      <div className="uk-page">

        {/* CURRENT CART — shown only when the customer has items */}
        {cartHasItems && (
          <section className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-extrabold text-foreground">
                  Your Cart
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Items you've selected and are ready to order
                </p>
              </div>

              <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-secondary text-[#2E7D32]">
                {displayedItemCount} item{displayedItemCount === 1 ? '' : 's'}
              </span>
            </div>

            <div className="uk-card overflow-hidden">
              <div className="divide-y divide-border">
                {items.map((item, index) => {
                  const quantity = Number(item.quantity || 1);
                  const unitPrice =
                    Number(item.price || 0) +
                    Number(item.addons_total || 0);

                  return (
                    <div
                      key={item.id || `${item.name}-${index}`}
                      className="flex items-center gap-3 px-3.5 py-3"
                    >
                      <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-5 h-5 text-retail" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-foreground line-clamp-2">
                          {item.name || item.title || 'Cart item'}
                        </p>

                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Qty: {quantity}
                          {item.unit ? ` · ${item.unit}` : ''}
                        </p>
                      </div>

                      <p className="text-[13px] font-bold text-foreground whitespace-nowrap">
                        {money(unitPrice * quantity)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-border bg-secondary/40 px-3.5 py-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] font-semibold text-muted-foreground">
                    Cart subtotal
                  </span>
                  <span className="text-base font-extrabold text-foreground">
                    {money(total)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/cart')}
                  className="w-full h-11 rounded-xl bg-retail text-retail-foreground text-[13px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Continue to Checkout
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* PREVIOUSLY PAID ORDERS */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-extrabold text-foreground">
              Order History
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track your previous purchases
            </p>
          </div>
        </div>

        <div className="uk-tabs mb-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`uk-tab ${
                tab === t.key ? 'uk-tab-active' : ''
              }`}
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

            <p className="uk-sub">
              No {tab} orders yet.
            </p>

            <Link
              to="/"
              className="inline-block mt-3.5 bg-retail text-retail-foreground text-[13px] font-bold px-5 py-2.5 rounded-lg"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => {
              const isActive = ACTIVE.includes(order.status);
              const stepIdx = ACTIVE_STEP_INDEX[order.status] ?? -1;
              const progressPct =
                stepIdx >= 0 ? ((stepIdx + 1) / 5) * 100 : 100;

              return (
                <div key={order.id} className="uk-card px-3.5 py-3">
                  <Link
                    to={
                      isActive
                        ? `/track?id=${order.id}`
                        : `/orders/${order.id}`
                    }
                    className="block active:opacity-70 transition-opacity"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-foreground truncate">
                          {order.order_number}
                        </p>

                        <p className="uk-list-sub">
                          {formatDate(order.created_date)} ·{' '}
                          {order.items?.length || 0} item
                          {(order.items?.length || 0) === 1 ? '' : 's'}
                        </p>
                      </div>

                      <StatusBadge status={order.status} />
                    </div>

                    <div className="flex items-end justify-between gap-2 mt-2.5">
                      <div>
                        <p className="text-[15px] font-bold text-foreground">
                          {money(order.total)}
                        </p>

                        <p className="flex items-center gap-1 text-[11px] font-medium text-retail">
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          Payment Successful
                        </p>
                      </div>

                      {isActive ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-retail pb-0.5">
                          Track Order
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      ) : (order.items?.length || 0) > 0 ? (
                        <button
                          onClick={(e) => reorder(e, order)}
                          className="flex items-center gap-1.5 border border-retail text-retail text-[11px] font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                        >
                          <RotateCw className="w-3 h-3" />
                          Reorder
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground pb-0.5">
                          Details
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    {isActive && (
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}
