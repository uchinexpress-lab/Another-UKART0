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
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[55vh]">
        <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-3">
          <Heart className="w-6 h-6 text-retail" />
        </div>
        <p className="text-[15px] font-bold text-foreground">Your wishlist is empty</p>
        <p className="uk-sub mt-1 mb-4">Save items you love for later</p>
        <Link to="/" className="bg-retail text-retail-foreground text-[13px] font-bold px-5 py-2.5 rounded-lg">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="uk-page">
      <div className="flex items-center justify-end mb-3">
        <span className="uk-meta-chip">{items.length} items</span>
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