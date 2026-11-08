import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { logStaffAction } from '@/lib/staffAudit';
import { canAccessPage } from '@/lib/staffRoles';
import { useAuth } from '@/lib/AuthContext';
import AssignRiderSheet from '@/components/admin/AssignRiderSheet';
import { notifyOrderStatusChanged } from '@/lib/notifications';
import {
  Search, ChevronDown, ChevronUp, Bike, RefreshCw, Loader2,
  Mail, Phone, MapPin,
} from 'lucide-react';
import SheetSelect from '@/components/SheetSelect';

const STATUSES = [
  { value: 'awaiting_payment', label: 'Awaiting Payment' },
  { value: 'new', label: 'Order Placed' },
  { value: 'processing', label: 'Being Prepared' },
  { value: 'ready', label: 'Ready for Delivery' },
  { value: 'on_the_way', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function StaffOrders() {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [assignOrder, setAssignOrder] = useState(null);

  const canManage = canAccessPage(user, 'orders');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.Order.filter({}, { sort: '-created_date', limit: 100 });
      // Fulfillment gate: verify payment via the Payment entity.
      const paidRes = await base44.entities.Payment.filter(
        { status: 'paid' },
        { limit: 200, fields: ['order_id'] }
      );
      const paidIds = new Set((paidRes.items || []).map((p) => p.order_id));
      setOrders((res.items || []).map((o) => ({ ...o, _paid: paidIds.has(o.id) })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, orderNumber, newStatus) => {
    setUpdatingId(orderId);
    try {
      await notifyOrderStatusChanged(orderId, newStatus);
      await logStaffAction('order_status_changed', {
        entity_type: 'Order', record_id: orderId, record_name: orderNumber,
        new_value: newStatus,
      });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    } catch (e) {
      const reason =
        e?.response?.data?.error || e?.data?.error || e?.message || 'Please try again.';
      alert(`Failed to update order status — ${reason}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (paymentFilter !== 'all' && o.payment_status !== paymentFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const hay = `${o.customer_name || ''} ${o.customer_email || ''} ${o.order_number || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">{filtered.length} orders</p>
        </div>
        <button onClick={loadOrders} className="p-2 rounded-lg hover:bg-gray-100">
          <RefreshCw className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or order #"
            className="w-full pl-9 pr-3 h-9 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]"
          />
        </div>
        <SheetSelect
          value={statusFilter}
          onChange={setStatusFilter}
          title="Order status"
          triggerClassName="h-9 flex items-center justify-between text-sm rounded-lg border border-gray-200 px-3 bg-white"
          options={[{ value: 'all', label: 'All Statuses' }, ...STATUSES]}
        />
        <SheetSelect
          value={paymentFilter}
          onChange={setPaymentFilter}
          title="Payment status"
          triggerClassName="h-9 flex items-center justify-between text-sm rounded-lg border border-gray-200 px-3 bg-white"
          options={[
            { value: 'all', label: 'All Payments' },
            { value: 'Paid', label: 'Paid' },
            { value: 'Pending', label: 'Awaiting Payment' },
            { value: 'Failed', label: 'Failed' },
            { value: 'Abandoned', label: 'Abandoned' },
          ]}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">No orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Order #</th>
                  <th className="text-left px-4 py-3 font-semibold">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold">Total</th>
                  <th className="text-left px-4 py-3 font-semibold">Payment</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((o) => (
                  <React.Fragment key={o.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{o.order_number}</td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900">{o.customer_name}</p>
                        <p className="text-xs text-gray-500">{o.customer_email}</p>
                      </td>
                      <td className="px-4 py-3 font-medium">₦{(o.total || 0).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            o.payment_status === 'Paid'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {o.payment_status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-gray-700">
                          {STATUSES.find((s) => s.value === o.status)?.label || o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(o.created_date).toLocaleDateString('en-NG')}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          {expandedId === o.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedId === o.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5 text-xs">
                              <p className="font-semibold text-gray-700 mb-1">Customer Info</p>
                              <p className="flex items-center gap-1.5 text-gray-600">
                                <Mail className="w-3 h-3" /> {o.customer_email}
                              </p>
                              <p className="flex items-center gap-1.5 text-gray-600">
                                <Phone className="w-3 h-3" /> {o.customer_phone}
                              </p>
                              <p className="flex items-start gap-1.5 text-gray-600">
                                <MapPin className="w-3 h-3 mt-0.5" /> {o.customer_address}
                              </p>
                              {o.paystack_reference && (
                                <p className="text-gray-500 text-[11px] break-all">
                                  Ref: {o.paystack_reference}
                                </p>
                              )}
                              {o.payment_timestamp && o.payment_status === 'Paid' && (
                                <p className="text-gray-500 text-[11px]">
                                  Paid: {new Date(o.payment_timestamp).toLocaleString('en-NG')}
                                  {o.payment_channel ? ` · ${o.payment_channel}` : ''}
                                </p>
                              )}
                            </div>
                            <div className="text-xs">
                              <p className="font-semibold text-gray-700 mb-1">
                                Items ({o.items?.length || 0})
                              </p>
                              <div className="space-y-0.5">
                                {o.items?.map((it, i) => (
                                  <p key={i} className="text-gray-600">
                                    {it.quantity}× {it.name} — ₦
                                    {((it.price || 0) * (it.quantity || 1)).toLocaleString()}
                                  </p>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              {canManage &&
                                !['delivered', 'cancelled'].includes(o.status) &&
                                o._paid && (
                                  <button
                                    onClick={() => setAssignOrder(o)}
                                    className="w-full h-8 rounded-lg bg-[#1B4332] text-white text-xs font-bold flex items-center justify-center gap-1.5"
                                  >
                                    <Bike className="w-3.5 h-3.5" /> Assign Rider
                                  </button>
                                )}
                              {canManage && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-700 mb-1.5">
                                    Update Status
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {STATUSES.filter((s) => s.value !== 'awaiting_payment').map((s) => (
                                      <button
                                        key={s.value}
                                        onClick={() => handleStatusChange(o.id, o.order_number, s.value)}
                                        disabled={updatingId === o.id || o.status === s.value}
                                        className={`text-[10px] font-medium px-2 py-1 rounded border ${
                                          o.status === s.value
                                            ? 'bg-[#2E7D32] text-white border-[#2E7D32]'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-[#2E7D32]'
                                        } ${updatingId === o.id ? 'opacity-50' : ''}`}
                                      >
                                        {s.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AssignRiderSheet
        order={assignOrder}
        open={!!assignOrder}
        onClose={() => setAssignOrder(null)}
        onAssigned={loadOrders}
      />
    </div>
  );
}