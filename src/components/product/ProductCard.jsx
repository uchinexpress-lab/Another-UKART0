import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Star, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { toggleItem, isWishlisted } = useWishlist();
  const wished = isWishlisted(product.id);
  const comingSoon = product.status === 'coming_soon';
  const discount = product.original_price && !comingSoon
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col h-full"
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
          <span className="absolute top-2 left-2 bg-gray-700/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Coming Soon
          </span>
        ) : (
          discount > 0 && (
            <span className="absolute top-2 left-2 bg-[#2E7D32] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
          )
        )}
        <button
          onClick={() => toggleItem(product)}
          className="absolute top-2 right-2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-sm active:scale-90 transition-transform"
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
          {comingSoon ? (
            <span className="text-xs font-bold text-gray-500">Coming Soon</span>
          ) : (
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
          )}
          <button
            onClick={() => !comingSoon && addItem(product)}
            disabled={comingSoon}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 flex-shrink-0 ${
              comingSoon ? 'bg-gray-200 cursor-not-allowed' : 'bg-[#2E7D32] hover:bg-[#1B5E20]'
            }`}
          >
            <Plus
              className={`w-4 h-4 ${comingSoon ? 'text-gray-400' : 'text-white'}`}
              strokeWidth={2.5}
            />
          </button>
        </div>
      </div>
    </motion.div>
  );
}