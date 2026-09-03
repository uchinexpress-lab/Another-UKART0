import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import TopNav from './TopNav';
import BrandedHeader from './BrandedHeader';
import FloatingCart from './FloatingCart';
import BottomNav from './BottomNav';
import GuestGate from '@/components/GuestGate';
import Home from '@/pages/Home';
import Packages from '@/pages/Packages';
import Order from '@/pages/Order';
import Wishlist from '@/pages/Wishlist';
import Profile from '@/pages/Profile';

const TAB_ROUTES = ['/', '/packages', '/order', '/wishlist', '/profile'];

function getPageTitle(pathname) {
  if (pathname.startsWith('/package/')) return 'Package Details';
  if (pathname.startsWith('/packages')) return 'Packages';
  if (pathname.startsWith('/categories')) return 'Categories';
  if (pathname.startsWith('/category/')) return 'Browse';
  if (pathname.startsWith('/shop/')) return 'Shop';
  if (pathname.startsWith('/search')) return 'Search';
  if (pathname.startsWith('/offers')) return 'Offers';
  if (pathname.startsWith('/cart')) return 'Cart';
  if (pathname.startsWith('/checkout')) return 'Checkout';
  if (pathname.startsWith('/wishlist')) return 'Wishlist';
  if (pathname.startsWith('/profile')) return 'Profile';
  if (pathname.startsWith('/budget/')) return 'Shop by Budget';
  if (pathname.startsWith('/track')) return 'Order Tracking';
  if (pathname.startsWith('/admin/settings')) return 'Settings';
  if (pathname.startsWith('/admin/orders')) return 'Orders';
  if (pathname.startsWith('/orders/')) return 'Order Details';
  if (pathname.startsWith('/orders')) return 'My Orders';
  if (pathname.startsWith('/order')) return 'My Orders';
  if (pathname.startsWith('/payment-methods')) return 'Payment Methods';
  if (pathname.startsWith('/notifications')) return 'Notifications';
  if (pathname.startsWith('/support')) return 'Help & Support';
  if (pathname.startsWith('/about')) return 'About Ukart';
  if (pathname.startsWith('/settings')) return 'Settings';
  if (pathname.startsWith('/account')) return 'Edit Profile';
  return 'Ukart';
}

export default function Layout() {
  const location = useLocation();
  const pathname = location.pathname;
  const isHome = pathname === '/';
  const isTab = TAB_ROUTES.includes(pathname);

  // Lazy-mount each tab panel on first visit, then keep it alive so its state,
  // scroll height, and inputs persist across tab switches.
  const [mounted, setMounted] = useState(() =>
    isTab ? { [pathname]: true } : {}
  );

  useEffect(() => {
    if (TAB_ROUTES.includes(pathname)) {
      setMounted((prev) => (prev[pathname] ? prev : { ...prev, [pathname]: true }));
    }
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col relative">
      {isHome ? <TopNav /> : <BrandedHeader title={getPageTitle(pathname)} />}
      <main className="flex-1 pb-20 max-w-md mx-auto w-full">
        {mounted['/'] && (
          <div className={pathname === '/' ? 'block' : 'hidden'}>
            <Home />
          </div>
        )}
        {mounted['/packages'] && (
          <div className={pathname === '/packages' ? 'block' : 'hidden'}>
            <Packages />
          </div>
        )}
        {mounted['/order'] && (
          <div className={pathname === '/order' ? 'block' : 'hidden'}>
            <Order />
          </div>
        )}
        {mounted['/wishlist'] && (
          <div className={pathname === '/wishlist' ? 'block' : 'hidden'}>
            <Wishlist />
          </div>
        )}
        {mounted['/profile'] && (
          <div className={pathname === '/profile' ? 'block' : 'hidden'}>
            <GuestGate>
              <Profile />
            </GuestGate>
          </div>
        )}
        {!isTab && (
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        )}
      </main>
      <FloatingCart />
      <BottomNav />
    </div>
  );
}