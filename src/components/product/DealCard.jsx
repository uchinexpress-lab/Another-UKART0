import React from 'react';
import { Heart, Plus } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

export default function DealCard({ product }) {
  const { addItem } = useCart();
  const { toggleItem, isWishlisted } = useWishlist();
  const wished = isWishlisted(product.id);
  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col h-full">
      <div className="relative aspect-[4/3] bg-gray-50">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        {discount > 0 && (
          <span className="absolute top-1.5 left-1.5 bg-[#2E7D32] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}
        <button
          onClick={() => toggleItem(product)}
          className="absolute top-1.5 right-1.5 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-sm active:scale-90 transition-transform"
        >
          <Heart
            className={`w-4 h-4 ${wished ? 'fill-[#2E7D32] text-[#2E7D32]' : 'text-gray-400'}`}
          />
        </button>
      </div>
      <div className="p-2 flex flex-col flex-1">
        <h3 className="text-xs font-semibold text-gray-900 leading-tight line-clamp-1 mb-1.5">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-[#2E7D32]">
              ₦{product.price.toLocaleString()}
            </span>
            {product.original_price && (
              <span className="text-[9px] text-gray-400 line-through">
                ₦{product.original_price.toLocaleString()}
              </span>
            )}
          </div>
          <button
            onClick={() => addItem(product)}
            className="w-10 h-10 rounded-full bg-[#2E7D32] flex items-center justify-center hover:bg-[#1B5E20] transition-colors flex-shrink-0 active:scale-90"
          >
            <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}