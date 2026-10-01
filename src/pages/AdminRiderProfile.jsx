import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Bike, Phone, MapPin, Star, UserCheck, UserX, Calendar, Truck } from 'lucide-react';

export default function AdminRiderProfile() {
  const { id } = { id: window.location.pathname.split('/').pop() };
  const [rider, setRider] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await base44.entities.Rider.get(id);
        setRider(r);
        const dels = await base44.entities.Delivery.filter({ rider_id: id }, { sort: '-created_date', limit: 20 });
        setDeliveries(dels.items || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const updateStatus = async (status) => {
    setUpdating(true);
    try {
      await base44.entities.Rider.update(id, { approval_status: status });
      const r = await base44.entities.Rider.get(id);
      setRider(r);
    } catch (e) {
      alert('Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#2E7D32]" /></div>;
  if (!rider) return <div className="px-4 py-10 text-center text-sm text-gray-500">Rider not found.</div>;

  return (
    <div className="px-4 py-4 pb-10 space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
            {rider.photo ? <img src={rider.photo} alt={rider.name} className="w-full h-full object-cover" /> :
              <div className="w-full h-full flex items-center justify-center"><Bike className="w-8 h-8 text-gray-400" /></div>}
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">{rider.name}</h2>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /> {rider.phone}</p>
            <p className="text-xs text-gray-500">{rider.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 rounded-lg p-2"><p className="text-gray-500">Vehicle</p><p className="font-medium text-gray-900 capitalize">{rider.vehicle_type}</p></div>
          <div className="bg-gray-50 rounded-lg p-2"><p className="text-gray-500">Number</p><p className="font-medium text-gray-900">{rider.vehicle_number}</p></div>
          <div className="bg-gray-50 rounded-lg p-2"><p className="text-gray-500">Completed</p><p className="font-bold text-green-600">{rider.completed_deliveries || 0}</p></div>
          <div className="bg-gray-50 rounded-lg p-2"><p className="text-gray-500">Rating</p><p className="font-bold text-amber-500 flex items-center gap-0.5"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{rider.rating?.toFixed(1)}</p></div>
        </div>
        {rider.address && <p className="text-xs text-gray-500 flex items-center gap-1 mt-2 pt-2 border-t border-gray-100"><MapPin className="w-3 h-3" /> {rider.address}</p>}
      </div>

      {/* Status actions */}
      <div className="flex gap-2">
        {rider.approval_status !== 'approved' && (
          <button onClick={() => updateStatus('approved')} disabled={updating}
            className="flex-1 h-11 rounded-xl bg-[#2E7D32] text-white text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
            <UserCheck className="w-4 h-4" /> Approve
          </button>
        )}
        {rider.approval_status !== 'suspended' && (
          <button onClick={() => updateStatus('suspended')} disabled={updating}
            className="flex-1 h-11 rounded-xl bg-red-50 text-red-600 text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
            <UserX className="w-4 h-4" /> Suspend
          </button>
        )}
      </div>

      {/* Delivery history */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5"><Truck className="w-4 h-4" /> Delivery History</h3>
        {deliveries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center text-sm text-gray-400">No deliveries yet.</div>
        ) : (
          <div className="space-y-2">
            {deliveries.map((d) => (
              <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-gray-900">#{d.order_number}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-600 capitalize">{d.status}</span>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {d.customer_address}</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {d.delivered_at ? `Delivered ${new Date(d.delivered_at).toLocaleDateString()}` : `Created ${new Date(d.created_date).toLocaleDateString()}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}