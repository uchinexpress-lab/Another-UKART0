import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import RiderSplash from '@/components/rider/RiderSplash';
import RiderGuard from '@/components/rider/RiderGuard';
import RiderLayout from '@/components/rider/RiderLayout';

const RiderLogin = lazy(() => import('@/pages/rider/RiderLogin'));
const RiderRegister = lazy(() => import('@/pages/rider/RiderRegister'));
const RiderPending = lazy(() => import('@/pages/rider/RiderPending'));
const RiderHome = lazy(() => import('@/pages/rider/RiderHome'));
const RiderActiveDelivery = lazy(() => import('@/pages/rider/RiderActiveDelivery'));
const RiderProfile = lazy(() => import('@/pages/rider/RiderProfile'));
const RiderDeliveries = lazy(() => import('@/pages/rider/RiderDeliveries'));
const RiderCurrentDelivery = lazy(() => import('@/pages/rider/RiderCurrentDelivery'));
const RiderSettings = lazy(() => import('@/pages/rider/RiderSettings'));

const RiderFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-[#1B4332]">
    <div className="w-8 h-8 border-4 border-white/20 border-t-[#5FCF65] rounded-full animate-spin" />
  </div>
);

/**
 * Ukart Rider — standalone delivery-operations app.
 * Shares the same Base44 backend, auth, and delivery records as the customer
 * Ukart app, but exposes ONLY rider pages. No customer shopping, no admin
 * panel — riders can't see them and customers can't see this.
 *
 * Android packaging: point the wrapper's start URL at
 *   https://<app-domain>/rider/login
 * and use /rider-manifest.json for the PWA identity (name, icons, theme).
 */
export default function RiderApp() {
  const [showSplash, setShowSplash] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Apply Rider app identity: title, manifest, theme color.
    // The inline script in index.html handles the initial page load;
    // this handles SPA navigations into /rider/*.
    document.title = 'Ukart Rider';
    const manifest = document.querySelector('link[rel="manifest"]');
    if (manifest) manifest.setAttribute('href', '/rider-manifest.json');
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute('content', '#1B4332');

    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) {
      localStorage.setItem('ukart_ref', ref);
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, []);

  return (
    <>
      <Suspense fallback={<RiderFallback />}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
        >
...
        </motion.div>
      </Suspense>

      <AnimatePresence>
        {showSplash && <RiderSplash onDone={() => setShowSplash(false)} />}
      </AnimatePresence>
    </>
  );
}