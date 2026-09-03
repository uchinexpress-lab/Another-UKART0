import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { Heart, Plus } from 'lucide-react';

export default function Wishlist() {
  const { items, removeItem } = useWishlist();
  const { addItem } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-full bg-[#E8F5E9] flex items-center justify-center mb-4">
          <Heart className="w-10 h-10 text-[#2E7D32]" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Your wishlist is empty</h2>
        <p className="text-sm text-gray-500 mb-4">Save items you love for later</p>
        <Link to="/" className="bg-[#2E7D32] text-white text-sm font-bold px-6 py-3 rounded-full">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">My Wishlist ({items.length})</h1>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="relative aspect-square">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              <button
                onClick={() => removeItem(item.id)}
                className="absolute top-2 right-2 w-11 h-11 rounded-full bg-white/90 flex items-center justify-center shadow-sm active:scale-90 transition-transform"
              >
                <Heart className="w-4 h-4 fill-[#2E7D32] text-[#2E7D32]" />
              </button>
            </div>
            <div className="p-2.5">
              <h3 className="text-xs font-semibold text-gray-900 mb-1 line-clamp-2">{item.name}</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#2E7D32]">
                  ₦{item.price.toLocaleString()}
                </span>
                <button
                  onClick={() => addItem(item)}
                  className="w-11 h-11 rounded-full bg-[#2E7D32] flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}