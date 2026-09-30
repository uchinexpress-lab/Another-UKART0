import React, { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Upload, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function IngredientsEditor({ items, onChange }) {
  const [newItem, setNewItem] = useState({ name: '', quantity: '', unit: '' });

  const add = () => {
    if (!newItem.name.trim()) return;
    onChange([...items, { ...newItem }]);
    setNewItem({ name: '', quantity: '', unit: '' });
  };
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));
  const update = (idx, field, value) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };
  const move = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };
  const uploadImage = async (idx, file) => {
    const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
    update(idx, 'image', file_url);
  };

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-muted/50">
          <div className="flex flex-col gap-0.5">
            <button onClick={() => move(idx, -1)} className="text-muted-foreground hover:text-foreground"><ChevronUp className="w-3.5 h-3.5" /></button>
            <button onClick={() => move(idx, 1)} className="text-muted-foreground hover:text-foreground"><ChevronDown className="w-3.5 h-3.5" /></button>
          </div>
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
          <input type="text" value={item.name || ''} onChange={(e) => update(idx, 'name', e.target.value)} placeholder="Ingredient name" className="flex-1 px-2 py-1.5 rounded-lg border border-input bg-background text-xs" />
          <input type="text" value={item.quantity || ''} onChange={(e) => update(idx, 'quantity', e.target.value)} placeholder="Qty" className="w-14 px-2 py-1.5 rounded-lg border border-input bg-background text-xs" />
          <input type="text" value={item.unit || ''} onChange={(e) => update(idx, 'unit', e.target.value)} placeholder="Unit" className="w-16 px-2 py-1.5 rounded-lg border border-input bg-background text-xs" />
          <button onClick={() => remove(idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
      <div className="flex items-center gap-2 p-2 rounded-xl border border-dashed border-border">
        <input type="text" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="Add ingredient..." className="flex-1 px-2 py-1.5 rounded-lg border border-input bg-background text-xs" onKeyDown={(e) => e.key === 'Enter' && add()} />
        <input type="text" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })} placeholder="Qty" className="w-14 px-2 py-1.5 rounded-lg border border-input bg-background text-xs" />
        <input type="text" value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} placeholder="Unit" className="w-16 px-2 py-1.5 rounded-lg border border-input bg-background text-xs" />
        <button onClick={add} className="w-8 h-8 rounded-lg bg-[#2E7D32] text-white flex items-center justify-center"><Plus className="w-4 h-4" /></button>
      </div>
    </div>
  );
}