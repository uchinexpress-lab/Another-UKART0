import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Search, Plus, ImagePlus, Pencil, Copy, Eye, EyeOff, Trash2,
  Package, Boxes, AlertTriangle, XCircle, CheckCircle2, MoreVertical, Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';
import AdminNav from '@/components/admin/AdminNav';
import StatCard from '@/components/admin/StatCard';

const STATUS = {
  in_stock: { label: 'In Stock', cls: 'bg-emerald-100 text-emerald-700' },
  low_stock: { label: 'Low Stock', cls: 'bg-amber-100 text-amber-700' },
  out_of_stock: { label: 'Out of Stock', cls: 'bg-red-100 text-red-700' },
};

const TYPE_LABEL = { grocery: 'Grocery', meal_kit: 'Meal Kit', package: 'Package' };

export default function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [availFilter, setAvailFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sort, setSort] = useState('newest');

  const load = async () => {
    setLoading(true);
    try {
      const [ps, cats] = await Promise.all([
        base44.entities.Product.list('-created_date', 500),
        base44.entities.Category.list(),
      ]);
      setProducts(ps);
      setCategories(cats);
    } catch (e) {
      console.error(e);
      toast({ title: 'Failed to load products', variant: 'destructive' });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = [...products];
    if (search) list = list.filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()));
    if (catFilter !== 'all') list = list.filter((p) => p.category_id === catFilter);
    if (availFilter !== 'all') list = list.filter((p) => (p.stock_status || 'in_stock') === availFilter);
    if (typeFilter !== 'all') list = list.filter((p) => (p.product_type || 'grocery') === typeFilter);
    switch (sort) {
      case 'newest': list.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)); break;
      case 'oldest': list.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)); break;
      case 'price': list.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case 'name': list.sort((a, b) => (a.name || '').localeCompare(b.name || '')); break;
    }
    return list;
  }, [products, search, catFilter, availFilter, typeFilter, sort]);

  const stats = {
    total: products.length,
    inStock: products.filter((p) => (p.stock_status || 'in_stock') === 'in_stock').length,
    lowStock: products.filter((p) => p.stock_status === 'low_stock').length,
    outStock: products.filter((p) => p.stock_status === 'out_of_stock').length,
    mealKits: products.filter((p) => (p.product_type || 'grocery') === 'meal_kit').length,
    cats: categories.length,
  };

  const duplicate = async (p) => {
    try {
      const { id, created_date, updated_date, created_by_id, ...rest } = p;
      await base44.entities.Product.create({ ...rest, name: `${p.name} (Copy)` });
      toast({ title: 'Product duplicated' });
      load();
    } catch { toast({ title: 'Failed to duplicate', variant: 'destructive' }); }
  };
  const toggleHide = async (p) => {
    try { await base44.entities.Product.update(p.id, { is_hidden: !p.is_hidden }); load(); }
    catch { toast({ title: 'Failed', variant: 'destructive' }); }
  };
  const remove = async (p) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try { await base44.entities.Product.delete(p.id); toast({ title: 'Product deleted' }); load(); }
    catch { toast({ title: 'Failed to delete', variant: 'destructive' }); }
  };
  const markStatus = async (p, status) => {
    try { await base44.entities.Product.update(p.id, { stock_status: status }); load(); }
    catch { toast({ title: 'Failed', variant: 'destructive' }); }
  };

  const priceRange = (p) => {
    if (p.variants?.length) {
      const prices = p.variants.map((v) => v.price).filter((x) => x != null && !Number.isNaN(x));
      if (prices.length) {
        const min = Math.min(...prices), max = Math.max(...prices);
        return min === max ? `₦${min.toLocaleString()}` : `₦${min.toLocaleString()} – ₦${max.toLocaleString()}`;
      }
    }
    return p.price ? `₦${p.price.toLocaleString()}` : '—';
  };

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Products & Inventory</h1>
          <p className="text-xs text-muted-foreground">Manage groceries, meal kits & stock</p>
        </div>
      </div>

      <AdminNav />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatCard icon={Package} label="Total" value={stats.total} tone="blue" />
        <StatCard icon={CheckCircle2} label="In Stock" value={stats.inStock} tone="green" />
        <StatCard icon={AlertTriangle} label="Low Stock" value={stats.lowStock} tone="amber" />
        <StatCard icon={XCircle} label="Out of Stock" value={stats.outStock} tone="red" />
        <StatCard icon={Package} label="Meal Kits" value={stats.mealKits} tone="default" />
        <StatCard icon={Boxes} label="Categories" value={stats.cats} tone="default" />
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => navigate('/admin/products/new')}
          className="flex-1 h-10 rounded-xl bg-[#2E7D32] text-white text-sm font-bold flex items-center justify-center gap-1.5 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
        <button
          onClick={() => navigate('/admin/bulk-images')}
          className="h-10 px-3 rounded-xl bg-card border border-border text-sm font-semibold text-foreground flex items-center justify-center gap-1.5"
        >
          <ImagePlus className="w-4 h-4" /> Bulk Photos
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full text-sm border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-[#2E7D32] bg-card"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none bg-card">
            <option value="all">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={availFilter} onChange={(e) => setAvailFilter(e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none bg-card">
            <option value="all">All availability</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none bg-card">
            <option value="all">All types</option>
            <option value="grocery">Grocery</option>
            <option value="meal_kit">Meal Kit</option>
            <option value="package">Package</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none bg-card">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="price">Price (low→high)</option>
            <option value="name">Name (A→Z)</option>
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#2E7D32]" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">No products match your filters.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => {
            const st = STATUS[p.stock_status || 'in_stock'];
            return (
              <div key={p.id} className="flex items-center gap-3 bg-card rounded-xl border border-border p-2.5">
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                  {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground/40" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-foreground truncate">{p.name}</span>
                    {p.is_hidden && <EyeOff className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {p.category_name || 'Uncategorized'} · {TYPE_LABEL[p.product_type || 'grocery']}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-[#2E7D32]">{priceRange(p)}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                    {p.variants?.length > 0 && <span className="text-[10px] text-muted-foreground">{p.variants.length} variants</span>}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center shrink-0">
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/admin/products/${p.id}`)}><Pencil className="w-3.5 h-3.5 mr-2" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => duplicate(p)}><Copy className="w-3.5 h-3.5 mr-2" /> Duplicate</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleHide(p)}>{p.is_hidden ? <Eye className="w-3.5 h-3.5 mr-2" /> : <EyeOff className="w-3.5 h-3.5 mr-2" />} {p.is_hidden ? 'Unhide' : 'Hide'}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => markStatus(p, 'in_stock')}><CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Mark In Stock</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => markStatus(p, 'out_of_stock')}><XCircle className="w-3.5 h-3.5 mr-2" /> Mark Out of Stock</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => remove(p)} className="text-red-600"><Trash2 className="w-3.5 h-3.5 mr-2" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}