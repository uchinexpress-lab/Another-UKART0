import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

// Sizes for a meal kit: name + servings + price. Shown to customers as choices.
export default function SizesEditor({ sizes, onChange }) {
  const [draft, setDraft] = useState({ label: '', serves: '', price: '' });

  const add = () => {
    if (!draft.label.trim()) return;
    onChange([
      ...sizes,
      {
        label: draft.label.trim(),
        serves: draft.serves.trim(),
        price: Number(draft.price) || 0,
        available: true,
      },
    ]);
    setDraft({ label: '', serves: '', price: '' });
  };

  const update = (idx, field, value) => {
    const next = [...sizes];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };

  const remove = (idx) => onChange(sizes.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      {sizes.map((size, idx) => (
        <div key={idx} className="p-3 rounded-xl bg-muted/50 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={size.label || ''}
              onChange={(e) => update(idx, 'label', e.target.value)}
              placeholder="Size name (e.g. Small, Family)"
              className="flex-1 px-2.5 py-2 rounded-lg border border-input bg-background text-sm"
            />
            <button
              onClick={() => remove(idx)}
              className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={size.serves || ''}
              onChange={(e) => update(idx, 'serves', e.target.value)}
              placeholder="Servings (e.g. 2 servings)"
              className="flex-1 px-2.5 py-2 rounded-lg border border-input bg-background text-xs"
            />
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs text-muted-foreground">₦</span>
              <input
                type="number"
                value={size.price || 0}
                onChange={(e) => update(idx, 'price', parseFloat(e.target.value) || 0)}
                placeholder="Price"
                className="w-24 px-2.5 py-2 rounded-lg border border-input bg-background text-sm"
              />
            </div>
            <button
              onClick={() => update(idx, 'available', size.available === false)}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                size.available !== false ? 'bg-[#2E7D32]' : 'bg-gray-300'
              }`}
              aria-label="Available"
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  size.available !== false ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      ))}

      <div className="p-3 rounded-xl border border-dashed border-border space-y-2">
        <input
          type="text"
          value={draft.label}
          onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          placeholder="Size name (e.g. Small, Family)"
          className="w-full px-2.5 py-2 rounded-lg border border-input bg-background text-sm"
        />
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={draft.serves}
            onChange={(e) => setDraft({ ...draft, serves: e.target.value })}
            placeholder="Servings (e.g. 2 servings)"
            className="flex-1 px-2.5 py-2 rounded-lg border border-input bg-background text-xs"
          />
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">₦</span>
            <input
              type="number"
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: e.target.value })}
              placeholder="Price"
              className="w-24 px-2.5 py-2 rounded-lg border border-input bg-background text-sm"
            />
          </div>
          <button
            onClick={add}
            disabled={!draft.label.trim()}
            className="px-4 py-2 rounded-lg bg-[#2E7D32] text-white text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}