import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, ClipboardList, Heart, User } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/packages', icon: Package, label: 'Packages' },
  { to: '/order', icon: ClipboardList, label: 'Order' },
  { to: '/wishlist', icon: Heart, label: 'Wishlist' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed left-0 right-0 z-40 flex justify-center"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
    >
      <div className="mx-4 w-full max-w-md flex items-center justify-around h-14 bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-100 px-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-0.5 px-2 py-1 no-tap-highlight active:scale-90 transition-transform"
            >
              <Icon
                className={`w-[18px] h-[18px] ${active ? 'text-[#2E7D32]' : 'text-gray-400'}`}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className={`text-[9px] font-medium ${active ? 'text-[#2E7D32]' : 'text-gray-400'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}