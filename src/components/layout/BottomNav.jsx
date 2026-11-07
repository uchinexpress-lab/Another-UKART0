import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, ClipboardList, Heart, User } from 'lucide-react';
import { useTabNav, getTabForPath } from '@/context/TabNavContext';
import { useGuardedNavigate } from '@/lib/navigation';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/packages', icon: Package, label: 'Packages' },
  { to: '/order', icon: ClipboardList, label: 'Orders' },
  { to: '/wishlist', icon: Heart, label: 'Wishlist' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useGuardedNavigate();
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
    <nav className="fixed left-0 right-0 bottom-0 z-40 bg-card border-t border-border">
      <div
        className="max-w-md mx-auto flex items-stretch justify-around px-1"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = getTabForPath(pathname) === to;
          return (
            <Link
              key={to}
              to={to}
              onClick={(e) => handleTap(e, to)}
              className="flex-1 flex flex-col items-center justify-center gap-1 h-16 no-tap-highlight touch-manipulation active:opacity-70 transition-opacity"
            >
              <Icon
                className={`w-[22px] h-[22px] ${active ? 'text-[#2E7D32]' : 'text-muted-foreground'}`}
                strokeWidth={active ? 2.4 : 1.9}
              />
              <span
                className={`text-[10px] leading-none ${
                  active ? 'font-bold text-[#2E7D32]' : 'font-medium text-muted-foreground'
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}