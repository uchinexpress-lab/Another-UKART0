import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { staffWrite } from '@/lib/staffWrite';
import { useAuth } from '@/lib/AuthContext';
import { canAccessPage } from '@/lib/staffRoles';
import PackagePreview from '@/components/staff/PackagePreview';
import {
  RefreshCw, Loader2, Plus, Edit, Copy, Eye, Trash2,
  Package as PackageIcon, Search, ChevronUp, ChevronDown,
} from 'lucide-react';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'featured', label: 'Featured' },
  { key: 'out_of_stock', label: 'Out of Stock' },
  { key: 'essentials', label: 'Grocery Packages' },
  { key: 'meal_kits', label: 'Meal Kits' },
];

const formatNaira = (n) => `₦${(n || 0).toLocaleString()}`;

export default function StaffPackages() {
  const { user } = useAuth();
  const canManage = canAccessPage(user, 'packages');
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [previewPkg, setPreviewPkg] = useState(null);

  useEffect(() => { loadPackages(); }, []);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.Package.filter({}, { sort: 'display_order', limit: 100 });
      setPackages(res.items || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const filtered = packages.filter((p) => {
    if (search && !p.name?.toLowerCase().includes(search.toLowerCase())) return false;
    switch (filter) {
      case 'active': return p.active !== false;
      case 'inactive': return p.active === false;
      case 'featured': return p.featured === true;
      case 'out_of_stock': return p.stock_status === 'out_of_stock';
      case 'essentials': return p.group !== 'meal_kits';
      case 'meal_kits': return p.group === 'meal_kits';
      default: return true;
    }
  });

  const toggleActive = async (pkg) => {
    try {
      await staffWrite('Package', 'update', pkg.id, { active: !pkg.active });
      setPackages((prev) => prev.map((x) => (x.id === pkg.id ? { ...x, active: !x.active } : x)));
    } catch { alert('Failed to update package'); }
  };

  const duplicate = async (pkg) => {
    const newName = prompt('Name for the duplicated package:', `${pkg.name} (Copy)`);
    if (!newName?.trim()) return;
    try {
      const { id, created_date, updated_date, created_by_id, ...rest } = pkg;
      await staffWrite('Package', 'create', null, {
        ...rest,
        name: newName.trim(),
        active: false,
        display_order: 0,
      });
      await loadPackages();
    } catch { alert('Failed to duplicate package'); }
  };

  const deletePkg = async (pkg) => {
    if (!confirm(`Delete "${pkg.name}"? This cannot be undone. Consider deactivating instead.`)) return;
    try {
      await staffWrite('Package', 'delete', pkg.id);
      setPackages((prev) => prev.filter((x) => x.id !== pkg.id));
    } catch { alert('Failed to delete package'); }
  };

  const moveOrder = async (pkg, dir) => {
    const idx = filtered.findIndex((x) => x.id === pkg.id);
    const target = idx + dir;
    if (target < 0 || target >= filtered.length) return;
    const other = filtered[target];
    const newOrder = other.display_order || 0;
    const otherOrder = pkg.display_order || 0;
    try {
      await staffWrite('Package', 'update', pkg.id, { display_order: newOrder });
      await staffWrite('Package', 'update', other.id, { display_order: otherOrder });
      await loadPackages();
    } catch { alert('Failed to reorder'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Packages</h1>
          <p className="text-sm text-gray-500">{packages.length} packages</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadPackages} className="p-2 rounded-lg hover:bg-gray-100">
            <RefreshCw className="w-4 h-4 text-gray-600" />
          </button>
          {canManage && (
            <Link
              to="/admin/packages/new"
              className="h-9 px-3 rounded-lg bg-[#2E7D32] text-white text-sm font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Package
            </Link>
          )}
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search packages..."
            className="w-full pl-9 pr-3 h-9 text-sm rounded-lg border border-gray-200 bg-gray-50 outline-none focus:border-[#2E7D32] focus:bg-white"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                filter === f.key ? 'bg-[#2E7D32] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-400">
          No packages found
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="text-left px-3 py-3 font-semibold w-8"></th>
                    <th className="text-left px-3 py-3 font-semibold">Package</th>
                    <th className="text-left px-3 py-3 font-semibold">Type</th>
                    <th className="text-left px-3 py-3 font-semibold">Items</th>
                    <th className="text-left px-3 py-3 font-semibold">Price</th>
                    <th className="text-left px-3 py-3 font-semibold">Old Price</th>
                    <th className="text-left px-3 py-3 font-semibold">Savings</th>
                    <th className="text-left px-3 py-3 font-semibold">Status</th>
                    <th className="text-left px-3 py-3 font-semibold">Order</th>
                    <th className="px-3 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((pkg, idx) => {
                    const savings = (pkg.original_total || 0) - (pkg.total_price || 0);
                    return (
                      <tr key={pkg.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3">
                          <div className="flex flex-col">
                            <button
                              onClick={() => moveOrder(pkg, -1)}
                              disabled={idx === 0}
                              className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => moveOrder(pkg, 1)}
                              disabled={idx === filtered.length - 1}
                              className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            {pkg.image ? (
                              <img src={pkg.image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                <PackageIcon className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{pkg.name}</p>
                              {pkg.badge && (
                                <span className="text-[10px] font-bold text-[#2E7D32]">{pkg.badge}</span>
                              )}
                              {pkg.featured && (
                                <span className="ml-1 text-[10px] font-bold text-amber-600">★ Featured</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-600">
                          {pkg.group === 'meal_kits' ? 'Meal Kit' : 'Grocery'}
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-600">
                          {pkg.item_count || pkg.items?.length || 0}
                        </td>
                        <td className="px-3 py-3 font-medium">{formatNaira(pkg.total_price)}</td>
                        <td className="px-3 py-3 text-gray-500">
                          {pkg.original_total ? formatNaira(pkg.original_total) : '—'}
                        </td>
                        <td className="px-3 py-3 text-[#2E7D32] font-medium">
                          {savings > 0 ? formatNaira(savings) : '—'}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block w-fit ${
                                pkg.active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {pkg.active !== false ? 'Active' : 'Inactive'}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block w-fit ${
                                pkg.stock_status === 'in_stock'
                                  ? 'bg-green-100 text-green-700'
                                  : pkg.stock_status === 'low_stock'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {(pkg.stock_status || 'in_stock').replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-500">{pkg.display_order || 0}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setPreviewPkg(pkg)}
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                              title="Preview"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {canManage && (
                              <>
                                <Link
                                  to={`/admin/packages/${pkg.id}`}
                                  className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </Link>
                                <button
                                  onClick={() => duplicate(pkg)}
                                  className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                                  title="Duplicate"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => toggleActive(pkg)}
                                  className="text-xs font-bold text-[#2E7D32] px-1"
                                  title={pkg.active !== false ? 'Deactivate' : 'Activate'}
                                >
                                  {pkg.active !== false ? 'Deact' : 'Act'}
                                </button>
                                <button
                                  onClick={() => deletePkg(pkg)}
                                  className="p-1.5 rounded hover:bg-red-50 text-red-500"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {filtered.map((pkg, idx) => {
              const savings = (pkg.original_total || 0) - (pkg.total_price || 0);
              return (
                <div key={pkg.id} className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
                  <div className="flex items-start gap-3">
                    {pkg.image ? (
                      <img src={pkg.image} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
                        <PackageIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{pkg.name}</p>
                      <p className="text-xs text-gray-500">
                        {pkg.group === 'meal_kits' ? 'Meal Kit' : 'Grocery Package'} ·{' '}
                        {pkg.item_count || pkg.items?.length || 0} items
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-gray-900">{formatNaira(pkg.total_price)}</span>
                        {pkg.original_total > 0 && (
                          <span className="text-xs text-gray-400 line-through">
                            {formatNaira(pkg.original_total)}
                          </span>
                        )}
                        {savings > 0 && (
                          <span className="text-xs text-[#2E7D32] font-semibold">
                            Save {formatNaira(savings)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          pkg.active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {pkg.active !== false ? 'Active' : 'Inactive'}
                      </span>
                      {pkg.featured && (
                        <span className="text-[10px] font-bold text-amber-600">★ Featured</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => setPreviewPkg(pkg)}
                      className="h-8 px-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>
                    {canManage && (
                      <>
                        <Link
                          to={`/admin/packages/${pkg.id}`}
                          className="flex-1 h-8 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold flex items-center justify-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </Link>
                        <button
                          onClick={() => duplicate(pkg)}
                          className="h-8 px-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" /> Dup
                        </button>
                        <button
                          onClick={() => toggleActive(pkg)}
                          className="h-8 px-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold"
                        >
                          {pkg.active !== false ? 'Deact' : 'Act'}
                        </button>
                        <button
                          onClick={() => deletePkg(pkg)}
                          className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {previewPkg && <PackagePreview pkg={previewPkg} onClose={() => setPreviewPkg(null)} />}
    </div>
  );
}