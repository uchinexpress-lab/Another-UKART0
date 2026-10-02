import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Package, ClipboardList, Heart, User } from 'lucide-react';
import { useTabNav, getTabForPath } from '@/context/TabNavContext';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/packages', icon: Package, label: 'Packages' },
  { to: '/order', icon: ClipboardList, label: 'Orders' },
  { to: '/wishlist', icon: Heart, label: 'Wishlist' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { getTabRoute } = useTabNav();
  const pathname = location.pathname;

  const handleTap = (e, to) => {
    e.preventDefault();
    const target = getTabRoute(to);
    if (pathname === target) {
      // Already on the tab's current route — scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(target);
    }
  };

  return (
    <nav
      className="fixed left-0 right-0 z-40 flex justify-center"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
    >
      <div className="mx-4 w-full max-w-md flex items-center justify-around h-14 bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-100 px-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = getTabForPath(pathname) === to;
          return (
            <Link
              key={to}
              to={to}
              onClick={(e) => handleTap(e, to)}
              className="flex flex-col items-center gap-0.5 px-2 py-1 no-tap-highlight active:scale-90 transition-transform"
            >
              <Icon
                className={`w-[18px] h-[18px] ${active ? 'text-[#2E7D32]' : 'text-gray-400'}`}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className={`text-[11px] font-medium ${active ? 'text-[#2E7D32]' : 'text-gray-400'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}