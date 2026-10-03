import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Check, X } from 'lucide-react';
import { getAllVariants, getActiveAddons, formatNaira } from '@/lib/variantPricing';

export default function VariantPickerSheet({ product, open, onOpenChange, onAdd }) {
  const variants = product ? getAllVariants(product).filter((v) => v.stock_status !== 'out_of_stock') : [];
  const activeAddons = product ? getActiveAddons(product) : [];
  const hasAddons = activeAddons.length > 0;
  const hasMultipleVariants = variants.length > 1;

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState(new Set());
  const [addingId, setAddingId] = useState(null);
  const [justAdded, setJustAdded] = useState(false);
  const [error, setError] = useState(null);
  const timers = useRef([]);

  useEffect(() => {
    return () => timers.current.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (open) {
      setAddingId(null);
      setJustAdded(false);
      setError(null);
      setSelectedVariant(variants.length === 1 ? variants[0] : null);
      setSelectedAddonIds(new Set());
    }
  }, [open]);

  if (!product || !open) return null;

  const toggleAddon = (addonId) => {
    setSelectedAddonIds((prev) => {
      const next = new Set(prev);
      if (next.has(addonId)) next.delete(addonId);
      else next.add(addonId);
      return next;
    });
  };

  const selectedAddons = activeAddons.filter((a) => selectedAddonIds.has(a.id));
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + (a.price || 0), 0);

  const handleAddToCart = () => {
    if (addingId || justAdded) return;
    if (hasMultipleVariants && !selectedVariant) return;
    setError(null);
    setAddingId('cart');
    try {
      onAdd(selectedVariant, selectedAddons);
      setAddingId(null);
      setJustAdded(true);
      const t1 = setTimeout(() => onOpenChange(false), 650);
      timers.current.push(t1);
    } catch (e) {
      setAddingId(null);
      setError('Could not add to cart. Please try again.');
    }
  };

  // If no add-ons: keep the tap-to-add behavior for variants (existing UX)
  const handleVariantTap = (variant) => {
    if (hasAddons) {
      setSelectedVariant(variant);
      return;
    }
    if (addingId || justAdded) return;
    setError(null);
    setAddingId(variant.label);
    try {
      onAdd(variant, []);
      setAddingId(null);
      setJustAdded(true);
      const t1 = setTimeout(() => onOpenChange(false), 650);
      timers.current.push(t1);
    } catch (e) {
      setAddingId(null);
      setError('Could not add to cart. Please try again.');
    }
  };

  const currentPrice = selectedVariant
    ? selectedVariant.price
    : variants.length === 0
      ? product.price
      : 0;
  const totalPrice = currentPrice + addonsTotal;
  const canAddToCart = !hasMultipleVariants || selectedVariant;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-[2px]"
        onClick={() => !addingId && onOpenChange(false)}
      />

      <div className="relative w-full max-w-md rounded-t-3xl bg-white dark:bg-zinc-900 border-t border-x border-white/50 dark:border-zinc-700 shadow-2xl flex flex-col max-h-[75vh] animate-slideUp">
        {/* Header */}
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
            <p className="text-[11px] text-muted-foreground leading-tight">
              {hasAddons ? 'Choose options & add-ons' : 'Choose a quantity'}
            </p>
          </div>
          <button
            onClick={() => !addingId && onOpenChange(false)}
            className="w-11 h-11 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
          >
            <X className="w-3.5 h-3.5 text-gray-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-3 py-2 space-y-1 overflow-y-auto flex-1">
          {/* Variant selection (only if multiple) */}
          {hasMultipleVariants && (
            <>
              <p className="text-xs font-semibold text-muted-foreground px-1 pt-1 pb-0.5">Select size/variant</p>
              {variants.map((v, idx) => {
                const isSelected = selectedVariant?.label === v.label;
                const isDisabled = addingId !== null || justAdded;
                return (
                  <button
                    key={idx}
                    disabled={isDisabled}
                    onClick={() => handleVariantTap(v)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-3 rounded-xl border transition-all active:scale-[0.99] ${
                      isSelected
                        ? 'border-[#2E7D32] dark:border-[#5FCF65] bg-[#E8F5E9] dark:bg-[#1B3A1F]'
                        : 'border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04]'
                    } ${isDisabled ? 'opacity-50' : ''}`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'border-[#2E7D32] dark:border-[#5FCF65] bg-[#2E7D32] dark:bg-[#5FCF65]' : 'border-gray-300 dark:border-zinc-600'
                    }`}>
                      {isSelected && <Check className="w-2.5 h-2.5 text-white dark:text-zinc-900" strokeWidth={3} />}
                    </div>
                    <span className="text-sm font-medium flex-1 text-left text-foreground">{v.label}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-[#2E7D32] dark:text-[#5FCF65]">{formatNaira(v.price)}</span>
                      {v.original_price > 0 && v.original_price > v.price && (
                        <span className="text-[10px] text-muted-foreground line-through block leading-tight">{formatNaira(v.original_price)}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {/* Add-ons section */}
          {hasAddons && (
            <>
              <p className="text-xs font-semibold text-muted-foreground px-1 pt-3 pb-0.5">Would you like us to prepare it for you?</p>
              {activeAddons.map((addon) => {
                const isSelected = selectedAddonIds.has(addon.id);
                const isDisabled = addingId !== null || justAdded;
                return (
                  <button
                    key={addon.id}
                    disabled={isDisabled}
                    onClick={() => toggleAddon(addon.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-3 rounded-xl border transition-all active:scale-[0.99] text-left ${
                      isSelected
                        ? 'border-[#2E7D32] dark:border-[#5FCF65] bg-[#E8F5E9] dark:bg-[#1B3A1F]'
                        : 'border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04]'
                    } ${isDisabled ? 'opacity-50' : ''}`}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'border-[#2E7D32] dark:border-[#5FCF65] bg-[#2E7D32] dark:bg-[#5FCF65]' : 'border-gray-300 dark:border-zinc-600'
                    }`}>
                      {isSelected && <Check className="w-2.5 h-2.5 text-white dark:text-zinc-900" strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground block">{addon.name}</span>
                      {addon.description && (
                        <span className="text-[11px] text-muted-foreground line-clamp-1">{addon.description}</span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-[#2E7D32] dark:text-[#5FCF65] shrink-0">
                      {addon.price === 0 ? 'Free' : formatNaira(addon.price)}
                    </span>
                  </button>
                );
              })}
            </>
          )}

          {error && <p className="text-xs text-red-500 dark:text-red-400 text-center py-2">{error}</p>}
        </div>

        {/* Add to Cart button (only when product has add-ons) */}
        {hasAddons && (
          <div className="px-3.5 pb-3.5 pt-2 border-t border-black/5 dark:border-white/10">
            <button
              onClick={handleAddToCart}
              disabled={addingId !== null || justAdded || !canAddToCart}
              className="w-full h-12 rounded-2xl bg-[#2E7D32] dark:bg-[#5FCF65] text-white dark:text-zinc-900 font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
            >
              {justAdded ? (
                <><Check className="w-4 h-4" /> Added!</>
              ) : (
                <>Add to Cart · {formatNaira(totalPrice)}</>
              )}
            </button>
          </div>
        )}

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