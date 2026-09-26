import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const newItem = () => ({ name: '', price: 0, available: true, image: '' });

export default function OptionalItemsEditor({ items, onChange }) {
  const add = () => onChange([...(items || []), newItem()]);
  const update = (i, patch) => {
    const next = [...(items || [])];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const remove = (i) => onChange((items || []).filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2.5">
      {(items || []).map((it, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Add-on {i + 1}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => update(i, { available: !it.available })}
                className={`relative w-9 h-5 rounded-full transition-colors ${it.available ? 'bg-[#2E7D32]' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${it.available ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
              <button onClick={() => remove(i)} className="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
            </div>
          </div>
          <input
            value={it.name}
            onChange={(e) => update(i, { name: e.target.value })}
            placeholder="Add-on name (e.g. Chicken)"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2E7D32]"
          />
          <input
            type="number"
            value={it.price}
            onChange={(e) => update(i, { price: Number(e.target.value) })}
            placeholder="Price (₦)"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2E7D32]"
          />
        </div>
      ))}
      <button
        onClick={add}
        className="w-full py-2.5 rounded-xl border-2 border-dashed border-[#2E7D32]/40 text-[#2E7D32] text-sm font-semibold flex items-center justify-center gap-1.5"
      >
        <Plus className="w-4 h-4" /> Add Optional Item
      </button>
    </div>
  );
}