import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ProductCardSurface from '@/components/product/ProductCardSurface';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import VariantPickerSheet from '@/components/product/VariantPickerSheet';
import { getDisplayPrice, getActiveVariants, getSingleVariant, getActiveAddons, buildCartItem } from '@/lib/variantPricing';

export default function ProductCard({ product, onImageClick, showOriginalPrice = true, showDiscount = true, respectComingSoon = true, animated = true }) {
  const { addItem } = useCart();
  const { toggleItem, isWishlisted } = useWishlist();
  const [sheetOpen, setSheetOpen] = useState(false);
  const wished = isWishlisted(product.id);
  const comingSoon = respectComingSoon && product.status === 'coming_soon';
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
    const hasAddons = getActiveAddons(product).length > 0;
    if (activeVariants.length > 1 || hasAddons) {
      setSheetOpen(true);
    } else if (singleVariant) {
      addItem(buildCartItem(product, singleVariant));
    } else {
      addItem(product);
    }
  };

  return (
    <motion.div
      initial={animated ? { opacity: 0, y: 12 } : false}
      whileInView={animated ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="min-w-0"
    >
      <ProductCardSurface product={product} priceInfo={priceInfo} originalPrice={showOriginalPrice ? effectiveOriginal : 0}
        discount={showDiscount ? discount : 0} comingSoon={comingSoon} wished={wished}
        onImageClick={onImageClick} onWishlist={() => toggleItem(product)} onAdd={handleAdd} />
      <VariantPickerSheet
        product={product}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onAdd={(variant, addons) => addItem(buildCartItem(product, variant, addons))}
      />
    </motion.div>
  );
}