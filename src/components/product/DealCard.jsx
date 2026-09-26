import React, { useState } from 'react';
import { Heart, Plus } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import VariantPickerSheet from '@/components/product/VariantPickerSheet';
import { getDisplayPrice, getActiveVariants, getSingleVariant, buildCartItem } from '@/lib/variantPricing';

export default function DealCard({ product }) {
  const { addItem } = useCart();
  const { toggleItem, isWishlisted } = useWishlist();
  const [sheetOpen, setSheetOpen] = useState(false);
  const wished = isWishlisted(product.id);
  const priceInfo = getDisplayPrice(product);
  const activeVariants = getActiveVariants(product);
  const singleVariant = getSingleVariant(product);
  const effectivePrice = singleVariant ? singleVariant.price : product.price;
  const effectiveOriginal = singleVariant ? singleVariant.original_price : product.original_price;
  const discount = effectiveOriginal
    ? Math.round((1 - effectivePrice / effectiveOriginal) * 100)
    : 0;

  const handleAdd = () => {
    if (activeVariants.length > 1) {
      setSheetOpen(true);
    } else if (singleVariant) {
      addItem(buildCartItem(product, singleVariant));
    } else {
      addItem(product);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col h-full">
      <div className="relative aspect-[4/3] bg-gray-50">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        {discount > 0 && (
          <span className="absolute top-1.5 left-1.5 bg-[#2E7D32] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}
        <button
          onClick={() => toggleItem(product)}
          className="absolute top-1.5 right-1.5 w-11 h-11 rounded-full bg-white/90 flex items-center justify-center shadow-sm active:scale-90 transition-transform"
        >
          <Heart
            className={`w-4 h-4 ${wished ? 'fill-[#2E7D32] text-[#2E7D32]' : 'text-gray-400'}`}
          />
        </button>
      </div>
      <div className="p-2 flex flex-col flex-1">
        <h3 className="text-xs font-semibold text-card-foreground leading-tight line-clamp-1 mb-1.5">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className={`font-bold text-[#2E7D32] ${priceInfo.isRange ? 'text-[11px]' : 'text-sm'}`}>
              {priceInfo.text}
            </span>
            {!priceInfo.isRange && effectiveOriginal && (
              <span className="text-[11px] text-gray-400 line-through">
                ₦{effectiveOriginal.toLocaleString()}
              </span>
            )}
          </div>
          <button
            onClick={handleAdd}
            className="w-11 h-11 rounded-full bg-[#2E7D32] flex items-center justify-center hover:bg-[#1B5E20] transition-colors flex-shrink-0 active:scale-90"
          >
            <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
          </button>
        </div>
      </div>
      <VariantPickerSheet
        product={product}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onAdd={(variant) => addItem(buildCartItem(product, variant))}
      />
    </div>
  );
}