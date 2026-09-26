import React from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

export const UNIT_OPTIONS = [
  'kg', 'g', 'mg', 'lb', 'oz', 'ml', 'litre', 'cl', 'gallon',
  'bucket', 'cup', 'bottle', 'pack', 'piece', 'crate', 'basket',
  'bag', 'carton', 'bunch', 'tuber',
];

export const computeStatus = (qty, threshold) => {
  const q = Number(qty);
  if (Number.isNaN(q)) return 'in_stock';
  if (q <= 0) return 'out_of_stock';
  const t = Number(threshold) || 0;
  if (t > 0 && q <= t) return 'low_stock';
  return 'in_stock';
};

const STATUS_BADGE = {
  in_stock: 'bg-emerald-100 text-emerald-700',
  low_stock: 'bg-amber-100 text-amber-700',
  out_of_stock: 'bg-red-100 text-red-700',
};
const STATUS_LABEL = {
  in_stock: 'In Stock',
  low_stock: 'Low',
  out_of_stock: 'Out',
};

const newVariant = () => ({
  label: '',
  unit: 'kg',
  quantity: 1,
  price: 0,
  original_price: 0,
  stock_quantity: 0,
  low_stock_threshold: 5,
  stock_status: 'in_stock',
});

export default function VariantEditor({ variants, onChange }) {
  const add = () => onChange([...variants, newVariant()]);
  const update = (i, patch) => {
    const next = [...variants];
    next[i] = { ...next[i], ...patch };
    if ('stock_quantity' in patch || 'low_stock_threshold' in patch) {
      next[i].stock_status = computeStatus(next[i].stock_quantity, next[i].low_stock_threshold);
    }
    onChange(next);
  };
  const remove = (i) => onChange(variants.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= variants.length) return;
    const next = [...variants];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {variants.map((v, i) => {
        const isCustom = !UNIT_OPTIONS.includes(v.unit);
        return (
          <div key={i} className="rounded-xl border border-border bg-card p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">Variant {i + 1}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => move(i, -1)} className="w-6 h-6 rounded-md bg-muted flex items-center justify-center disabled:opacity-30" disabled={i === 0}><ChevronUp className="w-3.5 h-3.5" /></button>
                <button onClick={() => move(i, 1)} className="w-6 h-6 rounded-md bg-muted flex items-center justify-center disabled:opacity-30" disabled={i === variants.length - 1}><ChevronDown className="w-3.5 h-3.5" /></button>
                <button onClick={() => remove(i)} className="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
              </div>
            </div>

            <input
              value={v.label}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="Label (e.g. 500ml, 1kg, Basket)"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2E7D32]"
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">Quantity</label>
                <input
                  type="number"
                  value={v.quantity}
                  onChange={(e) => update(i, { quantity: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 outline-none focus:border-[#2E7D32]"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">Unit</label>
                <select
                  value={isCustom ? 'custom' : v.unit}
                  onChange={(e) => update(i, { unit: e.target.value === 'custom' ? '' : e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 outline-none focus:border-[#2E7D32] bg-card"
                >
                  {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                  <option value="custom">custom…</option>
                </select>
              </div>
            </div>

            {isCustom && (
              <input
                value={v.unit}
                onChange={(e) => update(i, { unit: e.target.value })}
                placeholder="Custom unit (e.g. Paint Bucket)"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2E7D32]"
              />
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">Price (₦)</label>
                <input
                  type="number"
                  value={v.price}
                  onChange={(e) => update(i, { price: Number(e.target.value) })}
                  className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 outline-none focus:border-[#2E7D32]"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">Old price (₦)</label>
                <input
                  type="number"
                  value={v.original_price}
                  onChange={(e) => update(i, { original_price: Number(e.target.value) })}
                  className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 outline-none focus:border-[#2E7D32]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">Stock qty</label>
                <input
                  type="number"
                  value={v.stock_quantity}
                  onChange={(e) => update(i, { stock_quantity: Number(e.target.value) })}
                  className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 outline-none focus:border-[#2E7D32]"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">Low threshold</label>
                <input
                  type="number"
                  value={v.low_stock_threshold}
                  onChange={(e) => update(i, { low_stock_threshold: Number(e.target.value) })}
                  className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 outline-none focus:border-[#2E7D32]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[v.stock_status]}`}>
                {STATUS_LABEL[v.stock_status]}
              </span>
              <select
                value={v.stock_status}
                onChange={(e) => update(i, { stock_status: e.target.value })}
                className="text-[11px] border border-gray-200 rounded-lg px-2 py-1 outline-none bg-card"
              >
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          </div>
        );
      })}
      <button
        onClick={add}
        className="w-full py-2.5 rounded-xl border-2 border-dashed border-[#2E7D32]/40 text-[#2E7D32] text-sm font-semibold flex items-center justify-center gap-1.5"
      >
        <Plus className="w-4 h-4" /> Add Variant
      </button>
    </div>
  );
}