
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { logStaffAction } from '@/lib/staffAudit';
import { canAccessPage } from '@/lib/staffRoles';
import { useAuth } from '@/lib/AuthContext';
import AssignRiderSheet from '@/components/admin/AssignRiderSheet';
import {
  notifyOrderStatusChanged,
  buildWhatsAppUrl,
  buildSmsUrl,
} from '@/lib/notifications';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Bike,
  RefreshCw,
  Loader2,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import SheetSelect from '@/components/SheetSelect';

const STATUSES = [
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
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [assignOrder, setAssignOrder] = useState(null);

  const canManage = canAccessPage(user, 'orders');

  const loadOrders = useCallback(async () => {
    setLoading(true);

    try {
      const res = await base44.entities.Order.filter(
        { payment_status: 'Paid' },
        { sort: '-created_date', limit: 100 }
      );

      const paidOrders = (res?.items || []).filter(
        (order) => order.payment_status === 'Paid'
      );

      setOrders(paidOrders);
    } catch (error) {
      console.error('Failed to load paid orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId, orderNumber, newStatus) => {
    const order = orders.find((item) => item.id === orderId);

    if (!order || order.payment_status !== 'Paid') {
      alert('Only confirmed, paid orders can be updated.');
      return;
    }

    setUpdatingId(orderId);

    try {
      await notifyOrderStatusChanged(orderId, newStatus);

      await logStaffAction('order_status_changed', {
        entity_type: 'Order',
        record_id: orderId,
        record_name: orderNumber,
        new_value: newStatus,
      });

      setOrders((previous) =>
        previous.map((item) =>
          item.id === orderId
            ? { ...item, status: newStatus }
            : item
        )
      );
    } catch (error) {
      const reason =
        error?.response?.data?.error ||
        error?.data?.error ||
        error?.message ||
        'Please try again.';

      alert(`Failed to update order status — ${reason}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = orders.filter((order) => {
    if (statusFilter !== 'all' && order.status !== statusFilter) {
      return false;
    }

    if (search.trim()) {
      const query = search.toLowerCase();

      const searchableText = [
        order.customer_name,
        order.customer_email,
        order.order_number,
        order.customer_phone,
        order.alternate_phone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (!searchableText.includes(query)) return false;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">
            {filtered.length} paid orders
          </p>
        </div>

        <button
          onClick={loadOrders}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          aria-label="Refresh orders"
        >
          <RefreshCw
            className={`w-4 h-4 text-gray-600 ${
              loading ? 'animate-spin' : ''
            }`}
          />
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by customer name, phone, email, or order #"
            className="w-full pl-9 pr-3 h-9 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]"
          />
        </div>

        <SheetSelect
          value={statusFilter}
          onChange={setStatusFilter}
          title="Order status"
          triggerClassName="h-9 flex items-center justify-between text-sm rounded-lg border border-gray-200 px-3 bg-white"
          options={[
            { value: 'all', label: 'All Statuses' },
            ...STATUSES,
          ]}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">
            No paid orders found
          </div>
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
                  <th className="px-4 py-3" />
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filtered.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {order.order_number}
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-gray-900">
                          {order.customer_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.customer_email}
                        </p>
                      </td>

                      <td className="px-4 py-3 font-medium">
                        ₦{(order.total || 0).toLocaleString()}
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          Paid
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-gray-700">
                          {STATUSES.find(
                            (status) => status.value === order.status
                          )?.label || order.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-500">
                        {order.created_date
                          ? new Date(order.created_date).toLocaleDateString('en-NG')
                          : '—'}
                      </td>

                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            setExpandedId(
                              expandedId === order.id ? null : order.id
                            )
                          }
                          className="p-1 rounded hover:bg-gray-100"
                          aria-label="Toggle order details"
                        >
                          {expandedId === order.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {expandedId === order.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5 text-xs">
                              <p className="font-semibold text-gray-700 mb-1">
                                Customer Info
                              </p>

                              <p className="flex items-center gap-1.5 text-gray-600">
                                <Mail className="w-3 h-3" />
                                {order.customer_email}
                              </p>

                              <p className="flex items-center gap-1.5 text-gray-600">
                                <Phone className="w-3 h-3" />
                                {order.customer_phone}
                              </p>

                              {order.customer_phone && (
                                <div className="flex items-center gap-2 pt-1">
                                  <a
                                    href={buildWhatsAppUrl(order)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1 rounded bg-[#25D366] text-white text-[11px] font-bold hover:opacity-90"
                                  >
                                    WhatsApp Update
                                  </a>

                                  <a
                                    href={buildSmsUrl(order)}
                                    className="px-2.5 py-1 rounded bg-gray-800 text-white text-[11px] font-bold hover:opacity-90"
                                  >
                                    SMS Fallback
                                  </a>
                                </div>
                              )}

                              <p className="flex items-start gap-1.5 text-gray-600">
                                <MapPin className="w-3 h-3 mt-0.5" />
                                {order.customer_address}
                              </p>

                              {order.paystack_reference && (
                                <p className="text-gray-500 text-[11px] break-all">
                                  Ref: {order.paystack_reference}
                                </p>
                              )}

                              {order.payment_timestamp && (
                                <p className="text-gray-500 text-[11px]">
                                  Paid:{' '}
                                  {new Date(
                                    order.payment_timestamp
                                  ).toLocaleString('en-NG')}
                                  {order.payment_channel
                                    ? ` · ${order.payment_channel}`
                                    : ''}
                                </p>
                              )}
                            </div>

                            <div className="text-xs">
                              <p className="font-semibold text-gray-700 mb-1">
                                Items ({order.items?.length || 0})
                              </p>

                              <div className="space-y-0.5">
                                {order.items?.map((item, index) => (
                                  <p key={index} className="text-gray-600">
                                    {item.quantity}× {item.name} — ₦
                                    {(
                                      ((item.price || 0) +
                                        (item.addons_total || 0)) *
                                      (item.quantity || 1)
                                    ).toLocaleString()}
                                  </p>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              {canManage &&
                                !['delivered', 'cancelled'].includes(
                                  order.status
                                ) && (
                                  <button
                                    onClick={() => setAssignOrder(order)}
                                    className="w-full h-8 rounded-lg bg-[#1B4332] text-white text-xs font-bold flex items-center justify-center gap-1.5"
                                  >
                                    <Bike className="w-3.5 h-3.5" />
                                    Assign Rider
                                  </button>
                                )}

                              {canManage && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-700 mb-1.5">
                                    Update Status
                                  </p>

                                  <div className="flex flex-wrap gap-1">
                                    {STATUSES.map((status) => (
                                      <button
                                        key={status.value}
                                        onClick={() =>
                                          handleStatusChange(
                                            order.id,
                                            order.order_number,
                                            status.value
                                          )
                                        }
                                        disabled={
                                          updatingId === order.id ||
                                          order.status === status.value
                                        }
                                        className={`text-[10px] font-medium px-2 py-1 rounded border ${
                                          order.status === status.value
                                            ? 'bg-[#2E7D32] text-white border-[#2E7D32]'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-[#2E7D32]'
                                        } ${
                                          updatingId === order.id
                                            ? 'opacity-50'
                                            : ''
                                        }`}
                                      >
                                        {updatingId === order.id &&
                                        order.status !== status.value
                                          ? 'Updating…'
                                          : status.label}
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