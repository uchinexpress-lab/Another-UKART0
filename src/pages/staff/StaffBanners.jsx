import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { canAccessPage } from '@/lib/staffRoles';
import { RefreshCw, Loader2, Edit } from 'lucide-react';

const LOCATIONS = [
  { value: 'home', label: 'Home' },
  { value: 'meal_kits', label: 'Meal Kits' },
  { value: 'promotions', label: 'Promotions' },
  { value: 'categories', label: 'Categories' },
];

export default function StaffBanners() {
  const { user } = useAuth();
  const canManage = canAccessPage(user?.role, 'banners');
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState('all');

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.Banner.filter({}, { sort: 'order', limit: 100 });
      setBanners(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (b) => {
    try {
      await base44.entities.Banner.update(b.id, { active: !b.active });
      setBanners((prev) => prev.map((x) => (x.id === b.id ? { ...x, active: !x.active } : x)));
    } catch (e) {
      alert('Failed to update banner');
    }
  };

  const filtered = banners.filter((b) => locationFilter === 'all' || b.location === locationFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banners</h1>
          <p className="text-sm text-gray-500">{filtered.length} banners</p>
        </div>
        {canManage && (
          <Link
            to="/admin/banners/manage"
            className="h-9 px-3 rounded-lg bg-[#2E7D32] text-white text-sm font-bold flex items-center gap-1.5"
          >
            <Edit className="w-4 h-4" /> Manage Banners
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3">
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="h-9 text-sm rounded-lg border border-gray-200 px-3 outline-none focus:border-[#2E7D32]"
        >
          <option value="all">All Locations</option>
          {LOCATIONS.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
        <button onClick={loadBanners} className="p-2 rounded-lg hover:bg-gray-100">
          <RefreshCw className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full p-12 text-center text-sm text-gray-400">No banners found</div>
        ) : (
          filtered.map((b) => (
            <div key={b.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="h-32 bg-gray-100">
                {b.image && <img src={b.image} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm text-gray-900">{b.name}</p>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      b.active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {b.active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {LOCATIONS.find((l) => l.value === b.location)?.label || b.location} · Order: {b.order || 0}
                </p>
                {canManage && (
                  <button
                    onClick={() => toggleActive(b)}
                    className="mt-2 text-xs font-bold text-[#2E7D32]"
                  >
                    {b.active !== false ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}