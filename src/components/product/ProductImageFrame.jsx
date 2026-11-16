import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { Image } from '@/components/ui/image';

export default function ProductImageFrame({ product, onImageClick, children }) {
  const image = product.image ? (
    <Image
      src={product.image}
      alt={product.name}
      fittingType="fit"
      className="w-full h-full object-contain object-center"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl">
      <ShoppingBag className="w-8 h-8 text-retail/40" />
    </div>
  );

  return (
    <div
      data-product-image-frame
      className="relative w-full aspect-square shrink-0 grow-0 bg-white rounded-t-2xl border-b border-gray-50"
    >
      <div className="w-full h-full p-2.5 flex items-center justify-center overflow-hidden rounded-t-2xl">
        {onImageClick ? (
          <button
            type="button"
            onClick={onImageClick}
            aria-label={`Browse ${product.name}`}
            className="w-full h-full flex items-center justify-center p-0"
          >
            {image}
          </button>
        ) : (
          image
        )}
      </div>
      {children}
    </div>
  );
}
