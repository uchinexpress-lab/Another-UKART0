import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Save, Loader2, Plus } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import AdminNav from '@/components/admin/AdminNav';
import ImageGallery from '@/components/admin/ImageGallery';
import VariantEditor, { computeStatus } from '@/components/admin/VariantEditor';
import OptionalItemsEditor from '@/components/admin/OptionalItemsEditor';

const PRODUCT_TYPES = [
  { value: 'grocery', label: 'Grocery Product' },
  { value: 'meal_kit', label: 'Meal Kit' },
  { value: 'package', label: 'Package' },
];

const inputCls = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#2E7D32] bg-card';

export default function AdminProductEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id || id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    description_long: '',
    product_type: 'grocery',
    category_id: '',
    subcategory: '',
    images: [],
    variants: [],
    stock_status: 'in_stock',
    stock_quantity: 0,
    low_stock_threshold: 5,
    is_hidden: false,
    serves: '',
    prep_time: '',
    cooking_instructions: '',
    optional_items: [],
    is_best_seller: false,
    is_weekly_deal: false,
  });

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    base44.entities.Category.list().then(setCategories).catch(() => {});
    if (!isNew) {
      base44.entities.Product.get(id).then((p) => {
        setForm({
          name: p.name || '',
          description: p.description || '',
          description_long: p.description_long || '',
          product_type: p.product_type || 'grocery',
          category_id: p.category_id || '',
          subcategory: p.subcategory || '',
          images: p.images || (p.image ? [p.image] : []),
          variants: p.variants || [],
          stock_status: p.stock_status || 'in_stock',
          stock_quantity: p.stock_quantity || 0,
          low_stock_threshold: p.low_stock_threshold ?? 5,
          is_hidden: p.is_hidden || false,
          serves: p.serves || '',
          prep_time: p.prep_time || '',
          cooking_instructions: p.cooking_instructions || '',
          optional_items: p.optional_items || [],
          is_best_seller: p.is_best_seller || false,
          is_weekly_deal: p.is_weekly_deal || false,
        });
        setLoading(false);
      }).catch(() => { toast({ title: 'Product not found', variant: 'destructive' }); navigate('/admin/products'); });
    }
  }, [id]);

  const createCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const cat = await base44.entities.Category.create({
        name: newCatName.trim(),
        slug: newCatName.trim().toLowerCase().replace(/\s+/g, '-'),
        display_order: categories.length,
      });
      setCategories([...categories, cat]);
      set({ category_id: cat.id });
      setNewCatName('');
      setShowNewCat(false);
      toast({ title: 'Category created' });
    } catch { toast({ title: 'Failed to create category', variant: 'destructive' }); }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast({ title: 'Product name is required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const category = categories.find((c) => c.id === form.category_id);
      const basePrice = form.variants.length ? form.variants[0].price : (Number(form.stock_quantity) || 0);
      const primaryImage = form.images[0] || '';
      const unit = form.variants.length
        ? `${form.variants[0].quantity} ${form.variants[0].unit}`.trim()
        : form.subcategory || '';

      const payload = {
        name: form.name.trim(),
        description: form.description,
        description_long: form.description_long,
        product_type: form.product_type,
        category_id: form.category_id,
        category_name: category?.name || '',
        subcategory: form.subcategory,
        images: form.images,
        image: primaryImage,
        variants: form.variants,
        price: basePrice,
        stock_status: form.stock_status,
        stock_quantity: Number(form.stock_quantity) || 0,
        low_stock_threshold: Number(form.low_stock_threshold) || 0,
        is_hidden: form.is_hidden,
        serves: form.serves,
        prep_time: form.prep_time,
        cooking_instructions: form.cooking_instructions,
        optional_items: form.optional_items,
        is_best_seller: form.is_best_seller,
        is_weekly_deal: form.is_weekly_deal,
        unit,
      };

      if (isNew) {
        await base44.entities.Product.create(payload);
        toast({ title: 'Product created' });
      } else {
        await base44.entities.Product.update(id, payload);
        toast({ title: 'Product updated successfully' });
      }
      navigate('/admin/products');
    } catch (e) {
      console.error(e);
      toast({ title: 'Failed to save product', variant: 'destructive' });
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#2E7D32]" /></div>;
  }

  const isMealKit = form.product_type === 'meal_kit';

  return (
    <div className="p-4 pb-32">
      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => navigate('/admin/products')} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center"><ArrowLeft className="w-4 h-4" /></button>
        <h1 className="text-xl font-bold text-foreground">{isNew ? 'Add Product' : 'Edit Product'}</h1>
      </div>

      <AdminNav />

      {/* Basic info */}
      <section className="bg-card rounded-2xl border border-border p-4 mb-4 space-y-3">
        <h2 className="text-sm font-bold text-foreground">Basic Information</h2>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Product name *</label>
          <input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Vegetable Oil" className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Short description</label>
          <input value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="One-line summary" className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Full description</label>
          <textarea value={form.description_long} onChange={(e) => set({ description_long: e.target.value })} rows={3} placeholder="Detailed description" className={`${inputCls} resize-none`} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Product type</label>
          <select value={form.product_type} onChange={(e) => set({ product_type: e.target.value })} className={inputCls}>
            {PRODUCT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Category</label>
          <div className="flex gap-2">
            <select value={form.category_id} onChange={(e) => set({ category_id: e.target.value })} className={inputCls}>
              <option value="">Select category…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={() => setShowNewCat((s) => !s)} className="px-3 rounded-lg bg-muted text-foreground shrink-0"><Plus className="w-4 h-4" /></button>
          </div>
          {showNewCat && (
            <div className="flex gap-2 mt-2">
              <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="New category name" className={inputCls} />
              <button onClick={createCategory} className="px-3 rounded-lg bg-[#2E7D32] text-white text-sm font-semibold shrink-0">Add</button>
            </div>
          )}
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Subcategory</label>
          <input value={form.subcategory} onChange={(e) => set({ subcategory: e.target.value })} placeholder="e.g. Cooking Oil" className={inputCls} />
        </div>
      </section>

      {/* Images */}
      <section className="bg-card rounded-2xl border border-border p-4 mb-4">
        <h2 className="text-sm font-bold text-foreground mb-3">Product Images</h2>
        <ImageGallery images={form.images} onChange={(images) => set({ images })} />
      </section>

      {/* Variants */}
      <section className="bg-card rounded-2xl border border-border p-4 mb-4">
        <h2 className="text-sm font-bold text-foreground mb-1">Variants & Prices</h2>
        <p className="text-xs text-muted-foreground mb-3">Add unlimited sizes/options. Each has its own price, unit & stock.</p>
        <VariantEditor variants={form.variants} onChange={(variants) => set({ variants })} />
      </section>

      {/* Inventory */}
      <section className="bg-card rounded-2xl border border-border p-4 mb-4 space-y-3">
        <h2 className="text-sm font-bold text-foreground">Inventory & Availability</h2>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Stock quantity</label>
            <input type="number" value={form.stock_quantity} onChange={(e) => set({ stock_quantity: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Low stock threshold</label>
            <input type="number" value={form.low_stock_threshold} onChange={(e) => set({ low_stock_threshold: e.target.value })} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Stock status</label>
          <select value={form.stock_status} onChange={(e) => set({ stock_status: e.target.value })} className={inputCls}>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
        <button
          onClick={() => set({ is_hidden: !form.is_hidden })}
          className="w-full flex items-center justify-between py-2"
        >
          <span className="text-sm font-medium text-foreground">Hide from customers</span>
          <span className={`relative w-11 h-6 rounded-full transition-colors ${form.is_hidden ? 'bg-[#2E7D32]' : 'bg-gray-200'}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.is_hidden ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </span>
        </button>
      </section>

      {/* Meal kit fields */}
      {isMealKit && (
        <>
          <section className="bg-card rounded-2xl border border-border p-4 mb-4 space-y-3">
            <h2 className="text-sm font-bold text-foreground">Meal Kit Details</h2>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Serves</label>
                <input value={form.serves} onChange={(e) => set({ serves: e.target.value })} placeholder="e.g. 4–6" className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Prep time</label>
                <input value={form.prep_time} onChange={(e) => set({ prep_time: e.target.value })} placeholder="e.g. 30 mins" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Cooking instructions</label>
              <textarea value={form.cooking_instructions} onChange={(e) => set({ cooking_instructions: e.target.value })} rows={5} placeholder="Step 1: Wash rice thoroughly…&#10;Step 2: Prepare the tomato base…" className={`${inputCls} resize-none`} />
            </div>
          </section>
          <section className="bg-card rounded-2xl border border-border p-4 mb-4">
            <h2 className="text-sm font-bold text-foreground mb-1">Optional Add-ons</h2>
            <p className="text-xs text-muted-foreground mb-3">Extra items customers can add (protein, extras).</p>
            <OptionalItemsEditor items={form.optional_items} onChange={(optional_items) => set({ optional_items })} />
          </section>
        </>
      )}

      {/* Badges */}
      <section className="bg-card rounded-2xl border border-border p-4 mb-4 space-y-2">
        <h2 className="text-sm font-bold text-foreground">Badges</h2>
        <button onClick={() => set({ is_best_seller: !form.is_best_seller })} className="w-full flex items-center justify-between py-2">
          <span className="text-sm font-medium text-foreground">Best Seller</span>
          <span className={`relative w-11 h-6 rounded-full transition-colors ${form.is_best_seller ? 'bg-[#2E7D32]' : 'bg-gray-200'}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.is_best_seller ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </span>
        </button>
        <button onClick={() => set({ is_weekly_deal: !form.is_weekly_deal })} className="w-full flex items-center justify-between py-2">
          <span className="text-sm font-medium text-foreground">Weekly Deal</span>
          <span className={`relative w-11 h-6 rounded-full transition-colors ${form.is_weekly_deal ? 'bg-[#2E7D32]' : 'bg-gray-200'}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.is_weekly_deal ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </span>
        </button>
      </section>

      {/* Sticky save */}
      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto px-4 py-3 bg-background/95 backdrop-blur border-t border-border z-30">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 rounded-2xl bg-[#2E7D32] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isNew ? 'Create Product' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}