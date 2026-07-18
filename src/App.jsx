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
import Home from '@/pages/Home';
import PackageDetail from '@/pages/PackageDetail';
import Packages from '@/pages/Packages';
import Categories from '@/pages/Categories';
import CategoryProducts from '@/pages/CategoryProducts';
import SearchResults from '@/pages/SearchResults';
import Offers from '@/pages/Offers';
import Cart from '@/pages/Cart';
import Wishlist from '@/pages/Wishlist';
import Profile from '@/pages/Profile';
import BudgetShop from '@/pages/BudgetShop';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <CartProvider>
      <WishlistProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/package/:id" element={<PackageDetail />} />
            <Route path="/packages" element={<Packages />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/category/:id" element={<CategoryProducts />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/budget/:range" element={<BudgetShop />} />
          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </WishlistProvider>
    </CartProvider>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App