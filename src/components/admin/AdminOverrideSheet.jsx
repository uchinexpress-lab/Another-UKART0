import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, AlertTriangle, X, ShieldAlert } from 'lucide-react';

const OVERRIDE_REASONS = [
  { value: 'Customer phone unavailable', label: 'Customer phone unavailable' },
  { value: 'SMS delivery failure', label: 'SMS delivery failure' },
  { value: 'Customer email unavailable', label: 'Customer email unavailable' },
  { value: 'Technical issue', label: 'Technical issue' },
  { value: 'Other', label: 'Other' },
];

export default function AdminOverrideSheet({ delivery, open, onClose, onOverridden }) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleOverride = async () => {
    if (!reason) {
      setError('Please select a reason.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await base44.functions.invoke('adminOverrideDelivery', {
        deliveryId: delivery.id,
        reason,
        note,
      });
      onOverridden?.();
      onClose();
      setReason('');
      setNote('');
    } catch (e) {
      setError(e.message || 'Override failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[80vh] animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Admin Override Delivery</h3>
              <p className="text-xs text-gray-500">#{delivery?.order_number} · {delivery?.customer_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              This will mark the delivery as <strong>delivered without OTP verification</strong>.
              This action is logged with your admin ID, reason, and timestamp.
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Reason *</label>
            <div className="space-y-1.5">
              {OVERRIDE_REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setReason(r.value)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border-2 text-sm transition-colors ${
                    reason === r.value
                      ? 'border-[#2E7D32] bg-green-50 text-gray-900 font-semibold'
                      : 'border-gray-200 text-gray-700'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a short note explaining the override..."
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:border-[#2E7D32] resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 rounded-xl p-2.5 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleOverride}
            disabled={loading || !reason}
            className="flex-1 h-12 rounded-xl bg-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
            {loading ? 'Overriding...' : 'Confirm Override'}
          </button>
        </div>
      </div>
    </div>
  );
}