import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';

export default function AddonsEditor({ addons, onChange }) {
  const [newAddon, setNewAddon] = useState({ name: '', description: '', price: 0 });

  const generateId = () => `addon_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const add = () => {
    if (!newAddon.name.trim()) return;
    const addon = {
      id: generateId(),
      name: newAddon.name.trim(),
      description: newAddon.description.trim(),
      price: Number(newAddon.price) || 0,
      active: true,
      display_order: addons.length,
    };
    onChange([...addons, addon]);
    setNewAddon({ name: '', description: '', price: 0 });
  };

  const remove = (idx) => onChange(addons.filter((_, i) => i !== idx));

  const update = (idx, field, value) => {
    const next = [...addons];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };

  const move = (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= addons.length) return;
    const next = [...addons];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    next.forEach((a, i) => (a.display_order = i));
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {addons.map((addon, idx) => (
        <div key={addon.id || idx} className="p-3 rounded-xl bg-muted/50 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
                className="text-muted-foreground disabled:opacity-30"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => move(idx, 1)}
                disabled={idx === addons.length - 1}
                className="text-muted-foreground disabled:opacity-30"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              type="text"
              value={addon.name || ''}
              onChange={(e) => update(idx, 'name', e.target.value)}
              placeholder="Add-on name (e.g. Cut, Slice, Grind)"
              className="flex-1 px-2.5 py-2 rounded-lg border border-input bg-background text-sm"
            />
            <button
              onClick={() => remove(idx)}
              className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
          <div className="flex items-center gap-2 pl-7">
            <input
              type="text"
              value={addon.description || ''}
              onChange={(e) => update(idx, 'description', e.target.value)}
              placeholder="Description (optional)"
              className="flex-1 px-2.5 py-2 rounded-lg border border-input bg-background text-xs"
            />
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs text-muted-foreground">₦</span>
              <input
                type="number"
                value={addon.price || 0}
                onChange={(e) => update(idx, 'price', parseFloat(e.target.value) || 0)}
                placeholder="0 = Free"
                className="w-20 px-2.5 py-2 rounded-lg border border-input bg-background text-sm"
              />
            </div>
            <button
              onClick={() => update(idx, 'active', !addon.active)}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                addon.active !== false ? 'bg-[#2E7D32]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  addon.active !== false ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          {addon.price === 0 && (
            <p className="pl-7 text-[11px] text-[#2E7D32] font-medium">Displayed as "Free" to customers</p>
          )}
        </div>
      ))}

      {/* Add new add-on */}
      <div className="p-3 rounded-xl border border-dashed border-border space-y-2">
        <input
          type="text"
          value={newAddon.name}
          onChange={(e) => setNewAddon({ ...newAddon, name: e.target.value })}
          placeholder="Add-on name (e.g. Cut, Slice, Grind)"
          className="w-full px-2.5 py-2 rounded-lg border border-input bg-background text-sm"
        />
        <input
          type="text"
          value={newAddon.description}
          onChange={(e) => setNewAddon({ ...newAddon, description: e.target.value })}
          placeholder="Description (optional)"
          className="w-full px-2.5 py-2 rounded-lg border border-input bg-background text-xs"
        />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 flex-1">
            <span className="text-xs text-muted-foreground">₦</span>
            <input
              type="number"
              value={newAddon.price || 0}
              onChange={(e) => setNewAddon({ ...newAddon, price: parseFloat(e.target.value) || 0 })}
              placeholder="0 = Free"
              className="flex-1 px-2.5 py-2 rounded-lg border border-input bg-background text-sm"
            />
          </div>
          <button
            onClick={add}
            disabled={!newAddon.name.trim()}
            className="px-4 py-2 rounded-lg bg-[#2E7D32] text-white text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Add Add-on
          </button>
        </div>
      </div>
    </div>
  );
}