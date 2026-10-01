import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Upload, Loader2, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { canAccessPage } from '@/lib/staffRoles';
import BannerImageEditor from '@/components/admin/BannerImageEditor';
import PackageItemEditor from '@/components/staff/PackageItemEditor';
import PackagePreview from '@/components/staff/PackagePreview';
import { useToast } from '@/components/ui/use-toast';

const BADGE_OPTIONS = ['Best Value', 'Popular', 'New', 'Family Favourite', 'Save More'];
const GROUP_OPTIONS = [
  { value: 'essentials', label: 'Grocery Package' },
  { value: 'meal_kits', label: 'Meal Kit' },
];
const STOCK_OPTIONS = [
  { value: 'in_stock', label: 'Available' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

const formatNaira = (n) => `₦${(n || 0).toLocaleString()}`;

export default function StaffPackageEdit() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = canAccessPage(user, 'packages');
  const { toast } = useToast();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [allProducts, setAllProducts] = useState([]);

  const [form, setForm] = useState({
    name: '', description: '', description_long: '', group: 'essentials',
    badge: '', serves: '', delivery_time: '', active: true, featured: false,
    display_order: 0, total_price: 0, original_total: 0, stock_status: 'in_stock',
    image: '', image_zoom: 1, image_pos_x: 50, image_pos_y: 50, image_fit_mode: 'contain',
    items: [],
  });

  useEffect(() => {
    if (isNew) return;
    base44.entities.Package.get(id).then((pkg) => {
      setForm({
        name: pkg.name || '', description: pkg.description || '',
        description_long: pkg.description_long || '', group: pkg.group || 'essentials',
        badge: pkg.badge || '', serves: pkg.serves || '', delivery_time: pkg.delivery_time || '',
        active: pkg.active ?? true, featured: pkg.featured || false,
        display_order: pkg.display_order || 0, total_price: pkg.total_price || 0,
        original_total: pkg.original_total || 0, stock_status: pkg.stock_status || 'in_stock',
        image: pkg.image || '', image_zoom: pkg.image_zoom || 1, image_pos_x: pkg.image_pos_x || 50,
        image_pos_y: pkg.image_pos_y || 50, image_fit_mode: pkg.image_fit_mode || 'contain',
        items: pkg.items || [],
      });
      setLoading(false);
    });
    base44.entities.Product.list().then(setAllProducts);
  }, [id, isNew]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleImageUpload = async (file) => {
    const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
    update('image', file_url);
    setShowImageEditor(true);
  };

  const savings = (form.original_total || 0) - (form.total_price || 0);
  const savingsPercent = form.original_total > 0 ? Math.round((savings / form.original_total) * 100) : 0;

  const handleSave = async () => {
    if (!form.name.trim()) { toast({ title: 'Name is required', variant: 'destructive' }); return; }
    setSaving(true);
    const data = {
      name: form.name.trim(),
      description: form.description,
      description_long: form.description_long,
      group: form.group,
      total_price: form.total_price,
      original_total: form.original_total || null,
      item_count: form.items.filter((i) => i.active !== false).length,
      active: form.active,
      featured: form.featured,
      display_order: form.display_order,
      badge: form.badge || null,
      delivery_time: form.delivery_time || null,
      serves: form.serves || null,
      stock_status: form.stock_status,
      image: form.image,
      image_zoom: form.image_zoom,
      image_pos_x: form.image_pos_x,
      image_pos_y: form.image_pos_y,
      image_fit_mode: form.image_fit_mode,
      items: form.items,
    };
    try {
      if (isNew) {
        await base44.entities.Package.create(data);
      } else {
        await base44.entities.Package.update(id, data);
      }
      toast({ title: 'Package saved successfully' });
      navigate('/admin/packages');
    } catch { toast({ title: 'Save failed', variant: 'destructive' }); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${form.name}"? This cannot be undone.`)) return;
    try {
      await base44.entities.Package.delete(id);
      toast({ title: 'Package deleted' });
      navigate('/admin/packages');
    } catch { toast({ title: 'Delete failed', variant: 'destructive' }); }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#2E7D32] rounded-full animate-spin" />
      </div>
    );
  }

  const bgSize = form.image_zoom > 1
    ? `${form.image_zoom * 100}%`
    : form.image_fit_mode === 'contain' ? 'contain' : 'cover';
  const previewPkg = { ...form, item_count: form.items.filter((i) => i.active !== false).length };

  return (
    <div className="px-4 pt-2 pb-24 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/admin/packages')}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{isNew ? 'New Package' : 'Edit Package'}</h1>
      </div>

      <div className="space-y-4">
        {/* Basic Information */}
        <Section title="Basic Information">
          <Input label="Package Name" value={form.name} onChange={(v) => update('name', v)} placeholder="e.g. Monthly Stock-up" />
          <TextArea label="Short Description" value={form.description} onChange={(v) => update('description', v)} placeholder="Brief description shown on cards..." />
          <TextArea label="Full Description (optional)" value={form.description_long} onChange={(v) => update('description_long', v)} placeholder="Detailed description shown on package detail page..." rows={3} />
          <div className="grid grid-cols-2 gap-2">
            <SelectField label="Package Category" value={form.group} onChange={(v) => update('group', v)} options={GROUP_OPTIONS} />
            <SelectField label="Stock Status" value={form.stock_status} onChange={(v) => update('stock_status', v)} options={STOCK_OPTIONS} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Badge / Label</label>
              <input
                list="badge-options"
                value={form.badge}
                onChange={(e) => update('badge', e.target.value)}
                placeholder="Custom or select..."
                className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30"
              />
              <datalist id="badge-options">
                {BADGE_OPTIONS.map((o) => <option key={o} value={o} />)}
              </datalist>
            </div>
            <Input label="Servings / Household Size" value={form.serves} onChange={(v) => update('serves', v)} placeholder="e.g. 4-6 people" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Delivery Time" value={form.delivery_time} onChange={(v) => update('delivery_time', v)} placeholder="e.g. Same day" />
            <Input label="Display Order" type="number" value={form.display_order} onChange={(v) => update('display_order', parseInt(v) || 0)} />
          </div>
          <Toggle label="Active (visible to customers)" value={form.active} onChange={(v) => update('active', v)} />
          <Toggle label="Featured Package" value={form.featured} onChange={(v) => update('featured', v)} />
        </Section>

        {/* Pricing */}
        <Section title="Package Pricing">
          <div className="grid grid-cols-2 gap-2">
            <Input label="Package Price (₦)" type="number" value={form.total_price} onChange={(v) => update('total_price', parseFloat(v) || 0)} />
            <Input label="Original / Old Price (₦)" type="number" value={form.original_total} onChange={(v) => update('original_total', parseFloat(v) || 0)} />
          </div>
          {savings > 0 && form.original_total > 0 && (
            <div className="p-3 rounded-xl bg-[#2E7D32]/10 text-sm">
              <span className="font-bold text-[#2E7D32]">Save {formatNaira(savings)}</span>
              <span className="text-muted-foreground ml-2">({savingsPercent}% off)</span>
            </div>
          )}
        </Section>

        {/* Main Image */}
        <Section title="Main Image">
          {form.image ? (
            <div className="space-y-2">
              <div className="relative w-full overflow-hidden rounded-xl bg-gray-100" style={{ aspectRatio: '4/3' }}>
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${form.image})`,
                    backgroundSize: bgSize,
                    backgroundPosition: `${form.image_pos_x}% ${form.image_pos_y}%`,
                    backgroundRepeat: 'no-repeat',
                  }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowImageEditor(true)}
                  className="flex-1 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:bg-accent"
                >
                  Edit Image
                </button>
                <label className="flex-1 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:bg-accent text-center cursor-pointer">
                  Replace
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
                  />
                </label>
              </div>
            </div>
          ) : (
            <label className="w-full py-8 rounded-xl border-2 border-dashed border-border hover:border-[#2E7D32]/40 hover:bg-[#2E7D32]/5 transition-colors flex flex-col items-center gap-2 cursor-pointer">
              <Upload className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">Click to upload image</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
              />
            </label>
          )}
        </Section>

        {/* What's Included */}
        <Section title="What's Included">
          <PackageItemEditor items={form.items} onChange={(v) => update('items', v)} products={allProducts} />
        </Section>
      </div>

      {/* Action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-3 flex gap-2 max-w-3xl mx-auto z-30">
        <button
          onClick={() => setShowPreview(true)}
          className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground text-sm font-semibold flex items-center justify-center gap-1.5"
        >
          <Eye className="w-4 h-4" /> Preview
        </button>
        {canManage && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-[#2E7D32] text-white text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </button>
        )}
        {!isNew && canManage && (
          <button
            onClick={handleDelete}
            className="h-10 px-3 rounded-xl bg-red-50 text-red-600 text-sm font-semibold flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {showImageEditor && form.image && (
        <BannerImageEditor
          imageUrl={form.image}
          aspectRatio={4 / 3}
          initialSettings={{
            zoom: form.image_zoom,
            pos_x: form.image_pos_x,
            pos_y: form.image_pos_y,
            fit_mode: form.image_fit_mode,
          }}
          onSave={(s) => {
            update('image_zoom', s.zoom);
            update('image_pos_x', s.pos_x);
            update('image_pos_y', s.pos_y);
            update('image_fit_mode', s.fit_mode);
            setShowImageEditor(false);
          }}
          onCancel={() => setShowImageEditor(false)}
        />
      )}
      {showPreview && <PackagePreview pkg={previewPkg} onClose={() => setShowPreview(false)} />}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
      <h2 className="text-sm font-bold text-foreground">{title}</h2>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="text-xs font-semibold text-foreground mb-1.5 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30"
      />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 2 }) {
  return (
    <div>
      <label className="text-xs font-semibold text-foreground mb-1.5 block">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-xs font-semibold text-foreground mb-1.5 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
      <label className="text-xs font-semibold text-foreground">{label}</label>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors ${value ? 'bg-[#2E7D32]' : 'bg-gray-300'}`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}