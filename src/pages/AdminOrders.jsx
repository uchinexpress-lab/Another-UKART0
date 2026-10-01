import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { notifyOrderStatusChanged } from '@/lib/notifications';
import SheetSelect from '@/components/SheetSelect';
import { getStatusLabel } from '@/lib/emailTemplates';
import {
  ArrowLeft,
  Loader2,
  Lock,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  Search,
  Calendar,
  Star,
  X,
  Bike } from
'lucide-react';
import AssignRiderSheet from '@/components/admin/AssignRiderSheet';

const STATUSES = [
{ value: 'new', label: 'Order Placed', color: 'bg-muted text-gray-700' },
{ value: 'processing', label: 'Being Prepared', color: 'bg-amber-100 text-amber-700' },
{ value: 'ready', label: 'Ready for Delivery', color: 'bg-blue-100 text-blue-700' },
{ value: 'on_the_way', label: 'Out for Delivery', color: 'bg-purple-100 text-purple-700' },
{ value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-700' },
{ value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700' }];


function StatusBadge({ status }) {
  const s = STATUSES.find((x) => x.value === status) || STATUSES[0];
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${s.color}`}>
      {s.label}
    </span>);

}

function OrderCard({ order, onStatusChange, updatingId, highlighted, onViewCustomer, onAssignRider }) {
  const [expanded, setExpanded] = useState(highlighted);
  const [review, setReview] = useState(null);
  const [reviewLoaded, setReviewLoaded] = useState(false);

  useEffect(() => {
    if (expanded && order.status === 'delivered' && !reviewLoaded) {
      base44.entities.DeliveryReview
        .filter({ order_id: order.id })
        .then((r) => setReview(r[0] || null))
        .catch(() => {})
        .finally(() => setReviewLoaded(true));
    }
  }, [expanded, order.status, order.id, reviewLoaded]);

  return (
    <div
      className={`bg-card rounded-2xl border p-4 ${
      highlighted ? 'border-[#2E7D32] ring-1 ring-[#2E7D32]/20' : 'border-border'}`
      }>
      
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between">
        
        <div className="text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-foreground">{order.order_number}</span>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-xs text-muted-foreground">
            {order.customer_name} · {order.items?.length || 0} items · ₦
            {order.total.toLocaleString()}
          </p>
        </div>
      </button>

      {expanded &&
      <div className="mt-3 pt-3 border-t border-gray-50 space-y-3">
          {/* Customer info */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Mail className="w-3 h-3" /> {order.customer_email || 'No email'}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Phone className="w-3 h-3" /> {order.customer_phone}
            </p>
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <span>
                {order.customer_address}
                {order.landmark ? ` (Near ${order.landmark})` : ''}
              </span>
            </p>
          </div>

          {onViewCustomer && order.customer_email && (
            <button
              onClick={() => onViewCustomer(order.customer_email)}
              className="text-xs font-semibold text-[#2E7D32] flex items-center gap-1"
            >
              View this customer's order history →
            </button>
          )}
          {/* Items */}
          <div className="bg-muted/50 rounded-xl p-2 space-y-1">
            {order.items?.map((item, i) =>
          <div key={i} className="flex justify-between text-xs">
                <span className="text-gray-700">
                  {item.quantity}x {item.name}
                </span>
                <span className="text-muted-foreground font-medium">
                  ₦{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                </span>
              </div>
          )}
          </div>

          {/* Total */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-bold text-[#2E7D32]">
              ₦{order.total.toLocaleString()}
            </span>
          </div>

          {/* Delivery rating */}
          {order.status === 'delivered' && (
            <div className="bg-primary/10 rounded-xl p-2.5">
              <p className="text-xs font-semibold text-gray-600 mb-1">Delivery Rating</p>
              {!reviewLoaded ? (
                <p className="text-xs text-gray-400">Loading…</p>
              ) : review ? (
                <>
                  <div className="flex items-center gap-0.5 mb-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= review.rating ? 'fill-[#FFB300] text-[#FFB300]' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-600 ml-1">{review.rating}/5</span>
                  </div>
                  {review.comment && (
                    <p className="text-xs text-gray-700 italic">"{review.comment}"</p>
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-400">No rating submitted yet</p>
              )}
            </div>
          )}

          {/* Assign Rider */}
          {!['delivered', 'cancelled'].includes(order.status) && (
            <button
              onClick={() => onAssignRider(order)}
              className="w-full h-10 rounded-xl bg-[#1B4332] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform mb-2"
            >
              <Bike className="w-3.5 h-3.5" /> Assign Rider
            </button>
          )}

          {/* Status selector */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1.5">Update Status</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map((s) =>
            <button
              key={s.value}
              onClick={() => onStatusChange(order.id, s.value)}
              disabled={updatingId === order.id || order.status === s.value}
              className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
              order.status === s.value ?
              'bg-[#2E7D32] text-white border-[#2E7D32]' :
              'bg-card text-gray-700 border-gray-200 hover:border-[#2E7D32]'} ${
              updatingId === order.id ? 'opacity-50' : ''}`}>
              
                  {s.label}
                </button>
            )}
            </div>
            {updatingId === order.id &&
          <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Updating & sending email...
              </p>
          }
          </div>
        </div>
      }
    </div>);

}

