import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Tag, ShoppingBag, Heart } from 'lucide-react';
import { useCart } from '@/context/CartContext';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/categories', icon: LayoutGrid, label: 'Categories' },
  { to: '/offers', icon: Tag, label: 'Offers' },
  { to: '/cart', icon: ShoppingBag, label: 'Cart' },
  { to: '/wishlist', icon: Heart, label: 'Wishlist' },
];

export default function BottomNav() {
  const location = useLocation();
  const { itemCount } = useCart();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 max-w-md mx-auto">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-0.5 px-3 py-1 no-tap-highlight"
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 ${active ? 'text-[#2E7D32]' : 'text-gray-400'}`}
                  strokeWidth={active ? 2.5 : 2}
                />
                {to === '/cart' && itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#2E7D32] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${active ? 'text-[#2E7D32]' : 'text-gray-400'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}