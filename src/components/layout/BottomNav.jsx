import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, Tag, Heart, User } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/packages', icon: Package, label: 'Packages' },
  { to: '/offers', icon: Tag, label: 'Offers' },
  { to: '/wishlist', icon: Heart, label: 'Wishlist' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 4px)' }}
    >
      <div className="max-w-md mx-auto flex items-center justify-around h-16">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-0.5 px-3 py-1 no-tap-highlight active:scale-90 transition-transform"
            >
              <Icon
                className={`w-5 h-5 ${active ? 'text-[#2E7D32]' : 'text-gray-400'}`}
                strokeWidth={active ? 2.5 : 2}
              />
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