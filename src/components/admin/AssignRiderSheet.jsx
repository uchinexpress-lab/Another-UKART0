import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Bike, X, CheckCircle2, Phone, Star } from 'lucide-react';

export default function AssignRiderSheet({ order, open, onClose, onAssigned }) {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (open) {
      (async () => {
        try {
          const list = await base44.entities.Rider.list('-created_date', 200);
          // Show approved riders; highlight available ones
          setRiders(list.filter((r) => r.approval_status === 'approved'));
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [open]);

  if (!open) return null;

  const handleAssign = async () => {
    if (!selected) return;
    setAssigning(true);
    try {
      await base44.functions.invoke('manageDelivery', {
        action: 'assign',
        orderId: order.id,
        riderId: selected.id,
      });
      onAssigned?.();
      onClose();
    } catch (e) {
      alert('Failed to assign rider: ' + (e.message || 'Please try again'));
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[80vh] animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Assign Rider</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              #{order?.order_number} · {order?.customer_name}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Rider list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#2E7D32]" /></div>
          ) : riders.length === 0 ? (
            <div className="text-center py-8">
              <Bike className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No approved riders available.</p>
            </div>
          ) : (
            riders.map((r) => {
              const canAssign = r.is_online && r.is_available;
              const isSelected = selected?.id === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => canAssign && setSelected(r)}
                  disabled={!canAssign}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors text-left ${
                    isSelected ? 'border-[#2E7D32] bg-green-50' :
                    canAssign ? 'border-gray-200 hover:border-green-300' :
                    'border-gray-100 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 relative">
                    {r.photo ? <img src={r.photo} alt={r.name} className="w-full h-full object-cover" /> :
                      <div className="w-full h-full flex items-center justify-center"><Bike className="w-5 h-5 text-gray-400" /></div>}
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white ${r.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{r.name}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      {r.rating?.toFixed(1)} · {r.completed_deliveries || 0} deliveries
                    </p>
                  </div>
                  <div className="text-right">
                    {canAssign ? (
                      <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Available</span>
                    ) : r.current_delivery_id ? (
                      <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">On Delivery</span>
                    ) : !r.is_online ? (
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Offline</span>
                    ) : null}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Confirm */}
        {selected && (
          <div className="px-4 py-3 border-t border-gray-100">
            <div className="bg-gray-50 rounded-xl p-3 mb-2.5">
              <p className="text-xs text-gray-500">Assign to</p>
              <p className="text-sm font-bold text-gray-900">{selected.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">Delivering to: {order?.customer_address}</p>
            </div>
            <button
              onClick={handleAssign}
              disabled={assigning}
              className="w-full h-12 rounded-2xl bg-[#2E7D32] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {assigning ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}