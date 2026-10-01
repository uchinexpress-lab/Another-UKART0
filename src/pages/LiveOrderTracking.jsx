import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  ArrowLeft, MapPin, Phone, Package, Bike, Loader2, CheckCircle2,
  Star, Zap, Navigation, ShieldCheck, RefreshCw, Mail, MessageSquare,
} from 'lucide-react';
import LiveMap from '@/components/delivery/LiveMap';
import ETACountdown from '@/components/delivery/ETACountdown';
import DeliveryAuditTimeline from '@/components/delivery/DeliveryAuditTimeline';
import { CUSTOMER_STATUS_MAP } from '@/lib/deliveryStatus';

export default function LiveOrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdateAgo, setLastUpdateAgo] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  const loadDelivery = useCallback(async () => {
    try {
      const d = await base44.entities.Delivery.get(id);
      setDelivery(d);
      if (d.last_location_at) {
        const diff = Math.floor((Date.now() - new Date(d.last_location_at).getTime()) / 60000);
        if (diff < 1) setLastUpdateAgo('just now');
        else if (diff < 60) setLastUpdateAgo(`${diff} min ago`);
        else setLastUpdateAgo(`${Math.floor(diff / 60)} hr ago`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDelivery();
    const unsub = base44.entities.Delivery.subscribe(() => loadDelivery());
    // Poll every 15s as backup for real-time
    const poll = setInterval(loadDelivery, 15000);
    return () => {
      unsub();
      clearInterval(poll);
    };
  }, [loadDelivery]);

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
        <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Delivery tracking not available.</p>
        <Link to="/orders" className="mt-4 inline-block text-sm font-semibold text-[#2E7D32]">
          Back to Orders
        </Link>
      </div>
    );
  }

  const isActive = ['on_the_way', 'arriving_soon', 'picked_up'].includes(delivery.status);
  const isArrived = delivery.status === 'arrived';
  const isDelivered = delivery.status === 'delivered';
  const isTest = delivery.is_test_mode;
  const customerLabel = CUSTOMER_STATUS_MAP[delivery.status] || 'Processing';

  const handleResendOtp = async () => {
    setResending(true);
    setResendMsg('');
    try {
      const res = await base44.functions.invoke('resendDeliveryOtp', {
        deliveryId: delivery.id,
        requestedBy: 'customer',
      });
      if (res.ok) {
        setResendMsg('A new verification code has been sent to your phone/email.');
        loadDelivery();
      }
    } catch (e) {
      const msg = e.message || 'Failed to resend';
      if (msg.includes('wait') || msg.includes('rate')) {
        setResendMsg(msg);
      } else {
        setResendMsg('Failed to resend code. Please try again.');
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="px-4 py-4 pb-10 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Track Your Order</h1>
      </div>

      {/* Test mode banner */}
      {isTest && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-semibold text-amber-700">TEST MODE — Simulated tracking for demonstration</span>
        </div>
      )}

      {/* Status card */}
      <div className="bg-[#2E7D32] rounded-2xl p-4 text-white">
        <div className="flex items-center gap-2 mb-1">
          {isArrived ? <ShieldCheck className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
          <span className="text-sm font-bold">
            {isDelivered ? 'Order Delivered' : isArrived ? 'Your rider has arrived!' : customerLabel}
          </span>
        </div>
        <p className="text-xs text-green-100/70">
          {isDelivered
            ? 'Your order has been delivered. Enjoy!'
            : isArrived
            ? 'Please provide the delivery verification code to your rider.'
            : isActive
            ? `${delivery.rider_name || 'Your rider'} is delivering your order`
            : 'We are getting your order ready'}
        </p>
      </div>

      {/* Arrived — OTP info for customer */}
      {isArrived && (
        <div className="bg-blue-50 rounded-2xl border border-blue-200 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-blue-800">Delivery Verification Code Sent</p>
              <p className="text-xs text-blue-600 mt-0.5">
                A verification code has been sent to your phone/email. Give it to your rider to confirm delivery.
              </p>
            </div>
          </div>
          {/* Send status indicators */}
          {delivery.otp_send_status && (
            <div className="flex items-center gap-3 text-xs">
              {['email_sent', 'both_sent'].includes(delivery.otp_send_status) && (
                <span className="flex items-center gap-1 text-green-700"><Mail className="w-3.5 h-3.5" /> Code sent via email</span>
              )}
              {['sms_sent', 'both_sent'].includes(delivery.otp_send_status) && (
                <span className="flex items-center gap-1 text-green-700"><MessageSquare className="w-3.5 h-3.5" /> Code sent via SMS</span>
              )}
              {delivery.otp_send_status === 'failed' && (
                <span className="flex items-center gap-1 text-red-600"><Mail className="w-3.5 h-3.5" /> Failed to send — tap resend</span>
              )}
            </div>
          )}
          {/* Resend button */}
          {resendMsg && <p className="text-xs text-gray-600">{resendMsg}</p>}
          <button
            onClick={handleResendOtp}
            disabled={resending}
            className="w-full h-10 rounded-xl bg-white border border-blue-300 text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Resend Code
          </button>
        </div>
      )}

      {/* Live map */}
      <div>
        <LiveMap
          riderLat={delivery.latest_lat}
          riderLng={delivery.latest_lng}
          destLat={delivery.delivery_lat}
          destLng={delivery.delivery_lng}
          className="h-72 w-full"
        />
        {delivery.last_location_at && isActive && (
          <p className="text-[10px] text-gray-400 mt-1.5 text-center">
            Last location update: {lastUpdateAgo}
          </p>
        )}
      </div>

      {/* ETA countdown */}
      {isActive && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <ETACountdown
            estimatedDeliveryAt={delivery.estimated_delivery_at}
            estimatedMinutes={delivery.estimated_minutes}
            status={delivery.status}
            lastEtaUpdate={delivery.last_eta_update}
          />
        </div>
      )}

      {/* Rider info */}
      {delivery.rider_name && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Your Rider</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
              {delivery.rider_photo ? (
                <img src={delivery.rider_photo} alt={delivery.rider_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Bike className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">{delivery.rider_name}</p>
              <p className="text-xs text-gray-500">Your Ukart rider</p>
            </div>
            {delivery.rider_phone && isActive && (
              <a
                href={`tel:${delivery.rider_phone}`}
                className="w-11 h-11 rounded-full bg-[#2E7D32] flex items-center justify-center active:scale-95 transition-transform"
              >
                <Phone className="w-5 h-5 text-white" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Order info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2.5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase">Order Details</h3>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Order Number</span>
          <span className="font-bold text-gray-900">#{delivery.order_number}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Total</span>
          <span className="font-bold text-[#2E7D32]">₦{(delivery.order_total || 0).toLocaleString()}</span>
        </div>
        <div className="flex items-start gap-2 pt-2 border-t border-gray-100">
          <MapPin className="w-4 h-4 text-[#2E7D32] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">Delivery Address</p>
            <p className="text-sm text-gray-700">{delivery.customer_address}</p>
          </div>
        </div>
      </div>

      {/* Delivered state */}
      {isDelivered && (
        <div className="bg-green-50 rounded-2xl border border-green-200 p-4 text-center">
          <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-green-700">Your order has been delivered!</p>
          <p className="text-xs text-green-600 mt-1">Thank you for shopping with Ukart.</p>
          <Link
            to="/orders"
            className="mt-3 inline-block text-sm font-semibold text-green-700 underline"
          >
            Rate your delivery
          </Link>
        </div>
      )}

      {/* Activity timeline */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Delivery Activity</h3>
        <DeliveryAuditTimeline deliveryId={delivery.id} customerView />
      </div>
    </div>
  );
}