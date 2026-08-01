import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import TopNav from './TopNav';
import BackHeader from './BackHeader';
import BottomNav from './BottomNav';

export default function Layout() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col relative">
      {isHome ? <TopNav /> : <BackHeader />}
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={`flex-1 pb-20 max-w-md mx-auto w-full ${isHome ? '' : 'pt-16'}`}
      >
        <Outlet />
      </motion.main>
      <BottomNav />
    </div>
  );
}