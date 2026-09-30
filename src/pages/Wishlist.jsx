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
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Heart className="w-10 h-10 text-[#2E7D32]" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">Your wishlist is empty</h2>
        <p className="text-sm text-muted-foreground mb-4">Save items you love for later</p>
        <Link to="/" className="bg-[#2E7D32] text-white text-sm font-bold px-6 py-3 rounded-full">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-foreground mb-4">My Wishlist ({items.length})</h1>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <ProductCardSurface key={item.id} product={item}
            priceInfo={{ text: `₦${item.price.toLocaleString()}`, isRange: false }} wished
            onWishlist={() => removeItem(item.id)} onAdd={() => addItem(item)} />
        ))}
      </div>
    </div>
  );
}