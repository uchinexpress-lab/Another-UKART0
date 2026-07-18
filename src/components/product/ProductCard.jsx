import React from 'react';
import { Heart, Star, Plus } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { toggleItem, isWishlisted } = useWishlist();
  const wished = isWishlisted(product.id);
  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col h-full">
      <div className="relative aspect-square bg-gray-50">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-[#2E7D32] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}
        <button
          onClick={() => toggleItem(product)}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm"
        >
          <Heart
            className={`w-4 h-4 ${wished ? 'fill-[#2E7D32] text-[#2E7D32]' : 'text-gray-400'}`}
          />
        </button>
      </div>
      <div className="p-2.5 flex flex-col flex-1">
        <div className="flex items-center gap-1 mb-0.5">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span className="text-[10px] text-gray-500 font-medium">{product.rating || 4.5}</span>
        </div>
        <h3 className="text-xs font-semibold text-gray-900 leading-tight mb-0.5 line-clamp-2">
          {product.name}
        </h3>
        <span className="text-[10px] text-gray-400 mb-2">{product.unit || '1 pack'}</span>
        <div className="flex items-center justify-between mt-auto">
          <div>
            <span className="text-sm font-bold text-[#2E7D32]">
              ₦{product.price.toLocaleString()}
            </span>
            {product.original_price && (
              <span className="text-[10px] text-gray-400 line-through block">
                ₦{product.original_price.toLocaleString()}
              </span>
            )}
          </div>
          <button
            onClick={() => addItem(product)}
            className="w-8 h-8 rounded-full bg-[#2E7D32] flex items-center justify-center hover:bg-[#1B5E20] transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}