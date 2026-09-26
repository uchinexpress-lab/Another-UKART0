import React, { useState, useEffect } from 'react';
import { ShoppingBag, Check, X } from 'lucide-react';
import { getAllVariants, formatNaira } from '@/lib/variantPricing';

export default function VariantPickerSheet({ product, open, onOpenChange, onAdd }) {
  const variants = product ? getAllVariants(product) : [];
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (open && product) {
      const firstAvailable = variants.find((v) => v.stock_status !== 'out_of_stock');
      setSelected(firstAvailable || null);
    }
  }, [open]); // eslint-disable-line

  if (!product || !open) return null;

  const handleAdd = () => {
    if (!selected || selected.stock_status === 'out_of_stock') return;
    onAdd(selected);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Subtle dark translucent overlay — page stays visible behind */}
      <div
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
        onClick={() => onOpenChange(false)}
      />

      {/* Compact glass bottom sheet */}
      <div className="relative w-full max-w-md rounded-t-3xl bg-white/85 backdrop-blur-xl border-t border-x border-white/50 shadow-2xl flex flex-col max-h-[55vh] animate-slideUp">
        {/* Compact header */}
        <div className="flex items-center gap-2.5 px-3.5 pt-3 pb-2.5 border-b border-black/5">
          <div className="w-12 h-12 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#E8F5E9]">
                <ShoppingBag className="w-5 h-5 text-[#2E7D32]/40" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground line-clamp-1 leading-tight">{product.name}</h3>
            <p className="text-[11px] text-muted-foreground leading-tight">Choose a quantity</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
          >
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        {/* Compact variant list — scrolls if many variants */}
        <div className="px-3 py-2 space-y-1 overflow-y-auto flex-1">
          {variants.map((v, idx) => {
            const isOOS = v.stock_status === 'out_of_stock';
            const isSelected = selected?.label === v.label;
            return (
              <button
                key={idx}
                disabled={isOOS}
                onClick={() => setSelected(v)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl border transition-all ${
                  isSelected ? 'border-[#2E7D32] bg-[#E8F5E9]/70' : 'border-transparent bg-black/[0.03]'
                } ${isOOS ? 'opacity-45' : 'active:scale-[0.99]'}`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'border-[#2E7D32] bg-[#2E7D32]' : 'border-gray-300'
                  }`}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                </div>
                <span className={`text-sm font-medium flex-1 text-left ${isOOS ? 'text-gray-400' : 'text-foreground'}`}>
                  {v.label}
                  {isOOS && <span className="text-[10px] text-red-500 font-semibold ml-1.5">Sold out</span>}
                </span>
                <div className="text-right">
                  <span className={`text-sm font-bold ${isOOS ? 'text-gray-400' : 'text-[#2E7D32]'}`}>
                    {formatNaira(v.price)}
                  </span>
                  {v.original_price > 0 && v.original_price > v.price && !isOOS && (
                    <span className="text-[10px] text-gray-400 line-through block leading-tight">
                      {formatNaira(v.original_price)}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Compact add button */}
        <div className="px-3.5 pb-3 pt-2">
          <button
            onClick={handleAdd}
            disabled={!selected || selected.stock_status === 'out_of_stock'}
            className="w-full h-[52px] rounded-2xl bg-[#2E7D32] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            Add to Cart · {selected ? formatNaira(selected.price) : '—'}
          </button>
        </div>
      </div>
    </div>
  );
}