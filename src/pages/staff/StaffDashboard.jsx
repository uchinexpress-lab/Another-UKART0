import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  ShoppingCart, Clock, CheckCircle2, Bike, Truck, AlertTriangle,
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, color, link }) {
  const content = (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
  return link ? <Link to={link}>{content}</Link> : content;
}

export default function StaffDashboard() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString();

        const [
          todayOrders, pendingOrders, paidOrders, awaitingRider,
          activeDeliveries, onlineRiders, availableRiders, lowStock,
          ordersRes, ticketsRes,
        ] = await Promise.all([
          base44.entities.Order.count({ created_date: { $gte: todayStr } }),
          base44.entities.Order.count({ status: 'new' }),
          base44.entities.Order.count({ payment_status: 'Paid' }),
          base44.entities.Order.count({ status: 'ready', payment_status: 'Paid' }),
          base44.entities.Delivery.count({ status: { $in: ['assigned', 'accepted', 'preparing', 'ready_for_pickup', 'picked_up', 'on_the_way', 'arriving_soon', 'arrived'] } }),
          base44.entities.Rider.count({ is_online: true }),
          base44.entities.Rider.count({ is_available: true, is_online: true, approval_status: 'approved' }),
          base44.entities.Product.count({ stock_status: 'low_stock' }),
          base44.entities.Order.filter({}, { sort: '-created_date', limit: 5 }),
          base44.entities.Ticket.filter({ status: { $in: ['new', 'open', 'in_progress'] } }, { sort: '-created_date', limit: 5 }),
        ]);

        setStats({
          todayOrders, pendingOrders, paidOrders, awaitingRider,
          activeDeliveries, onlineRiders, availableRiders, lowStock,
        });
        setRecentOrders(ordersRes.items || []);
        setRecentTickets(ticketsRes.items || []);
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
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#2E7D32] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Ukart operations overview — live data</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={ShoppingCart} label="Today's Orders" value={stats.todayOrders ?? 0} color="bg-blue-100 text-blue-700" link="/staff/orders" />
        <StatCard icon={Clock} label="Pending Orders" value={stats.pendingOrders ?? 0} color="bg-amber-100 text-amber-700" link="/staff/orders" />
        <StatCard icon={CheckCircle2} label="Paid Orders" value={stats.paidOrders ?? 0} color="bg-green-100 text-green-700" link="/staff/orders" />
        <StatCard icon={Bike} label="Awaiting Rider" value={stats.awaitingRider ?? 0} color="bg-purple-100 text-purple-700" link="/staff/orders" />
        <StatCard icon={Truck} label="Active Deliveries" value={stats.activeDeliveries ?? 0} color="bg-indigo-100 text-indigo-700" link="/staff/live-deliveries" />
        <StatCard icon={Bike} label="Online Riders" value={stats.onlineRiders ?? 0} color="bg-teal-100 text-teal-700" link="/staff/riders" />
        <StatCard icon={Bike} label="Available Riders" value={stats.availableRiders ?? 0} color="bg-cyan-100 text-cyan-700" link="/staff/riders" />
        <StatCard icon={AlertTriangle} label="Low Stock Products" value={stats.lowStock ?? 0} color="bg-red-100 text-red-700" link="/staff/products" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Recent Orders</h3>
            <Link to="/staff/orders" className="text-xs font-semibold text-[#2E7D32]">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-gray-400">No recent orders</p>
            ) : (
              recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{o.order_number}</p>
                    <p className="text-xs text-gray-500">
                      {o.customer_name} · ₦{(o.total || 0).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      o.payment_status === 'Paid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {o.payment_status || 'Pending'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Open Tickets</h3>
            <Link to="/staff/tickets" className="text-xs font-semibold text-[#2E7D32]">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentTickets.length === 0 ? (
              <p className="text-sm text-gray-400">No open tickets</p>
            ) : (
              recentTickets.map((t) => (
                <Link
                  key={t.id}
                  to={`/staff/tickets/${t.id}`}
                  className="flex items-center justify-between text-sm hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded"
                >
                  <div>
                    <p className="font-medium text-gray-900">{t.subject}</p>
                    <p className="text-xs text-gray-500">{t.user_name || t.user_email}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      t.priority === 'urgent'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {t.priority || 'medium'}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}