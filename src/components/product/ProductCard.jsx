import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import VariantPickerSheet from '@/components/product/VariantPickerSheet';
import { getDisplayPrice, getActiveVariants, getSingleVariant, buildCartItem } from '@/lib/variantPricing';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { toggleItem, isWishlisted } = useWishlist();
  const [sheetOpen, setSheetOpen] = useState(false);
  const wished = isWishlisted(product.id);
  const comingSoon = product.status === 'coming_soon';
  const priceInfo = getDisplayPrice(product);
  const activeVariants = getActiveVariants(product);
  const singleVariant = getSingleVariant(product);
  const effectivePrice = singleVariant ? singleVariant.price : product.price;
  const effectiveOriginal = singleVariant ? singleVariant.original_price : product.original_price;
  const discount = effectiveOriginal && !comingSoon
    ? Math.round((1 - effectivePrice / effectiveOriginal) * 100)
    : 0;

  const handleAdd = () => {
    if (comingSoon) return;
    if (activeVariants.length > 1) {
      setSheetOpen(true);
    } else if (singleVariant) {
      addItem(buildCartItem(product, singleVariant));
    } else {
      addItem(product);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col h-full"
    >
      <div className="relative aspect-square bg-gray-50">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#E8F5E9]">
            <ShoppingBag className="w-8 h-8 text-[#2E7D32]/40" />
          </div>
        )}
        {comingSoon ? (
          <span className="absolute top-1.5 left-1.5 bg-gray-700/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            Coming Soon
          </span>
        ) : (
          discount > 0 && (
            <span className="absolute top-1.5 left-1.5 bg-[#2E7D32] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              -{discount}%
            </span>
          )
        )}
        <button
          onClick={() => toggleItem(product)}
          className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm active:scale-90 transition-transform"
        >
          <Heart
            className={`w-3.5 h-3.5 ${wished ? 'fill-[#2E7D32] text-[#2E7D32]' : 'text-gray-400'}`}
          />
        </button>
      </div>
      <div className="p-2 flex flex-col flex-1">
        <h3 className="text-[11px] font-semibold text-card-foreground leading-tight line-clamp-2 mb-1">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-auto gap-1">
          {comingSoon ? (
            <span className="text-[10px] font-bold text-gray-500">Coming Soon</span>
          ) : (
            <div className="min-w-0">
              <span className={`font-bold text-[#2E7D32] ${priceInfo.isRange ? 'text-[10px]' : 'text-[11px]'} block leading-tight`}>
                {priceInfo.text}
              </span>
              {!priceInfo.isRange && effectiveOriginal && (
                <span className="text-[9px] text-gray-400 line-through block leading-tight">
                  ₦{effectiveOriginal.toLocaleString()}
                </span>
              )}
            </div>
          )}
          <button
            onClick={handleAdd}
            disabled={comingSoon}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 flex-shrink-0 ${
              comingSoon ? 'bg-gray-200 cursor-not-allowed' : 'bg-[#2E7D32] hover:bg-[#1B5E20]'
            }`}
          >
            <Plus
              className={`w-3.5 h-3.5 ${comingSoon ? 'text-gray-400' : 'text-white'}`}
              strokeWidth={2.5}
            />
          </button>
        </div>
      </div>
      <VariantPickerSheet
        product={product}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onAdd={(variant) => addItem(buildCartItem(product, variant))}
      />
    </motion.div>
  );
}