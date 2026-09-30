import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { Image } from '@/components/ui/image';

export default function ProductImageFrame({ product, onImageClick, children }) {
  const image = product.image ? (
    <Image src={product.image} alt={product.name} fittingType="fit" className="absolute inset-0 block w-full h-full object-contain object-center" />
  ) : (
    <div className="absolute inset-0 flex items-center justify-center bg-secondary">
      <ShoppingBag className="w-8 h-8 text-retail/40" />
    </div>
  );

  return (
    <div data-product-image-frame className="relative w-full h-[130px] shrink-0 grow-0 p-0 bg-muted/50 rounded-t-2xl">
      <div className="absolute inset-0 overflow-hidden rounded-t-2xl">
        {onImageClick ? (
          <button type="button" onClick={onImageClick} aria-label={`Browse ${product.name}`} className="absolute inset-0 block w-full h-full p-0">
            {image}
          </button>
        ) : image}
      </div>
      {children}
    </div>
  );
}