import React from 'react';
import { Heart, Plus } from 'lucide-react';
import ProductImageFrame from '@/components/product/ProductImageFrame';
import ProductCardInfo from '@/components/product/ProductCardInfo';

export default function ProductCardSurface({ product, priceInfo, originalPrice, discount = 0, comingSoon = false, wished = false, onWishlist, onAdd, onImageClick, children }) {
  return (
    <div data-product-card data-product-id={product.id} className="w-full min-w-0 bg-card rounded-2xl border border-border flex flex-col">
      <ProductImageFrame product={product} onImageClick={onImageClick}>
        {comingSoon ? (
          <span className="absolute top-1.5 left-1.5 bg-foreground/90 text-background text-[10px] font-bold px-1.5 py-0.5 rounded-full">Coming Soon</span>
        ) : discount > 0 && (
          <span className="absolute top-1.5 left-1.5 bg-retail text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">-{discount}%</span>
        )}
        {onWishlist && (
          <button type="button" data-product-wishlist onClick={onWishlist} aria-label={`${wished ? 'Remove' : 'Save'} ${product.name} ${wished ? 'from' : 'to'} wishlist`} aria-pressed={wished} className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-card/90 flex items-center justify-center shadow-sm active:scale-90 transition-transform">
            <Heart className={`w-3.5 h-3.5 ${wished ? 'fill-retail text-retail' : 'text-muted-foreground'}`} />
          </button>
        )}
        {onAdd && (
          <button type="button" data-product-add onClick={onAdd} disabled={comingSoon} aria-label={`Add ${product.name}`} className="absolute right-1.5 bottom-1.5 w-9 h-9 rounded-full bg-retail text-primary-foreground flex items-center justify-center shadow-lg hover:bg-retail-hover active:scale-90 transition-transform disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed">
            <Plus className="w-4 h-4" strokeWidth={2.5} />
          </button>
        )}
      </ProductImageFrame>
      <ProductCardInfo product={product} priceInfo={priceInfo} originalPrice={originalPrice} comingSoon={comingSoon} />
      {children}
    </div>
  );
}