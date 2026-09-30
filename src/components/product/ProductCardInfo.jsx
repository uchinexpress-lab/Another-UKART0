import React from 'react';

export default function ProductCardInfo({ product, priceInfo, originalPrice, comingSoon = false }) {
  return (
    <div data-product-info className="w-full h-[74px] shrink-0 grow-0 p-2 pt-2.5">
      <h3 data-product-name className="h-7 overflow-hidden text-[11px] font-semibold text-card-foreground leading-[14px] line-clamp-2 mb-0.5">
        {product.name}
      </h3>
      <div data-product-price-area className="h-[26px] overflow-hidden">
        <span data-product-price className={`block font-bold ${comingSoon ? 'h-3.5 leading-[14px] whitespace-nowrap text-[10px] text-muted-foreground' : priceInfo.isRange ? 'h-[26px] leading-3 whitespace-normal text-[10px] text-retail' : 'h-3.5 leading-[14px] whitespace-nowrap text-[11px] text-retail'}`}>
          {comingSoon ? 'Coming Soon' : priceInfo.text}
        </span>
        {!comingSoon && !priceInfo.isRange && originalPrice > 0 && (
          <span className="block h-3 leading-3 text-[9px] text-muted-foreground line-through">
            ₦{originalPrice.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}