import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Loader2, Bike, MapPin, Clock, Package, Phone, Zap, Truck,
  ShieldCheck, ShieldAlert, Lock, ChevronDown, ChevronUp,
} from 'lucide-react';
import LiveMap from '@/components/delivery/LiveMap';
import DeliveryAuditTimeline from '@/components/delivery/DeliveryAuditTimeline';
import AdminOverrideSheet from '@/components/admin/AdminOverrideSheet';

const ACTIVE_STATUSES = ['assigned', 'accepted', 'preparing', 'ready_for_pickup', 'picked_up', 'on_the_way', 'arriving_soon', 'arrived'];

const STATUS_LABELS = {
  assigned: 'Assigned',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready',
  picked_up: 'Picked Up',
  on_the_way: 'On the Way',
  arriving_soon: 'Arriving Soon',
  arrived: 'Arrived',
  otp_verified: 'OTP Verified',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  pending: 'Pending',
};

const STATUS_COLORS = {
  assigned: 'bg-blue-50 text-blue-700',
  accepted: 'bg-indigo-50 text-indigo-700',
  preparing: 'bg-amber-50 text-amber-700',
  ready_for_pickup: 'bg-cyan-50 text-cyan-700',
  picked_up: 'bg-purple-50 text-purple-700',
  on_the_way: 'bg-green-50 text-green-700',
  arriving_soon: 'bg-orange-50 text-orange-700',
  arrived: 'bg-teal-50 text-teal-700',
  otp_verified: 'bg-green-100 text-green-700',
  delivered: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-50 text-red-600',
  pending: 'bg-gray-100 text-gray-500',
};

