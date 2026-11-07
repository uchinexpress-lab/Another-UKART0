import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { staffWrite } from '@/lib/staffWrite';
import { useAuth } from '@/lib/AuthContext';
import { logStaffAction } from '@/lib/staffAudit';
import { canAccessPage } from '@/lib/staffRoles';
import {
  Search, RefreshCw, Loader2, Plus, Edit, Eye, EyeOff,
} from 'lucide-react';
import SheetSelect from '@/components/SheetSelect';

export default function StaffProducts() {
  const { user } = useAuth();
  const canManage = canAccessPage(user, 'products');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.Product.filter(
        { is_hidden: { $ne: true } },
        { sort: '-created_date', limit: 100 }
      );
      setProducts(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (p) => {
    try {
      await staffWrite('Product', 'update', p.id, { is_hidden: !p.is_hidden });
      await logStaffAction('product_visibility_toggled', {
        entity_type: 'Product', record_id: p.id, record_name: p.name,
        new_value: p.is_hidden ? 'visible' : 'hidden',
      });
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_hidden: !x.is_hidden } : x)));
    } catch (e) {
      alert('Failed to update product');
    }
  };

  const filtered = products.filter((p) => {
    if (stockFilter !== 'all' && p.stock_status !== stockFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!p.name?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">{filtered.length} products</p>
        </div>
        {canManage && (
          <Link
            to="/admin/products/new"
            className="h-9 px-3 rounded-lg bg-[#2E7D32] text-white text-sm font-bold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name"
            className="w-full pl-9 pr-3 h-9 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]"
          />
        </div>
        <SheetSelect
          value={stockFilter}
          onChange={setStockFilter}
          title="Stock status"
          triggerClassName="h-9 flex items-center justify-between text-sm rounded-lg border border-gray-200 px-3 bg-white"
          options={[
            { value: 'all', label: 'All Stock Status' },
            { value: 'in_stock', label: 'In Stock' },
            { value: 'low_stock', label: 'Low Stock' },
            { value: 'out_of_stock', label: 'Out of Stock' },
          ]}
        />
        <button onClick={loadProducts} className="p-2 rounded-lg hover:bg-gray-100">
          <RefreshCw className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">No products found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Product</th>
                  <th className="text-left px-4 py-3 font-semibold">Category</th>
                  <th className="text-left px-4 py-3 font-semibold">Price</th>
                  <th className="text-left px-4 py-3 font-semibold">Stock</th>
                  <th className="text-left px-4 py-3 font-semibold">Variants</th>
                  {canManage && <th className="px-4 py-3 font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {p.image && (
                          <img src={p.image} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                        )}
                        <span className="font-medium text-gray-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{p.category_name || '—'}</td>
                    <td className="px-4 py-3 font-medium">₦{(p.price || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.stock_status === 'in_stock'
                            ? 'bg-green-100 text-green-700'
                            : p.stock_status === 'low_stock'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {(p.stock_status || 'in_stock').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{p.variants?.length || 0}</td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/admin/products/${p.id}`}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => toggleVisibility(p)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                            title={p.is_hidden ? 'Show' : 'Hide'}
                          >
                            {p.is_hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
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