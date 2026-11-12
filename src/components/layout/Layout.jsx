import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useOutlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import TopNav from './TopNav';
import BrandedHeader from './BrandedHeader';
import FloatingCart from './FloatingCart';
import BottomNav from './BottomNav';
import LocationPrompt from '@/components/LocationPrompt';
import { TabNavProvider } from '@/context/TabNavContext';

const TAB_ROUTES = ['/', '/packages', '/order', '/wishlist', '/profile'];

function getPageTitle(pathname) {
  if (pathname.startsWith('/package/')) return 'Package Details';
  if (pathname.startsWith('/packages')) return 'Packages';
  if (pathname.startsWith('/categories')) return 'All Categories';
  if (pathname.startsWith('/category/')) return 'Browse';
  if (pathname.startsWith('/shop/')) return 'Shop';
  if (pathname.startsWith('/search')) return 'Search';
  if (pathname.startsWith('/offers')) return 'Offers';
  if (pathname.startsWith('/cart')) return 'My Cart';
  if (pathname.startsWith('/checkout')) return 'Checkout';
  if (pathname.startsWith('/wishlist')) return 'Wishlist';
  if (pathname.startsWith('/profile')) return 'Profile';
  if (pathname.startsWith('/budget/')) return 'Shop by Budget';
  if (pathname.startsWith('/track-order/')) return 'Track Order';
  if (pathname.startsWith('/track')) return 'Order Tracking';
  if (pathname.startsWith('/tickets')) return 'My Tickets';
  if (pathname.startsWith('/payment/callback')) return 'Payment';
  if (pathname.startsWith('/admin/settings')) return 'Settings';
  if (pathname.startsWith('/admin/orders')) return 'Orders';
  if (pathname.endsWith('/payment-success')) return 'Order Confirmed';
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
    <div className="w-7 h-7 border-[3px] border-muted border-t-retail rounded-full animate-spin" />
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
    <TabNavProvider>
    <div className="min-h-screen bg-background flex flex-col relative">
      {isHome ? (
        <TopNav />
      ) : (
        <BrandedHeader
          title={getPageTitle(pathname)}
          backTo={pathname.endsWith('/payment-success') ? '/' : null}
        />
      )}
      <main
        className={`flex-1 max-w-md mx-auto w-full ${isTab ? 'pb-24' : ''}`}
        style={{ paddingBottom: isTab ? 'calc(env(safe-area-inset-bottom) + 76px)' : undefined }}
      >
        <Suspense fallback={Fallback}>
          {/* Tab panels — cached outlets, kept alive (hidden when inactive) */}
          {tabsToRender.map((p) => (
            <div key={p} className={p === pathname ? 'block' : 'hidden'}>
              {cached.current[p]}
            </div>
          ))}
          {/* Non-tab child screens — content mounts immediately and eases in,
              with no exit wait, so a tap never lands on a blank frame */}
          {!isTab && (
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              {outlet}
            </motion.div>
          )}
        </Suspense>
      </main>
      <FloatingCart />
      {isTab && <BottomNav />}
      <LocationPrompt />
    </div>
    </TabNavProvider>
  );
}