function timeAgo(d) {
  if (!d) return '—';
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function AdminLiveDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showTimeline, setShowTimeline] = useState(null);
  const [overrideDelivery, setOverrideDelivery] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const dels = await base44.entities.Delivery.filter(
        { status: { $in: ACTIVE_STATUSES } },
        { sort: '-created_date', limit: 100 }
      );
      setDeliveries(dels.items || []);
      const rids = await base44.entities.Rider.list('-created_date', 200);
      setRiders(rids);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubD = base44.entities.Delivery.subscribe(() => loadData());
    const unsubR = base44.entities.Rider.subscribe(() => loadData());
    const poll = setInterval(loadData, 15000);
    return () => {
      unsubD();
      unsubR();
      clearInterval(poll);
    };
  }, [loadData]);

  // Ready-for-delivery orders (no rider assigned yet)
  const [unassignedOrders, setUnassignedOrders] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const orders = await base44.entities.Order.filter(
          { status: { $in: ['ready', 'processing'] } },
          { sort: '-created_date', limit: 50 }
        );
        const existingDeliveries = await base44.entities.Delivery.filter(
          { status: { $in: ACTIVE_STATUSES } },
          { limit: 100 }
        );
        const assignedOrderIds = new Set((existingDeliveries.items || []).map((d) => d.order_id));
        setUnassignedOrders((orders.items || []).filter((o) => !assignedOrderIds.has(o.id)));
      } catch (e) {
        console.error(e);
      }
    })();
  }, [deliveries]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#2E7D32]" /></div>;
  }

  const activeRiderPositions = deliveries
    .filter((d) => d.latest_lat && d.latest_lng)
    .map((d) => ({ lat: d.latest_lat, lng: d.latest_lng, name: d.rider_name, order: d.order_number }));

  return (
    <div className="px-4 py-4 pb-10 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Live Deliveries</h1>

      {/* Live map */}
      {activeRiderPositions.length > 0 ? (
        <LiveMap
          riderLat={activeRiderPositions[0].lat}
          riderLng={activeRiderPositions[0].lng}
          destLat={null}
          destLng={null}
          className="h-56 w-full"
        />
      ) : (
        <div className="bg-gray-100 rounded-2xl h-56 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-1" />
            <p className="text-sm text-gray-400">No active rider locations</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-xl border border-gray-200 p-2.5 text-center">
          <p className="text-lg font-bold text-green-600">{deliveries.length}</p>
          <p className="text-[10px] text-gray-500">Active</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-2.5 text-center">
          <p className="text-lg font-bold text-blue-600">{unassignedOrders.length}</p>
          <p className="text-[10px] text-gray-500">Unassigned</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-2.5 text-center">
          <p className="text-lg font-bold text-purple-600">{riders.filter((r) => r.is_online && r.is_available).length}</p>
          <p className="text-[10px] text-gray-500">Available Riders</p>
        </div>
      </div>

      {/* Ready for dispatch */}
      {unassignedOrders.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-blue-600" /> Ready for Delivery
          </h2>
          <div className="space-y-2">
            {unassignedOrders.map((o) => (
              <div key={o.id} className="bg-white rounded-xl border-2 border-blue-200 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold text-gray-900">#{o.order_number}</span>
                  <span className="text-xs text-gray-500">₦{(o.total || 0).toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                  <MapPin className="w-3 h-3" /> {o.customer_address}
                </p>
                <a
                  href={`/admin/orders`}
                  className="text-xs font-bold text-[#2E7D32] flex items-center gap-1"
                >
                  Assign rider in Orders →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active deliveries */}
      <div>
        <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
          <Truck className="w-4 h-4 text-green-600" /> Active Deliveries
        </h2>
        {deliveries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
            <Bike className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No active deliveries right now.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {deliveries.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelected(selected?.id === d.id ? null : d)}
                className={`w-full bg-white rounded-xl border p-3 text-left transition-colors ${
                  selected?.id === d.id ? 'border-[#2E7D32] ring-1 ring-[#2E7D32]/20' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">#{d.order_number}</span>
                    {d.is_test_mode && <Zap className="w-3 h-3 text-amber-500" />}
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${STATUS_COLORS[d.status] || 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[d.status] || d.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Bike className="w-3 h-3" /> {d.rider_name}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ETA: {d.estimated_minutes || '—'}m</span>
                  <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3" /> {d.customer_name}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo(d.last_location_at)}</span>
                </div>

                {selected?.id === d.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-gray-500">Customer</span><span className="text-gray-700 font-medium">{d.customer_name} · {d.customer_phone}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Address</span><span className="text-gray-700 font-medium text-right">{d.customer_address}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Started</span><span className="text-gray-700 font-medium">{d.started_at ? new Date(d.started_at).toLocaleTimeString() : '—'}</span></div>
                    {d.arrived_at && (
                      <div className="flex justify-between"><span className="text-gray-500">Arrived</span><span className="text-gray-700 font-medium">{new Date(d.arrived_at).toLocaleTimeString()}</span></div>
                    )}
                    <div className="flex justify-between"><span className="text-gray-500">Last Update</span><span className="text-gray-700 font-medium">{timeAgo(d.last_location_at)}</span></div>

                    {/* OTP verification status */}
                    {d.status === 'arrived' && (
                      <div className="bg-teal-50 rounded-lg p-2.5 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                          <span className="font-bold text-teal-700">OTP Verification</span>
                        </div>
                        {d.otp_verified ? (
                          <p className="text-teal-600">✓ Verified at {new Date(d.otp_verified_at).toLocaleTimeString()}</p>
                        ) : d.otp_locked_until && new Date(d.otp_locked_until) > new Date() ? (
                          <p className="text-red-600 flex items-center gap-1"><Lock className="w-3 h-3" /> Locked — too many failed attempts</p>
                        ) : (
                          <div className="space-y-0.5">
                            <p className="text-teal-600">Awaiting verification code from customer</p>
                            <p className="text-gray-500">Attempts: {d.otp_attempts || 0}/{d.otp_max_attempts || 5}</p>
                            <p className="text-gray-500">Send: {d.otp_send_status || 'pending'}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Override record */}
                    {d.override_reason && (
                      <div className="bg-amber-50 rounded-lg p-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                          <span className="font-bold text-amber-700">Admin Override</span>
                        </div>
                        <p className="text-amber-700">Reason: {d.override_reason}</p>
                        {d.override_note && <p className="text-gray-600 mt-0.5">Note: {d.override_note}</p>}
                        <p className="text-gray-400 mt-0.5">By {d.override_admin_name} · {d.override_at ? new Date(d.override_at).toLocaleTimeString() : ''}</p>
                      </div>
                    )}

                    {d.latest_lat && d.latest_lng && (
                      <a
                        href={`https://www.google.com/maps?q=${d.latest_lat},${d.latest_lng}`}
                        target="_blank"
                        className="block text-center text-[#2E7D32] font-semibold pt-1"
                      >
                        View on Google Maps →
                      </a>
                    )}

                    {/* Admin override button */}
                    {!['delivered', 'cancelled'].includes(d.status) && (
                      <button
                        onClick={() => setOverrideDelivery(d)}
                        className="w-full h-9 rounded-lg bg-amber-50 border border-amber-300 text-amber-700 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" /> Admin Override Delivery
                      </button>
                    )}

                    {/* Audit timeline toggle */}
                    <button
                      onClick={() => setShowTimeline(showTimeline === d.id ? null : d.id)}
                      className="w-full flex items-center justify-center gap-1 text-gray-500 font-semibold pt-1"
                    >
                      {showTimeline === d.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {showTimeline === d.id ? 'Hide' : 'Show'} Activity Timeline
                    </button>
                    {showTimeline === d.id && (
                      <div className="bg-gray-50 rounded-lg p-3 mt-1">
                        <DeliveryAuditTimeline deliveryId={d.id} />
                      </div>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <AdminOverrideSheet
        delivery={overrideDelivery}
        open={!!overrideDelivery}
        onClose={() => setOverrideDelivery(null)}
        onOverridden={loadData}
      />
    </div>
  );
}