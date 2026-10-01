import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Check, X } from 'lucide-react';
import { getAllVariants, formatNaira } from '@/lib/variantPricing';

export default function VariantPickerSheet({ product, open, onOpenChange, onAdd }) {
  const variants = product ? getAllVariants(product).filter((v) => v.stock_status !== 'out_of_stock') : [];
  const [addingId, setAddingId] = useState(null);
  const [justAdded, setJustAdded] = useState(false);
  const [error, setError] = useState(null);
  const timers = useRef([]);

  // Clear any pending timers on unmount
  useEffect(() => {
    return () => timers.current.forEach(clearTimeout);
  }, []);

  // Reset state when sheet opens
  useEffect(() => {
    if (open) {
      setAddingId(null);
      setJustAdded(false);
      setError(null);
    }
  }, [open]);

  if (!product || !open) return null;

  const handleSelect = (variant) => {
    if (addingId || justAdded) return; // prevent double-tap
    setError(null);
    setAddingId(variant.label);
    try {
      onAdd(variant);
      setAddingId(null);
      setJustAdded(true);
      // Brief confirmation, then close
      const t1 = setTimeout(() => {
        onOpenChange(false);
      }, 650);
      timers.current.push(t1);
    } catch (e) {
      setAddingId(null);
      setError('Could not add to cart. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-[2px]"
        onClick={() => !addingId && onOpenChange(false)}
      />

      {/* Bottom sheet — theme-aware */}
      <div className="relative w-full max-w-md rounded-t-3xl bg-white dark:bg-zinc-900 border-t border-x border-white/50 dark:border-zinc-700 shadow-2xl flex flex-col max-h-[55vh] animate-slideUp">
        {/* Compact header */}
        <div className="flex items-center gap-2.5 px-3.5 pt-3 pb-2.5 border-b border-black/5 dark:border-white/10">
          <div className="w-12 h-12 rounded-lg bg-gray-50 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#E8F5E9] dark:bg-[#1B3A1F]">
                <ShoppingBag className="w-5 h-5 text-[#2E7D32]/40 dark:text-[#5FCF65]/60" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground line-clamp-1 leading-tight">{product.name}</h3>
            <p className="text-[11px] text-muted-foreground leading-tight">Choose a quantity</p>
          </div>
          <button
            onClick={() => !addingId && onOpenChange(false)}
            className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
          >
            <X className="w-3.5 h-3.5 text-gray-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Variant list — each row is the tap target */}
        <div className="px-3 py-2 space-y-1 overflow-y-auto flex-1">
          {variants.map((v, idx) => {
            const isAdding = addingId === v.label;
            const isDisabled = (addingId !== null && !isAdding) || justAdded;
            return (
              <button
                key={idx}
                disabled={isDisabled}
                onClick={() => handleSelect(v)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-3 rounded-xl border transition-all active:scale-[0.99] ${
                  justAdded && isAdding
                    ? 'border-[#2E7D32] dark:border-[#5FCF65] bg-[#E8F5E9] dark:bg-[#1B3A1F]'
                    : 'border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04]'
                } ${isDisabled ? 'opacity-50' : ''}`}
              >
                {/* Check indicator */}
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    justAdded && isAdding
                      ? 'border-[#2E7D32] dark:border-[#5FCF65] bg-[#2E7D32] dark:bg-[#5FCF65]'
                      : 'border-gray-300 dark:border-zinc-600'
                  }`}
                >
                  {justAdded && isAdding && <Check className="w-2.5 h-2.5 text-white dark:text-zinc-900" strokeWidth={3} />}
                </div>

                {/* Variant label */}
                <span className="text-sm font-medium flex-1 text-left text-foreground">
                  {v.label}
                </span>

                {/* Price */}
                <div className="text-right">
                  <span className="text-sm font-bold text-[#2E7D32] dark:text-[#5FCF65]">
                    {formatNaira(v.price)}
                  </span>
                  {v.original_price > 0 && v.original_price > v.price && (
                    <span className="text-[10px] text-muted-foreground line-through block leading-tight">
                      {formatNaira(v.original_price)}
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {/* Error message */}
          {error && (
            <p className="text-xs text-red-500 dark:text-red-400 text-center py-2">{error}</p>
          )}
        </div>

        {/* Added-to-cart confirmation overlay */}
        {justAdded && (
          <div className="absolute inset-0 rounded-t-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-2 animate-slideUp">
              <div className="w-12 h-12 rounded-full bg-[#2E7D32] dark:bg-[#5FCF65] flex items-center justify-center">
                <Check className="w-6 h-6 text-white dark:text-zinc-900" strokeWidth={3} />
              </div>
              <p className="text-sm font-bold text-foreground">Added to Cart</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}