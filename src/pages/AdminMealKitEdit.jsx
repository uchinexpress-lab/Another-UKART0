import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Upload, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AdminNav from '@/components/admin/AdminNav';
import BannerImageEditor from '@/components/admin/BannerImageEditor';
import IngredientsEditor from '@/components/admin/IngredientsEditor';
import CookingStepsEditor from '@/components/admin/CookingStepsEditor';
import OptionalItemsEditor from '@/components/admin/OptionalItemsEditor';
import MealKitPreview from '@/components/admin/MealKitPreview';
import { useToast } from '@/components/ui/use-toast';
import SheetSelect from '@/components/SheetSelect';

const SERVES_OPTIONS = ['2 servings', '3 servings', '4 servings', '4–6 servings', '6 servings', 'Custom'];

export default function AdminMealKitEdit() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [allProducts, setAllProducts] = useState([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [originalTotal, setOriginalTotal] = useState(0);
  const [active, setActive] = useState(true);
  const [serves, setServes] = useState('');
  const [customServes, setCustomServes] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [badge, setBadge] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [image, setImage] = useState('');
  const [imageSettings, setImageSettings] = useState({ zoom: 1, pos_x: 50, pos_y: 50, fit_mode: 'contain' });
  const [items, setItems] = useState([]);
  const [cookingSteps, setCookingSteps] = useState([]);
  const [optionalItems, setOptionalItems] = useState([]);

  useEffect(() => {
    if (isNew) return;
    base44.entities.Package.get(id).then((pkg) => {
      setName(pkg.name || '');
      setDescription(pkg.description || '');
      setTotalPrice(pkg.total_price || 0);
      setOriginalTotal(pkg.original_total || 0);
      setActive(pkg.active ?? true);
      setServes(pkg.serves || '');
      setDisplayOrder(pkg.display_order || 0);
      setBadge(pkg.badge || '');
      setDeliveryTime(pkg.delivery_time || '');
      setPrepTime(pkg.prep_time || '');
      setImage(pkg.image || '');
      setImageSettings({
        zoom: pkg.image_zoom || 1,
        pos_x: pkg.image_pos_x || 50,
        pos_y: pkg.image_pos_y || 50,
        fit_mode: pkg.image_fit_mode || 'contain',
      });
      setItems(pkg.items || []);
      setCookingSteps(pkg.cooking_steps || []);
      setOptionalItems(pkg.optional_items || []);
      setLoading(false);
    });
    base44.entities.Product.list().then(setAllProducts);
  }, [id, isNew]);

  const handleImageUpload = async (file) => {
    const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
    setImage(file_url);
    setShowImageEditor(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast({ title: 'Name is required', variant: 'destructive' }); return; }
    setSaving(true);
    const finalServes = serves === 'Custom' ? customServes : serves;
    const data = {
      name: name.trim(),
      description,
      group: 'meal_kits',
      total_price: totalPrice,
      original_total: originalTotal || null,
      active,
      serves: finalServes || null,
      display_order: displayOrder,
      badge: badge || null,
      delivery_time: deliveryTime || null,
      prep_time: prepTime || null,
      image,
      image_zoom: imageSettings.zoom,
      image_pos_x: imageSettings.pos_x,
      image_pos_y: imageSettings.pos_y,
      image_fit_mode: imageSettings.fit_mode,
      items,
      cooking_steps: cookingSteps,
      optional_items: optionalItems,
    };
    try {
      if (isNew) {
        await base44.entities.Package.create(data);
      } else {
        await base44.entities.Package.update(id, data);
      }
      toast({ title: 'Meal kit saved successfully' });
      navigate('/admin/meal-kits');
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' });
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-gray-200 border-t-[#2E7D32] rounded-full animate-spin" /></div>;

  const previewKit = {
    name, description, total_price: totalPrice, original_total: originalTotal,
    serves: serves === 'Custom' ? customServes : serves, prep_time: prepTime,
    image, items, cooking_steps: cookingSteps, optional_items: optionalItems,
  };

  const bgSize = imageSettings.zoom > 1
    ? `${imageSettings.zoom * 100}%`
    : imageSettings.fit_mode === 'contain' ? 'contain' : 'cover';

  return (
    <div className="px-4 pt-2 pb-24">
      <AdminNav />
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/admin/meal-kits')} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"><ArrowLeft className="w-4 h-4" /></button>
        <h1 className="text-xl font-bold text-foreground">{isNew ? 'New Meal Kit' : 'Edit Meal Kit'}</h1>
      </div>

      <div className="space-y-4 max-w-lg mx-auto">
        <Section title="Basic Information">
          <Input label="Meal Kit Name" value={name} onChange={setName} placeholder="e.g. Egusi Soup Kit" />
          <TextArea label="Description" value={description} onChange={setDescription} placeholder="Brief description..." />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Price (₦)" type="number" value={totalPrice} onChange={(v) => setTotalPrice(parseFloat(v) || 0)} />
            <Input label="Old Price (₦, optional)" type="number" value={originalTotal} onChange={(v) => setOriginalTotal(parseFloat(v) || 0)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Serving Size</label>
              <SheetSelect
                value={serves}
                onChange={setServes}
                options={[{ value: '', label: 'Select...' }, ...SERVES_OPTIONS.map(o => ({ value: o, label: o }))]}
                title="Serving Size"
                triggerClassName="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm flex items-center justify-between"
              />
            </div>
            {serves === 'Custom' && <Input label="Custom Serving" value={customServes} onChange={setCustomServes} placeholder="e.g. 8 servings" />}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Display Order" type="number" value={displayOrder} onChange={(v) => setDisplayOrder(parseInt(v) || 0)} />
            <Input label="Badge (optional)" value={badge} onChange={setBadge} placeholder="e.g. Bestseller" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Delivery Time" value={deliveryTime} onChange={setDeliveryTime} placeholder="e.g. Same day" />
            <Input label="Prep Time" value={prepTime} onChange={setPrepTime} placeholder="e.g. 30 mins" />
          </div>
          <Toggle label="Active (visible to customers)" value={active} onChange={setActive} />
        </Section>

        <Section title="Main Image">
          {image ? (
            <div className="space-y-2">
              <div className="relative w-full overflow-hidden rounded-xl bg-gray-100" style={{ aspectRatio: '4/3' }}>
                <div className="absolute inset-0" style={{
                  backgroundImage: `url(${image})`,
                  backgroundSize: bgSize,
                  backgroundPosition: `${imageSettings.pos_x}% ${imageSettings.pos_y}%`,
                  backgroundRepeat: 'no-repeat',
                }} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowImageEditor(true)} className="flex-1 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:bg-accent">Edit Image</button>
                <label className="flex-1 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:bg-accent text-center cursor-pointer">
                  Replace
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
                </label>
              </div>
            </div>
          ) : (
            <label className="w-full py-8 rounded-xl border-2 border-dashed border-border hover:border-[#2E7D32]/40 hover:bg-[#2E7D32]/5 transition-colors flex flex-col items-center gap-2 cursor-pointer">
              <Upload className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">Click to upload image</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
            </label>
          )}
        </Section>

        <Section title="Ingredients">
          <IngredientsEditor items={items} onChange={setItems} />
        </Section>

        <Section title="Optional Add-ons">
          <OptionalItemsEditor items={optionalItems} onChange={setOptionalItems} products={allProducts} />
        </Section>

        <Section title="Cooking Instructions">
          <CookingStepsEditor steps={cookingSteps} onChange={setCookingSteps} />
        </Section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-3 flex gap-2 max-w-lg mx-auto z-30">
        <button onClick={() => setShowPreview(true)} className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground text-sm font-semibold flex items-center justify-center gap-1.5">
          <Eye className="w-4 h-4" /> Preview
        </button>
        <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#2E7D32] text-white text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
        </button>
      </div>

      {showImageEditor && image && (
        <BannerImageEditor
          imageUrl={image}
          aspectRatio={4 / 3}
          initialSettings={imageSettings}
          onSave={(s) => { setImageSettings(s); setShowImageEditor(false); }}
          onCancel={() => setShowImageEditor(false)}
        />
      )}
      {showPreview && <MealKitPreview kit={previewKit} onClose={() => setShowPreview(false)} />}
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
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30" />
    </div>
  );
}
function TextArea({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-xs font-semibold text-foreground mb-1.5 block">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30" />
    </div>
  );
}
function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
      <label className="text-xs font-semibold text-foreground">{label}</label>
      <button onClick={() => onChange(!value)} className={`relative w-10 h-5 rounded-full transition-colors ${value ? 'bg-[#2E7D32]' : 'bg-gray-300'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}