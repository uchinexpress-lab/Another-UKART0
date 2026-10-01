import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  ArrowLeft, MapPin, Phone, Navigation, Clock, CheckCircle2, Loader2,
  Package, User, AlertCircle, Bike, Zap,
} from 'lucide-react';

const STATUS_FLOW = {
  assigned: { label: 'New Assignment', color: 'bg-blue-50 text-blue-700', next: 'accept', nextLabel: 'Accept Delivery' },
  accepted: { label: 'Accepted', color: 'bg-indigo-50 text-indigo-700', next: 'start', nextLabel: 'Start Delivery' },
  on_the_way: { label: 'On the Way', color: 'bg-green-50 text-green-700', next: 'arriving_soon', nextLabel: 'Mark Arriving Soon' },
  arriving_soon: { label: 'Arriving Soon', color: 'bg-orange-50 text-orange-700', next: 'complete', nextLabel: 'Complete Delivery' },
  delivered: { label: 'Delivered', color: 'bg-gray-100 text-gray-600', next: null, nextLabel: null },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-600', next: null, nextLabel: null },
};

export default function RiderActiveDelivery() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [locationStatus, setLocationStatus] = useState('idle');
  const watchIdRef = useRef(null);

  const loadDelivery = useCallback(async () => {
    try {
      const d = await base44.entities.Delivery.get(id);
      setDelivery(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDelivery();
    const unsub = base44.entities.Delivery.subscribe(() => loadDelivery());
    return () => {
      unsub();
      stopTracking();
    };
  }, [loadDelivery]);

  // Start GPS tracking when delivery is on_the_way
  useEffect(() => {
    if (delivery?.status === 'on_the_way' || delivery?.status === 'arriving_soon') {
      startTracking();
    } else {
      stopTracking();
    }
  }, [delivery?.status]);

  const startTracking = () => {
    if (watchIdRef.current !== null) return;
    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      return;
    }
    setLocationStatus('requesting');
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        setLocationStatus('tracking');
        try {
          await base44.functions.invoke('updateRiderLocation', {
            deliveryId: id,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        } catch (e) {
          console.error('Location update failed:', e);
        }
      },
      (err) => {
        setLocationStatus('denied');
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const handleAction = async (action) => {
    setActionLoading(true);
    try {
      await base44.functions.invoke('manageDelivery', { action, deliveryId: id });
      await loadDelivery();
    } catch (e) {
      alert('Action failed: ' + (e.message || 'Please try again'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    setShowCompleteConfirm(false);
    await handleAction('complete');
    stopTracking();
  };

  const openNavigation = () => {
    if (!delivery) return;
    const lat = delivery.delivery_lat || 6.43;
    const lng = delivery.delivery_lng || 3.42;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const callCustomer = () => {
    if (delivery?.customer_phone) {
      window.location.href = `tel:${delivery.customer_phone}`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#2E7D32]" />
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="px-4 py-10 text-center">
        <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Delivery not found.</p>
        <button onClick={() => navigate('/rider/home')} className="mt-4 text-sm font-semibold text-[#2E7D32]">
          Back to Home
        </button>
      </div>
    );
  }

  const statusInfo = STATUS_FLOW[delivery.status] || STATUS_FLOW.assigned;
  const isActive = ['on_the_way', 'arriving_soon', 'picked_up'].includes(delivery.status);

  return (
    <div className="px-4 py-4 pb-8 space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/rider/home')} className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Active Delivery</h1>
      </div>

      {/* Order card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-gray-900">#{delivery.order_number}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {delivery.order_items?.length || 0} items · ₦{(delivery.order_total || 0).toLocaleString()}
            </p>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Order items summary */}
        {delivery.order_items?.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-2.5 space-y-1 mb-3">
            {delivery.order_items.slice(0, 5).map((item, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-gray-700">{item.quantity}× {item.name}</span>
                <span className="text-gray-500">₦{((item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
              </div>
            ))}
            {delivery.order_items.length > 5 && (
              <p className="text-xs text-gray-400 text-center pt-1">
                +{delivery.order_items.length - 5} more items
              </p>
            )}
          </div>
        )}
      </div>

      {/* Customer info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase">Customer</h3>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">{delivery.customer_name}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Phone className="w-3 h-3" /> {delivery.customer_phone}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 pt-2 border-t border-gray-100">
          <MapPin className="w-4 h-4 text-[#2E7D32] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700">{delivery.customer_address}</p>
        </div>
        <div className="flex items-start gap-2">
          <Package className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Pickup</p>
            <p className="text-sm text-gray-700">{delivery.pickup_address || 'Ukart Hub, Lagos'}</p>
          </div>
        </div>
      </div>

      {/* ETA */}
      {isActive && delivery.estimated_minutes > 0 && (
        <div className="bg-[#2E7D32] rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-100/70 uppercase">Estimated Time</p>
              <p className="text-2xl font-bold mt-1">{delivery.estimated_minutes} min</p>
            </div>
            <Clock className="w-10 h-10 text-green-200/50" />
          </div>
        </div>
      )}

      {/* Location tracking status */}
      {isActive && (
        <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-2">
          {locationStatus === 'tracking' ? (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-gray-600">Location sharing active</span>
            </>
          ) : locationStatus === 'requesting' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
              <span className="text-xs text-gray-500">Requesting location...</span>
            </>
          ) : locationStatus === 'denied' ? (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs text-amber-600">Location permission denied</span>
            </>
          ) : (
            <>
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-500">Location: {locationStatus}</span>
            </>
          )}
        </div>
      )}

      {/* Test mode banner */}
      {delivery.is_test_mode && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-semibold text-amber-700">TEST MODE — Simulated tracking</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-2.5">
        {/* Primary action */}
        {statusInfo.next && (
          <button
            onClick={() => {
              if (statusInfo.next === 'complete') {
                setShowCompleteConfirm(true);
              } else {
                handleAction(statusInfo.next);
              }
            }}
            disabled={actionLoading}
            className="w-full h-14 rounded-2xl bg-[#2E7D32] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {statusInfo.nextLabel}
          </button>
        )}

        {/* Navigation + Call (when active) */}
        {isActive && (
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={openNavigation}
              className="h-12 rounded-2xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Navigation className="w-4 h-4" /> Navigate
            </button>
            <button
              onClick={callCustomer}
              className="h-12 rounded-2xl bg-white border-2 border-[#2E7D32] text-[#2E7D32] font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Phone className="w-4 h-4" /> Call
            </button>
          </div>
        )}

        {/* Cancel (only for non-delivered/cancelled) */}
        {!['delivered', 'cancelled'].includes(delivery.status) && (
          <button
            onClick={() => {
              if (confirm('Cancel this delivery?')) handleAction('cancel');
            }}
            className="w-full h-11 rounded-2xl bg-red-50 text-red-600 font-semibold text-sm active:scale-[0.98] transition-transform"
          >
            Cancel Delivery
          </button>
        )}
      </div>

      {/* Complete confirmation */}
      {showCompleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6" onClick={() => setShowCompleteConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-1">Complete Delivery?</h3>
            <p className="text-sm text-gray-500 text-center mb-5">
              Confirm that you have delivered the order to the customer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCompleteConfirm(false)}
                className="flex-1 h-12 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm"
              >
                Not Yet
              </button>
              <button
                onClick={handleComplete}
                disabled={actionLoading}
                className="flex-1 h-12 rounded-xl bg-[#2E7D32] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}