import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';

const TAB_ROOTS = ['/packages', '/order', '/wishlist', '/profile'];

export default function BrandedHeader({ title }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isTabRoot = TAB_ROOTS.includes(location.pathname);
  const { itemCount } = useCart();
  const showCart = location.pathname.startsWith('/package/');

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <header className="relative bg-card overflow-hidden border-b border-border">
      {/* subtle pale-green decoration */}
      <div className="absolute -top-10 -right-12 w-44 h-44 rounded-full bg-[#E8F5E9] opacity-60 blur-2xl pointer-events-none" />
      <div className="absolute top-1 right-14 w-24 h-24 rounded-full bg-[#D6F0DD] opacity-40 blur-xl pointer-events-none" />
      <div
        className={`relative flex items-center gap-3 px-4 pb-3 max-w-md mx-auto w-full ${
          isTabRoot ? 'justify-center' : ''
        }`}
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
      >
        {!isTabRoot && (
          <button
            onClick={goBack}
            aria-label="Back"
            className="w-11 h-11 rounded-full bg-[#EEF8EE] flex items-center justify-center active:scale-90 transition-transform shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-[#2E7D32]" />
          </button>
        )}
        <h1
          className={`text-xl font-bold text-foreground tracking-tight truncate ${
            showCart ? 'flex-1' : ''
          }`}
        >
          {title}
        </h1>
        {showCart && (
          <Link
            to="/cart"
            aria-label="Cart"
            className="relative w-11 h-11 rounded-full bg-[#EEF8EE] flex items-center justify-center active:scale-90 transition-transform shrink-0"
          >
            <ShoppingCart className="w-5 h-5 text-[#2E7D32]" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#2E7D32] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-card">
                {itemCount}
              </span>
            )}
          </Link>
        )}
      </div>
    </header>
  );
}