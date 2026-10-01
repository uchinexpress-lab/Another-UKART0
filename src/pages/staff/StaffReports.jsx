import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, ShoppingCart, CheckCircle2, XCircle, Truck, Ticket as TicketIcon, DollarSign } from 'lucide-react';

function ReportCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

export default function StaffReports() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [
          totalOrders, paidOrders, cancelledOrders, failedPayments,
          deliveredOrders, activeDeliveries, completedDeliveries,
          openTickets, resolvedTickets,
          salesAgg,
        ] = await Promise.all([
          base44.entities.Order.count({}),
          base44.entities.Order.count({ payment_status: 'Paid' }),
          base44.entities.Order.count({ status: 'cancelled' }),
          base44.entities.Order.count({ payment_status: 'Failed' }),
          base44.entities.Order.count({ status: 'delivered' }),
          base44.entities.Delivery.count({ status: { $in: ['assigned', 'accepted', 'preparing', 'ready_for_pickup', 'picked_up', 'on_the_way', 'arriving_soon', 'arrived'] } }),
          base44.entities.Delivery.count({ status: 'delivered' }),
          base44.entities.Ticket.count({ status: { $in: ['new', 'open', 'in_progress'] } }),
          base44.entities.Ticket.count({ status: 'resolved' }),
          base44.entities.Order.aggregate({ query: { payment_status: 'Paid' }, sum: 'total' }),
        ]);

        setStats({
          totalOrders, paidOrders, cancelledOrders, failedPayments,
          deliveredOrders, activeDeliveries, completedDeliveries,
          openTickets, resolvedTickets,
          totalSales: salesAgg.rows?.[0]?.sum_total || 0,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500">Operations performance overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ReportCard icon={ShoppingCart} label="Total Orders" value={stats.totalOrders ?? 0} color="bg-blue-100 text-blue-700" />
        <ReportCard icon={DollarSign} label="Total Sales (Paid)" value={`₦${(stats.totalSales || 0).toLocaleString()}`} color="bg-green-100 text-green-700" />
        <ReportCard icon={CheckCircle2} label="Paid Orders" value={stats.paidOrders ?? 0} color="bg-teal-100 text-teal-700" />
        <ReportCard icon={XCircle} label="Cancelled Orders" value={stats.cancelledOrders ?? 0} color="bg-red-100 text-red-700" />
        <ReportCard icon={XCircle} label="Failed Payments" value={stats.failedPayments ?? 0} color="bg-orange-100 text-orange-700" />
        <ReportCard icon={CheckCircle2} label="Delivered Orders" value={stats.deliveredOrders ?? 0} color="bg-green-100 text-green-700" />
        <ReportCard icon={Truck} label="Active Deliveries" value={stats.activeDeliveries ?? 0} color="bg-purple-100 text-purple-700" />
        <ReportCard icon={Truck} label="Completed Deliveries" value={stats.completedDeliveries ?? 0} color="bg-indigo-100 text-indigo-700" />
        <ReportCard icon={TicketIcon} label="Open Tickets" value={stats.openTickets ?? 0} color="bg-amber-100 text-amber-700" />
        <ReportCard icon={TicketIcon} label="Resolved Tickets" value={stats.resolvedTickets ?? 0} color="bg-cyan-100 text-cyan-700" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-bold text-gray-900 mb-4">Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Order Completion Rate</span>
            <span className="font-medium text-gray-900">
              {stats.totalOrders > 0
                ? `${Math.round((stats.deliveredOrders / stats.totalOrders) * 100)}%`
                : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Payment Success Rate</span>
            <span className="font-medium text-gray-900">
              {stats.totalOrders > 0
                ? `${Math.round((stats.paidOrders / stats.totalOrders) * 100)}%`
                : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Average Order Value (Paid)</span>
            <span className="font-medium text-gray-900">
              {stats.paidOrders > 0
                ? `₦${Math.round((stats.totalSales / stats.paidOrders)).toLocaleString()}`
                : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Ticket Resolution Rate</span>
            <span className="font-medium text-gray-900">
              {stats.openTickets + stats.resolvedTickets > 0
                ? `${Math.round((stats.resolvedTickets / (stats.openTickets + stats.resolvedTickets)) * 100)}%`
                : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}