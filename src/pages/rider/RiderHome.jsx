import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Bike, Package, MapPin, Phone, Clock, CheckCircle2, Loader2,
  TrendingUp, Calendar, Power, ChevronRight,
} from 'lucide-react';

const STATUS_LABELS = {
  pending: 'Pending',
  assigned: 'New Assignment',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for Pickup',
  picked_up: 'Picked Up',
  on_the_way: 'On the Way',
  arriving_soon: 'Arriving Soon',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_COLORS = {
  assigned: 'bg-blue-50 text-blue-700',
  accepted: 'bg-indigo-50 text-indigo-700',
  preparing: 'bg-amber-50 text-amber-700',
  ready_for_pickup: 'bg-cyan-50 text-cyan-700',
  picked_up: 'bg-purple-50 text-purple-700',
  on_the_way: 'bg-green-50 text-green-700',
  arriving_soon: 'bg-orange-50 text-orange-700',
  delivered: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-50 text-red-600',
  pending: 'bg-gray-100 text-gray-500',
};

export default function RiderHome() {
  const navigate = useNavigate();
  const [rider, setRider] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const user = await base44.auth.me();
      const riders = await base44.entities.Rider.filter({ user_id: user.id }, { limit: 1 });
      if (!riders.items?.length) return;
      const r = riders.items[0];
      setRider(r);

      const dels = await base44.entities.Delivery.filter(
        { rider_id: r.id },
        { sort: '-created_date', limit: 50 }
      );
      setDeliveries(dels.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Subscribe to delivery updates
    const unsub = base44.entities.Delivery.subscribe(() => loadData());
    return unsub;
  }, [loadData]);

  const toggleOnline = async () => {
    if (!rider) return;
    setToggling(true);
    try {
      const updated = await base44.entities.Rider.update(rider.id, {
        is_online: !rider.is_online,
        is_available: !rider.is_online && rider.approval_status === 'approved',
      });
      setRider(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#2E7D32]" />
      </div>
    );
  }

  const activeStatuses = ['assigned', 'accepted', 'preparing', 'ready_for_pickup', 'picked_up', 'on_the_way', 'arriving_soon'];
  const activeDelivery = deliveries.find((d) => activeStatuses.includes(d.status));
  const newAssignments = deliveries.filter((d) => d.status === 'assigned');
  const completedToday = deliveries.filter((d) => {
    if (d.status !== 'delivered') return false;
    const today = new Date().toISOString().slice(0, 10);
    return d.delivered_at?.slice(0, 10) === today;
  });

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Online toggle */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-900">{rider?.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {rider?.is_online ? (rider?.is_available ? 'Available for deliveries' : 'On delivery') : 'You are offline'}
            </p>
          </div>
          <button
            onClick={toggleOnline}
            disabled={toggling}
            className={`relative w-14 h-8 rounded-full transition-colors ${rider?.is_online ? 'bg-[#2E7D32]' : 'bg-gray-300'}`}
          >
            <span
              className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${rider?.is_online ? 'left-7' : 'left-1'}`}
            />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <p className="text-xl font-bold text-[#2E7D32]">{completedToday.length}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Today</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <p className="text-xl font-bold text-gray-900">{rider?.completed_deliveries || 0}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Total</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <p className="text-xl font-bold text-amber-500">{rider?.rating?.toFixed(1) || '5.0'}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Rating</p>
        </div>
      </div>

      {/* Active delivery */}
      {activeDelivery && (
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
            <Bike className="w-4 h-4 text-[#2E7D32]" /> Active Delivery
          </h2>
          <button
            onClick={() => navigate(`/rider/delivery/${activeDelivery.id}`)}
            className="w-full bg-[#2E7D32] rounded-2xl p-4 text-left text-white active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold">#{activeDelivery.order_number}</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {STATUS_LABELS[activeDelivery.status]}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-green-100">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">{activeDelivery.customer_address}</span>
            </div>
            {activeDelivery.estimated_minutes > 0 && activeDelivery.status !== 'delivered' && (
              <div className="flex items-center gap-1.5 text-xs text-green-100 mt-1">
                <Clock className="w-3.5 h-3.5" />
                ETA: {activeDelivery.estimated_minutes} min
              </div>
            )}
          </button>
        </div>
      )}

      {/* New assignments */}
      {newAssignments.length > 0 && !activeDelivery && (
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-blue-600" /> New Delivery Assigned
          </h2>
          {newAssignments.map((d) => (
            <button
              key={d.id}
              onClick={() => navigate(`/rider/delivery/${d.id}`)}
              className="w-full bg-white rounded-2xl border-2 border-blue-300 p-4 text-left mb-2 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-900">#{d.order_number}</span>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                  {STATUS_LABELS[d.status]}
                </span>
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {d.customer_address}
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {d.customer_phone}
                </p>
              </div>
              <div className="mt-2 text-xs font-semibold text-[#2E7D32] flex items-center gap-1">
                Tap to accept <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Today's deliveries */}
      <div>
        <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-gray-600" /> Today's Deliveries
        </h2>
        {deliveries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
            <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No deliveries assigned yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {deliveries.slice(0, 10).map((d) => (
              <button
                key={d.id}
                onClick={() => navigate(`/rider/delivery/${d.id}`)}
                className="w-full bg-white rounded-xl border border-gray-200 p-3 text-left flex items-center justify-between active:scale-[0.98] transition-transform"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-900">#{d.order_number}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${STATUS_COLORS[d.status] || ''}`}>
                      {STATUS_LABELS[d.status]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{d.customer_address}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}