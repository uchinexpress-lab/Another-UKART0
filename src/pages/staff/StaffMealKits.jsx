import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { canAccessPage } from '@/lib/staffRoles';
import { RefreshCw, Loader2, Plus, Edit } from 'lucide-react';

export default function StaffMealKits() {
  const { user } = useAuth();
  const canManage = canAccessPage(user?.role, 'meal-kits');
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKits();
  }, []);

  const loadKits = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.Package.filter(
        { group: 'meal_kits' },
        { sort: 'display_order', limit: 100 }
      );
      setKits(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (kit) => {
    try {
      await base44.entities.Package.update(kit.id, { active: !kit.active });
      setKits((prev) => prev.map((x) => (x.id === kit.id ? { ...x, active: !x.active } : x)));
    } catch (e) {
      alert('Failed to update meal kit');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meal Kits</h1>
          <p className="text-sm text-gray-500">{kits.length} meal kits</p>
        </div>
        {canManage && (
          <Link
            to="/admin/meal-kits/new"
            className="h-9 px-3 rounded-lg bg-[#2E7D32] text-white text-sm font-bold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Meal Kit
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : kits.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">No meal kits found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Meal Kit</th>
                  <th className="text-left px-4 py-3 font-semibold">Price</th>
                  <th className="text-left px-4 py-3 font-semibold">Items</th>
                  <th className="text-left px-4 py-3 font-semibold">Stock</th>
                  <th className="text-left px-4 py-3 font-semibold">Active</th>
                  {canManage && <th className="px-4 py-3 font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {kits.map((k) => (
                  <tr key={k.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {k.image && (
                          <img src={k.image} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{k.name}</p>
                          {k.badge && <p className="text-xs text-gray-500">{k.badge}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">₦{(k.total_price || k.starting_price || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{k.item_count || k.items?.length || 0}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          k.stock_status === 'in_stock'
                            ? 'bg-green-100 text-green-700'
                            : k.stock_status === 'low_stock'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {(k.stock_status || 'in_stock').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          k.active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {k.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/admin/meal-kits/${k.id}`}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => toggleActive(k)}
                            className="text-xs font-bold text-[#2E7D32]"
                          >
                            {k.active !== false ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
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