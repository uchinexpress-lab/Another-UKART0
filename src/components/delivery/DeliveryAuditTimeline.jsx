import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Package, CheckCircle2, Bike, MapPin, ShieldCheck, RefreshCw,
  AlertCircle, Lock, UserCog, Clock, XCircle, Loader2,
} from 'lucide-react';

const EVENT_ICONS = {
  assigned: Package,
  accepted: CheckCircle2,
  picked_up: Package,
  started: Bike,
  arriving_soon: MapPin,
  arrived: MapPin,
  otp_generated: ShieldCheck,
  otp_resent: RefreshCw,
  otp_verified: ShieldCheck,
  otp_failed: AlertCircle,
  otp_locked: Lock,
  delivered: CheckCircle2,
  cancelled: XCircle,
  admin_override: UserCog,
};

const EVENT_COLORS = {
  assigned: 'text-blue-600 bg-blue-50',
  accepted: 'text-indigo-600 bg-indigo-50',
  picked_up: 'text-purple-600 bg-purple-50',
  started: 'text-green-600 bg-green-50',
  arriving_soon: 'text-orange-600 bg-orange-50',
  arrived: 'text-teal-600 bg-teal-50',
  otp_generated: 'text-cyan-600 bg-cyan-50',
  otp_resent: 'text-cyan-600 bg-cyan-50',
  otp_verified: 'text-green-600 bg-green-50',
  otp_failed: 'text-red-500 bg-red-50',
  otp_locked: 'text-red-600 bg-red-50',
  delivered: 'text-green-700 bg-green-100',
  cancelled: 'text-red-600 bg-red-50',
  admin_override: 'text-amber-600 bg-amber-50',
};

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' });
}

export default function DeliveryAuditTimeline({ deliveryId, customerView = false }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    try {
      const res = await base44.entities.DeliveryAuditLog.filter(
        { delivery_id: deliveryId },
        { sort: 'created_date', limit: 100 }
      );
      let items = res.items || [];
      if (customerView) {
        items = items.filter((l) => l.customer_visible);
      }
      setLogs(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [deliveryId, customerView]);

  useEffect(() => {
    loadLogs();
    const unsub = base44.entities.DeliveryAuditLog.subscribe(() => loadLogs());
    return unsub;
  }, [loadLogs]);

  if (loading) {
    return <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>;
  }

  if (logs.length === 0) {
    return <p className="text-xs text-gray-400 text-center py-4">No activity yet.</p>;
  }

  return (
    <div className="space-y-0">
      {logs.map((log, i) => {
        const Icon = EVENT_ICONS[log.event_type] || Clock;
        const colorClass = EVENT_COLORS[log.event_type] || 'text-gray-500 bg-gray-50';
        const isLast = i === logs.length - 1;
        return (
          <div key={log.id} className="flex gap-3">
            {/* Timeline line + icon */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                <Icon className="w-4 h-4" />
              </div>
              {!isLast && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
            </div>
            {/* Content */}
            <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-4'}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">{log.message}</p>
                <span className="text-[10px] text-gray-400 flex-shrink-0">{formatTime(log.created_date)}</span>
              </div>
              {log.actor_name && !customerView && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  by {log.actor_type} · {log.actor_name}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}