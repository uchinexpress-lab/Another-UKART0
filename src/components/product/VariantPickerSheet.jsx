import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ShoppingBag, Check } from 'lucide-react';
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

  if (!product) return null;

  const handleAdd = () => {
    if (!selected || selected.stock_status === 'out_of_stock') return;
    onAdd(selected);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="p-0 rounded-t-3xl max-h-[85vh] flex flex-col">
        {/* Product header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="w-14 h-14 rounded-xl bg-gray-50 overflow-hidden flex-shrink-0">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#E8F5E9]">
                <ShoppingBag className="w-6 h-6 text-[#2E7D32]/40" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 pr-8">
            <h3 className="text-sm font-bold text-foreground line-clamp-1">{product.name}</h3>
            <p className="text-xs text-muted-foreground">Choose a quantity</p>
          </div>
        </div>

        {/* Variant list */}
        <div className="p-3 space-y-2 overflow-y-auto flex-1">
          {variants.map((v, idx) => {
            const isOOS = v.stock_status === 'out_of_stock';
            const isSelected = selected?.label === v.label;
            return (
              <button
                key={idx}
                disabled={isOOS}
                onClick={() => setSelected(v)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                  isSelected ? 'border-[#2E7D32] bg-[#E8F5E9]' : 'border-border bg-card'
                } ${isOOS ? 'opacity-50' : 'active:scale-[0.98]'}`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-[#2E7D32] bg-[#2E7D32]' : 'border-gray-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                  <span className="text-sm font-semibold text-foreground">{v.label}</span>
                  {isOOS && (
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">
                      Sold Out
                    </span>
                  )}
                </div>
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

        {/* Add button */}
        <div className="p-4 bg-background border-t border-border">
          <button
            onClick={handleAdd}
            disabled={!selected || selected.stock_status === 'out_of_stock'}
            className="w-full h-12 rounded-2xl bg-[#2E7D32] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            Add to Cart · {selected ? formatNaira(selected.price) : '—'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}