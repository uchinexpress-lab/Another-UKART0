import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { logStaffAction } from '@/lib/staffAudit';
import { canAccessPage } from '@/lib/staffRoles';
import { RefreshCw, Loader2, Search, Bike, CheckCircle2, XCircle, Clock } from 'lucide-react';

const VEHICLE_LABELS = {
  motorcycle: 'Motorcycle',
  bicycle: 'Bicycle',
  car: 'Car',
  scooter: 'Scooter',
  van: 'Van',
};

export default function StaffRiders() {
  const { user } = useAuth();
  const canManage = canAccessPage(user, 'riders');
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadRiders();
  }, []);

  const loadRiders = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.Rider.filter({}, { sort: '-created_date', limit: 100 });
      setRiders(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateApproval = async (rider, newStatus) => {
    setUpdatingId(rider.id);
    try {
      await base44.entities.Rider.update(rider.id, { approval_status: newStatus });
      await logStaffAction('rider_approval_changed', {
        entity_type: 'Rider', record_id: rider.id, record_name: rider.name,
        previous_value: rider.approval_status, new_value: newStatus,
      });
      setRiders((prev) => prev.map((r) => (r.id === rider.id ? { ...r, approval_status: newStatus } : r)));
    } catch (e) {
      alert('Failed to update rider status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = riders.filter((r) => {
    if (statusFilter !== 'all' && r.approval_status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const hay = `${r.name || ''} ${r.phone || ''} ${r.email || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Riders</h1>
          <p className="text-sm text-gray-500">{filtered.length} riders</p>
        </div>
        <button onClick={loadRiders} className="p-2 rounded-lg hover:bg-gray-100">
          <RefreshCw className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, email"
            className="w-full pl-9 pr-3 h-9 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 text-sm rounded-lg border border-gray-200 px-3 outline-none focus:border-[#2E7D32]"
        >
          <option value="all">All Approval Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">No riders found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold">Vehicle</th>
                  <th className="text-left px-4 py-3 font-semibold">Approval</th>
                  <th className="text-left px-4 py-3 font-semibold">Online</th>
                  <th className="text-left px-4 py-3 font-semibold">Available</th>
                  <th className="text-left px-4 py-3 font-semibold">Deliveries</th>
                  <th className="text-left px-4 py-3 font-semibold">Rating</th>
                  {canManage && <th className="px-4 py-3 font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/admin/riders/${r.id}`} className="font-medium text-[#2E7D32] hover:underline">
                        {r.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.phone}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {VEHICLE_LABELS[r.vehicle_type] || r.vehicle_type}
                      {r.vehicle_number && <p className="text-gray-400">{r.vehicle_number}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          r.approval_status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : r.approval_status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : r.approval_status === 'suspended'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {r.approval_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.is_online ? (
                        <span className="text-green-600 text-xs font-medium">● Online</span>
                      ) : (
                        <span className="text-gray-400 text-xs">Offline</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.is_available ? (
                        <span className="text-blue-600 text-xs font-medium">Available</span>
                      ) : (
                        <span className="text-gray-400 text-xs">Busy</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {r.completed_deliveries || 0} done
                      {r.cancelled_deliveries > 0 && <p className="text-red-400">{r.cancelled_deliveries} cancelled</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">★ {r.rating || 5}</td>
                    {canManage && (
                      <td className="px-4 py-3">
                        {r.approval_status === 'pending' && (
                          <button
                            onClick={() => updateApproval(r, 'approved')}
                            disabled={updatingId === r.id}
                            className="text-xs font-bold text-green-600 hover:text-green-700"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {r.approval_status === 'approved' && (
                          <button
                            onClick={() => updateApproval(r, 'suspended')}
                            disabled={updatingId === r.id}
                            className="text-xs font-bold text-red-500 hover:text-red-600"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {r.approval_status === 'suspended' && (
                          <button
                            onClick={() => updateApproval(r, 'approved')}
                            disabled={updatingId === r.id}
                            className="text-xs font-bold text-green-600 hover:text-green-700"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
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