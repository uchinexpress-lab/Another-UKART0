import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { RefreshCw, Loader2, Truck, MapPin, Clock } from 'lucide-react';

const STATUS_LABELS = {
  pending: 'Pending',
  assigned: 'Assigned',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for Pickup',
  picked_up: 'Picked Up',
  on_the_way: 'On the Way',
  arriving_soon: 'Arriving Soon',
  arrived: 'Arrived',
  otp_verified: 'OTP Verified',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-600',
  assigned: 'bg-blue-100 text-blue-700',
  accepted: 'bg-indigo-100 text-indigo-700',
  preparing: 'bg-amber-100 text-amber-700',
  ready_for_pickup: 'bg-cyan-100 text-cyan-700',
  picked_up: 'bg-purple-100 text-purple-700',
  on_the_way: 'bg-purple-100 text-purple-700',
  arriving_soon: 'bg-orange-100 text-orange-700',
  arrived: 'bg-teal-100 text-teal-700',
  otp_verified: 'bg-green-100 text-green-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const ACTIVE_STATUSES = [
  'assigned', 'accepted', 'preparing', 'ready_for_pickup',
  'picked_up', 'on_the_way', 'arriving_soon', 'arrived',
];

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function StaffLiveDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeliveries();
    const interval = setInterval(loadDeliveries, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadDeliveries = async () => {
    try {
      const res = await base44.entities.Delivery.filter(
        { status: { $in: ACTIVE_STATUSES } },
        { sort: '-created_date', limit: 50 }
      );
      setDeliveries(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Deliveries</h1>
          <p className="text-sm text-gray-500">{deliveries.length} active deliveries</p>
        </div>
        <button onClick={loadDeliveries} className="p-2 rounded-lg hover:bg-gray-100">
          <RefreshCw className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : deliveries.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">No active deliveries</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Order #</th>
                  <th className="text-left px-4 py-3 font-semibold">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold">Rider</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">ETA</th>
                  <th className="text-left px-4 py-3 font-semibold">Last Location</th>
                  <th className="px-4 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{d.order_number}</td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">{d.customer_name}</p>
                      <p className="text-xs text-gray-500">{d.customer_phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      {d.rider_name ? (
                        <div>
                          <p className="text-gray-900">{d.rider_name}</p>
                          <p className="text-xs text-gray-500">{d.rider_phone}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          STATUS_COLORS[d.status] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {STATUS_LABELS[d.status] || d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {d.estimated_minutes != null ? `${d.estimated_minutes} min` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {d.last_location_at ? timeAgo(d.last_location_at) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/track-order/${d.id}`}
                        className="text-xs font-bold text-[#2E7D32] hover:underline flex items-center gap-1"
                      >
                        <Truck className="w-3.5 h-3.5" /> Track
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}