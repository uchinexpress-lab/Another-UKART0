import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import TopNav from './TopNav';
import BrandedHeader from './BrandedHeader';
import FloatingCart from './FloatingCart';
import BottomNav from './BottomNav';

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
  return 'Ukart';
}

export default function Layout() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col relative">
      {isHome ? <TopNav /> : <BrandedHeader title={getPageTitle(location.pathname)} />}
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex-1 pb-20 max-w-md mx-auto w-full"
      >
        <Outlet />
      </motion.main>
      <FloatingCart />
      <BottomNav />
    </div>
  );
}