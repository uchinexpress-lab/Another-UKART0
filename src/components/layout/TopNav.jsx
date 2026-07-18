import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, User, Menu as MenuIcon, Truck, Settings, HelpCircle, Info } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function TopNav() {
  const { itemCount } = useCart();
  const { itemCount: wishCount } = useWishlist();

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] max-w-md mx-auto">
      <div className="flex items-center justify-between px-4 h-16">
        <Link to="/" className="flex items-center no-tap-highlight active:scale-95 transition-transform">
          <img
            src="https://media.base44.com/images/public/user_6a5b60fa58a7a9c730d2e144/7a94e394d_A9E61264-817E-46E3-8245-1007BBE65B07.png"
            alt="Ukart"
            className="h-11 w-11 rounded-xl object-cover"
          />
        </Link>

        <div className="flex items-center gap-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-full hover:bg-gray-100">
                <MenuIcon className="w-5 h-5 text-gray-700" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem><Truck className="w-4 h-4 mr-2" /> Track Order</DropdownMenuItem>
              <DropdownMenuItem><Settings className="w-4 h-4 mr-2" /> Settings</DropdownMenuItem>
              <DropdownMenuItem><HelpCircle className="w-4 h-4 mr-2" /> Help &amp; Support</DropdownMenuItem>
              <DropdownMenuItem><Info className="w-4 h-4 mr-2" /> About Ukart</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link to="/wishlist" className="relative p-2 rounded-full hover:bg-gray-100 active:scale-90 transition-transform">
            <Heart className="w-5 h-5 text-gray-700" />
            {wishCount > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-[#2E7D32] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {wishCount}
              </span>
            )}
          </Link>

          <Link to="/cart" className="relative p-2 rounded-full hover:bg-gray-100 active:scale-90 transition-transform">
            <ShoppingBag className="w-5 h-5 text-gray-700" />
            {itemCount > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-[#2E7D32] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          <Link to="/profile" className="p-2 rounded-full hover:bg-gray-100 active:scale-90 transition-transform">
            <User className="w-5 h-5 text-gray-700" />
          </Link>
        </div>
      </div>
    </header>
  );
}