export default function AdminOrders() {
  const [params] = useSearchParams();
  const highlightOrder = params.get('order');
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [customerFilter, setCustomerFilter] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [assignOrder, setAssignOrder] = useState(null);

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
    if (user?.role === 'admin') loadOrders();else
    if (user !== null) setLoading(false);
  }, [user]);

  const handleStatusChange = async (orderId, newStatus) => {
    const snapshot = orders;
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    setUpdatingId(orderId);
    try {
      await base44.entities.Order.update(orderId, { status: newStatus });
      await notifyOrderStatusChanged(orderId, newStatus);
    } catch (e) {
      setOrders(snapshot);
      alert('Failed to update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (!user || loading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#2E7D32] mx-auto" />
      </div>);

  }

  if (user.role !== 'admin') {
    return (
      <div className="p-8 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <Lock className="w-12 h-12 text-gray-300 mb-3" />
        <h2 className="text-lg font-bold text-foreground mb-1">Admins Only</h2>
        <p className="text-sm text-muted-foreground mb-4">
          You need an admin account to manage orders.
        </p>
        <Link to="/" className="text-[#2E7D32] font-bold text-sm">
          Back to Home
        </Link>
      </div>);

  }

  const visibleOrders = customerFilter
    ? orders.filter((o) => o.customer_email === customerFilter)
    : orders;

  const filteredOrders = visibleOrders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (dateFilter) {
      const d = o.created_date ? new Date(o.created_date).toISOString().slice(0, 10) : '';
      if (d !== dateFilter) return false;
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hay = `${o.customer_name || ''} ${o.customer_email || ''} ${o.order_number || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const hasFilters = search.trim() || statusFilter !== 'all' || dateFilter;
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setDateFilter('');
  };

  return (
    <div className="p-4 pb-10">
      {customerFilter && (
        <div className="flex items-center justify-between bg-primary/10 rounded-2xl px-4 py-3 mb-4">
          <div>
            <p className="text-sm font-bold text-[#2E7D32]">{customerFilter}</p>
            <p className="text-xs text-gray-600">
              {visibleOrders.length} order{visibleOrders.length !== 1 ? 's' : ''} · ₦
              {visibleOrders.reduce((s, o) => s + (o.total || 0), 0).toLocaleString()} spent
            </p>
          </div>
          <button
            onClick={() => setCustomerFilter(null)}
            className="text-xs font-semibold text-[#2E7D32] underline"
          >
            Clear
          </button>
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Link to="/profile" className="p-1.5 -ml-1.5 rounded-full hover:bg-black/5">
            
          </Link>
          <h1 className="text-xl font-bold text-foreground">Manage Orders</h1>
        </div>
        <button
          onClick={loadOrders}
          className="w-11 h-11 rounded-full hover:bg-muted flex items-center justify-center"
          title="Refresh">
          
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Tap an order to expand it and update its status. The customer is emailed
        automatically when the status changes.
      </p>

      {/* Search & filters */}
      <div className="bg-card rounded-2xl border border-border p-3 mb-3 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or order no."
            className="w-full pl-9 pr-3 h-10 text-sm rounded-xl border border-gray-200 outline-none focus:border-[#2E7D32]"
          />
        </div>
        <div className="flex gap-2">
          <SheetSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: 'all', label: 'All statuses' }, ...STATUSES]}
            placeholder="All statuses"
            title="Filter by status"
            triggerClassName="flex-1 h-10 flex items-center justify-between text-sm rounded-xl border border-gray-200 px-3 bg-card"
          />
          <div className="relative flex-1">
            <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-9 pr-2 h-10 text-sm rounded-xl border border-gray-200 outline-none focus:border-[#2E7D32]"
            />
          </div>
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs font-semibold text-[#2E7D32] flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear filters
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400 mb-3 px-1">
        {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
      </p>

      {filteredOrders.length === 0 ?
      <div className="text-center py-16">
          <p className="text-sm text-gray-400">No orders match your filters.</p>
        </div> :

      <div className="space-y-3">
          {filteredOrders.map((order) =>
        <OrderCard
          key={order.id}
          order={order}
          onStatusChange={handleStatusChange}
          updatingId={updatingId}
          highlighted={highlightOrder === order.order_number}
          onViewCustomer={setCustomerFilter}
          onAssignRider={setAssignOrder} />

        )}
        </div>
      }

      <AssignRiderSheet
        order={assignOrder}
        open={!!assignOrder}
        onClose={() => setAssignOrder(null)}
        onAssigned={loadOrders}
      />
    </div>);

}

// Close bracket for OrderCard — the AssignRiderSheet is rendered by the parent.