import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Loader2, Search, Bike, Phone, Calendar, CheckCircle2, XCircle,
  Power, UserCheck, UserX, MapPin, Star, Eye,
} from 'lucide-react';

const APPROVAL_TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'online', label: 'Online' },
  { value: 'available', label: 'Available' },
  { value: 'suspended', label: 'Suspended' },
];

export default function AdminRiders() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  const loadRiders = useCallback(async () => {
    try {
      const list = await base44.entities.Rider.list('-created_date', 200);
      setRiders(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRiders();
    const unsub = base44.entities.Rider.subscribe(() => loadRiders());
    return unsub;
  }, [loadRiders]);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await base44.entities.Rider.update(id, { approval_status: status });
      await loadRiders();
    } catch (e) {
      alert('Failed to update rider status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = riders.filter((r) => {
    if (filter === 'pending' && r.approval_status !== 'pending') return false;
    if (filter === 'approved' && r.approval_status !== 'approved') return false;
    if (filter === 'suspended' && r.approval_status !== 'suspended') return false;
    if (filter === 'online' && !r.is_online) return false;
    if (filter === 'available' && !r.is_available) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!(`${r.name} ${r.phone} ${r.email || ''}`.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  // Counters
  const total = riders.length;
  const approved = riders.filter((r) => r.approval_status === 'approved').length;
  const pending = riders.filter((r) => r.approval_status === 'pending').length;
  const online = riders.filter((r) => r.is_online).length;
  const available = riders.filter((r) => r.is_available).length;
  const onDelivery = riders.filter((r) => r.current_delivery_id).length;

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#2E7D32]" /></div>;
  }

  return (
    <div className="px-4 py-4 pb-10 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Rider Management</h1>

      {/* Counters */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total', value: total, color: 'text-gray-900' },
          { label: 'Approved', value: approved, color: 'text-green-600' },
          { label: 'Pending', value: pending, color: 'text-amber-500' },
          { label: 'Online', value: online, color: 'text-blue-600' },
          { label: 'Available', value: available, color: 'text-teal-600' },
          { label: 'On Delivery', value: onDelivery, color: 'text-purple-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-2.5 text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search riders by name, phone, email"
          className="w-full h-10 pl-9 pr-3 text-sm rounded-xl border border-gray-200 outline-none focus:border-[#2E7D32]"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {APPROVAL_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
              filter === t.value ? 'bg-[#2E7D32] text-white' : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Rider list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Bike className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No riders found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-200 p-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 relative">
                  {r.photo ? (
                    <img src={r.photo} alt={r.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Bike className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      r.is_online ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900 truncate">{r.name}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                      r.approval_status === 'approved' ? 'bg-green-50 text-green-700' :
                      r.approval_status === 'pending' ? 'bg-amber-50 text-amber-700' :
                      r.approval_status === 'suspended' ? 'bg-red-50 text-red-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {r.approval_status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" /> {r.phone}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {r.vehicle_type} · {r.vehicle_number} · {r.completed_deliveries || 0} deliveries
                  </p>
                </div>
              </div>

              {/* Actions */}
              {r.approval_status === 'pending' && (
                <div className="flex gap-2 mt-2.5 pt-2.5 border-t border-gray-100">
                  <button
                    onClick={() => updateStatus(r.id, 'approved')}
                    disabled={updatingId === r.id}
                    className="flex-1 h-9 rounded-lg bg-[#2E7D32] text-white text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform disabled:opacity-50"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => updateStatus(r.id, 'suspended')}
                    disabled={updatingId === r.id}
                    className="flex-1 h-9 rounded-lg bg-red-50 text-red-600 text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform disabled:opacity-50"
                  >
                    <UserX className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              )}
              {r.approval_status === 'approved' && (
                <div className="flex gap-2 mt-2.5 pt-2.5 border-t border-gray-100">
                  <button
                    onClick={() => updateStatus(r.id, 'suspended')}
                    disabled={updatingId === r.id}
                    className="flex-1 h-9 rounded-lg bg-red-50 text-red-600 text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform disabled:opacity-50"
                  >
                    Suspend
                  </button>
                  <button
                    onClick={() => updateStatus(r.id, 'inactive')}
                    disabled={updatingId === r.id}
                    className="flex-1 h-9 rounded-lg bg-gray-50 text-gray-600 text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform disabled:opacity-50"
                  >
                    Deactivate
                  </button>
                </div>
              )}
              {r.approval_status === 'suspended' && (
                <div className="flex gap-2 mt-2.5 pt-2.5 border-t border-gray-100">
                  <button
                    onClick={() => updateStatus(r.id, 'approved')}
                    disabled={updatingId === r.id}
                    className="flex-1 h-9 rounded-lg bg-[#2E7D32] text-white text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform disabled:opacity-50"
                  >
                    Re-approve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}