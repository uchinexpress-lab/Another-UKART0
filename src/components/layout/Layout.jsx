import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useOutlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import TopNav from './TopNav';
import BrandedHeader from './BrandedHeader';
import FloatingCart from './FloatingCart';
import BottomNav from './BottomNav';

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

const Fallback = (
  <div className="flex justify-center py-16">
    <div className="w-8 h-8 border-4 border-gray-200 border-t-[#2E7D32] rounded-full animate-spin" />
  </div>
);

export default function Layout() {
  const location = useLocation();
  const pathname = location.pathname;
  const isHome = pathname === '/';
  const isTab = TAB_ROUTES.includes(pathname);
  const outlet = useOutlet();

  // Keep-alive: cache each visited tab's outlet element so its state,
  // scroll height, and inputs persist across tab switches.
  const cached = useRef({});
  const [cachedTabs, setCachedTabs] = useState(() => (isTab ? [pathname] : []));

  if (isTab) {
    cached.current[pathname] = outlet;
  }

  useEffect(() => {
    if (isTab && !cachedTabs.includes(pathname)) {
      setCachedTabs((prev) => [...prev, pathname]);
    }
  }, [pathname, isTab, cachedTabs]);

  const tabsToRender =
    isTab && !cachedTabs.includes(pathname) ? [...cachedTabs, pathname] : cachedTabs;

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col relative">
      {isHome ? <TopNav /> : <BrandedHeader title={getPageTitle(pathname)} />}
      <main className="flex-1 pb-20 max-w-md mx-auto w-full">
        <Suspense fallback={Fallback}>
          {/* Tab panels — cached outlets, kept alive, fade on switch */}
          {tabsToRender.map((p) => (
            <motion.div
              key={p}
              className={p === pathname ? 'block' : 'hidden'}
              initial={false}
              animate={{ opacity: p === pathname ? 1 : 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {cached.current[p]}
            </motion.div>
          ))}
          {/* Non-tab child screens — push navigation with slide-in-from-right */}
          <AnimatePresence mode="wait">
            {!isTab && (
              <motion.div
                key={pathname}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                {outlet}
              </motion.div>
            )}
          </AnimatePresence>
        </Suspense>
      </main>
      <FloatingCart />
      <BottomNav />
    </div>
  );
}