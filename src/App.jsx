import { useState, useEffect, lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { LocationProvider } from '@/context/LocationContext';
import { MealKitProvider } from '@/context/MealKitContext';
import Layout from '@/components/layout/Layout';
import Splash from '@/components/Splash';
import RiderSplash from '@/components/rider/RiderSplash';
import BrowseGuard from '@/components/BrowseGuard';
import GuestGate from '@/components/GuestGate';
import ProtectedRoute from '@/components/ProtectedRoute';
const Admin = lazy(() => import('@/pages/Admin'));
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from 'next-themes';
const Home = lazy(() => import('@/pages/Home'));
const PackageDetail = lazy(() => import('@/pages/PackageDetail'));
const Packages = lazy(() => import('@/pages/Packages'));
const Categories = lazy(() => import('@/pages/Categories'));
const CategoryProducts = lazy(() => import('@/pages/CategoryProducts'));
const SearchResults = lazy(() => import('@/pages/SearchResults'));
const Offers = lazy(() => import('@/pages/Offers'));
const Cart = lazy(() => import('@/pages/Cart'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const PaymentCallback = lazy(() => import('@/pages/PaymentCallback'));
const Shop = lazy(() => import('@/pages/Shop'));
const Wishlist = lazy(() => import('@/pages/Wishlist'));
const Profile = lazy(() => import('@/pages/Profile'));
const BudgetShop = lazy(() => import('@/pages/BudgetShop'));
const OrderTracking = lazy(() => import('@/pages/OrderTracking'));

const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Orders = lazy(() => import('@/pages/Orders'));
const Order = lazy(() => import('@/pages/Order'));
const OrderDetail = lazy(() => import('@/pages/OrderDetail'));
const PaymentMethods = lazy(() => import('@/pages/PaymentMethods'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const HelpSupport = lazy(() => import('@/pages/HelpSupport'));
const SupportTickets = lazy(() => import('@/pages/SupportTickets'));

const About = lazy(() => import('@/pages/About'));
const SettingsPage = lazy(() => import('@/pages/Settings'));
const Account = lazy(() => import('@/pages/Account'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
import RiderApp from '@/RiderApp';
import StaffApp from '@/StaffApp';
const LiveOrderTracking = lazy(() => import('@/pages/LiveOrderTracking'));


const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, user } = useAuth();
  const location = useLocation();
  const isRiderPath = location.pathname.startsWith('/rider');
  const isStaffPath = location.pathname.startsWith('/admin');

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Operations stay outside customer layout and onboarding. The named Admin
  // page is an explicit route; subpages use relative routes under the wildcard.
  if (isRiderPath) return <RiderApp />;
  if (isStaffPath) return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading Admin...</div>}>
      <Routes>
        <Route path="/admin/login" element={<StaffApp />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to={`/admin/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />} />}>
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/*" element={<StaffApp />} />
        </Route>
      </Routes>
    </Suspense>
  );

  // Prevent riders from accessing customer shopping / admin pages.
  // Riders are redirected to their dashboard.
  if (user?.role === 'rider') {
    return <Navigate to="/rider/home" replace />;
  }

  if (authError && authError.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <CartProvider>
    <WishlistProvider>
    <MealKitProvider>
    <LocationProvider>
      <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-gray-200 border-t-[#2E7D32] rounded-full animate-spin" /></div>}>
      <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* Rider app lives at /rider/* — handled by <RiderApp /> above,
              completely separate from the customer routes below. */}
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
          <Route path="/order" element={<Order />} />
              <Route path="/checkout" element={<GuestGate><Checkout /></GuestGate>} />
              <Route path="/payment/callback" element={<PaymentCallback />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/profile" element={<GuestGate><Profile /></GuestGate>} />
              <Route path="/budget/:range" element={<BudgetShop />} />
              <Route path="/track" element={<OrderTracking />} />
              <Route path="/track-order/:id" element={<LiveOrderTracking />} />

              <Route path="/orders" element={<GuestGate><Orders /></GuestGate>} />
              <Route path="/orders/:id" element={<GuestGate><OrderDetail /></GuestGate>} />
              <Route path="/payment-methods" element={<GuestGate><PaymentMethods /></GuestGate>} />
              <Route path="/notifications" element={<GuestGate><Notifications /></GuestGate>} />
              <Route path="/support" element={<HelpSupport />} />
              <Route path="/tickets" element={<GuestGate><SupportTickets /></GuestGate>} />

              <Route path="/about" element={<About />} />
              <Route path="/settings" element={<GuestGate><SettingsPage /></GuestGate>} />
              <Route path="/account" element={<GuestGate><Account /></GuestGate>} />
            </Route>
          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Routes>
        </Suspense>
      </LocationProvider>
      </MealKitProvider>
      </WishlistProvider>
    </CartProvider>
  );
};

function AppShell() {
  const [showSplash, setShowSplash] = useState(true);
  const location = useLocation();
  const isRiderPath = location.pathname.startsWith('/rider');
  const isStaffPath = location.pathname.startsWith('/admin');
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) {
      localStorage.setItem('ukart_ref', ref);
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, []);

  // Restore customer app identity when leaving rider routes
  useEffect(() => {
    if (!isRiderPath) {
      document.title = 'Ukart';
      const manifest = document.querySelector('link[rel="manifest"]');
      if (manifest) manifest.setAttribute('href', '/manifest.json');
      const themeColor = document.querySelector('meta[name="theme-color"]');
      if (themeColor) themeColor.setAttribute('content', '#2E7D32');
    }
  }, [isRiderPath]);
  return (
    <>
      <AuthenticatedApp />
      <AnimatePresence>
        {showSplash && !isStaffPath && (
          isRiderPath ? <RiderSplash onDone={() => setShowSplash(false)} /> : <Splash onDone={() => setShowSplash(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AppShell />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App