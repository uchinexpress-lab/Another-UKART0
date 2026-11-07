import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { Heart } from 'lucide-react';
import ProductCardSurface from '@/components/product/ProductCardSurface';

export default function Wishlist() {
  const { items, removeItem } = useWishlist();
  const { addItem } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
          <Heart className="w-9 h-9 text-[#2E7D32]" />
        </div>
        <h2 className="uk-title mb-1">Your wishlist is empty</h2>
        <p className="uk-sub mb-5">Save items you love for later</p>
        <Link to="/" className="bg-[#2E7D32] text-white text-sm font-bold px-6 py-3 rounded-xl">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="uk-page">
      <div className="flex items-center justify-between mb-3">
        <h1 className="uk-title">Wishlist</h1>
        <span className="uk-meta">
          {items.length} saved
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <ProductCardSurface key={item.id} product={item}
            priceInfo={{ text: `₦${item.price.toLocaleString()}`, isRange: false }} wished
            onWishlist={() => removeItem(item.id)} onAdd={() => addItem(item)} />
        ))}
      </div>
    </div>
  );
}