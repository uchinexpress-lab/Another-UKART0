import React, { useState } from 'react';
import { Plus, Trash2, Upload, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SheetSelect from '@/components/SheetSelect';

export default function OptionalItemsEditor({ items, onChange, products }) {
  const [newItem, setNewItem] = useState({ name: '', product_id: '', price: 0, active: true });

  const add = () => {
    if (!newItem.name.trim()) return;
    onChange([...items, { ...newItem }]);
    setNewItem({ name: '', product_id: '', price: 0, active: true });
  };
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));
  const update = (idx, field, value) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };
  const uploadImage = async (idx, file) => {
    const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
    update(idx, 'image', file_url);
  };

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="p-2.5 rounded-xl bg-muted/50 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {item.image ? (
                <div className="relative w-full h-full">
                  <img src={item.image} alt="" className="w-full h-full object-contain" />
                  <button onClick={() => update(idx, 'image', '')} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/50 text-white flex items-center justify-center"><X className="w-2.5 h-2.5" /></button>
                </div>
              ) : (
                <label className="w-full h-full flex items-center justify-center cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-muted-foreground" />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(idx, f); }} />
                </label>
              )}
            </div>
            <input type="text" value={item.name || ''} onChange={(e) => update(idx, 'name', e.target.value)} placeholder="Optional item name" className="flex-1 px-2 py-1.5 rounded-lg border border-input bg-background text-xs" />
            <button onClick={() => remove(idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center gap-2 pl-12">
            <SheetSelect value={item.product_id || ''} onChange={(v) => update(idx, 'product_id', v)} placeholder="Link to product (optional)" title="Link product" triggerClassName="flex-1 px-2 py-1.5 flex items-center justify-between rounded-lg border border-input bg-background text-xs" options={products.map((p) => ({ value: p.id, label: p.name }))} />
            <input type="number" value={item.price || 0} onChange={(e) => update(idx, 'price', parseFloat(e.target.value) || 0)} placeholder="Price" className="w-20 px-2 py-1.5 rounded-lg border border-input bg-background text-xs" />
            <button onClick={() => update(idx, 'active', !item.active)} className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${item.active ? 'bg-[#2E7D32]' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${item.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2 p-2 rounded-xl border border-dashed border-border">
        <input type="text" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="Add optional item..." className="flex-1 px-2 py-1.5 rounded-lg border border-input bg-background text-xs" onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button onClick={add} className="w-8 h-8 rounded-lg bg-[#2E7D32] text-white flex items-center justify-center"><Plus className="w-4 h-4" /></button>
      </div>
    </div>
  );
}