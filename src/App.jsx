import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import Layout from '@/components/layout/Layout';
import Splash from '@/components/Splash';
import BrowseGuard from '@/components/BrowseGuard';
import GuestGate from '@/components/GuestGate';
import { AnimatePresence } from 'framer-motion';
import Home from '@/pages/Home';
import PackageDetail from '@/pages/PackageDetail';
import Packages from '@/pages/Packages';
import Categories from '@/pages/Categories';
import CategoryProducts from '@/pages/CategoryProducts';
import SearchResults from '@/pages/SearchResults';
import Offers from '@/pages/Offers';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import Shop from '@/pages/Shop';
import Wishlist from '@/pages/Wishlist';
import Profile from '@/pages/Profile';
import BudgetShop from '@/pages/BudgetShop';
import OrderTracking from '@/pages/OrderTracking';
import AdminSettings from '@/pages/AdminSettings';
import AdminOrders from '@/pages/AdminOrders';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError && authError.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <CartProvider>
      <WishlistProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route element={<BrowseGuard />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/package/:id" element={<PackageDetail />} />
              <Route path="/packages" element={<Packages />} />
              <Route path="/shop/:slug" element={<Shop />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/category/:id" element={<CategoryProducts />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<GuestGate><Checkout /></GuestGate>} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/profile" element={<GuestGate><Profile /></GuestGate>} />
              <Route path="/budget/:range" element={<BudgetShop />} />
              <Route path="/track" element={<OrderTracking />} />
              <Route path="/admin/settings" element={<GuestGate><AdminSettings /></GuestGate>} />
              <Route path="/admin/orders" element={<GuestGate><AdminOrders /></GuestGate>} />
            </Route>
          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </WishlistProvider>
    </CartProvider>
  );
};

function AppShell() {
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => {
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
      <AuthenticatedApp />
      <AnimatePresence>
        {showSplash && <Splash onDone={() => setShowSplash(false)} />}
      </AnimatePresence>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AppShell />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App