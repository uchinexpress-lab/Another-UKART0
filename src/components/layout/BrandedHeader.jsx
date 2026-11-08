import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useSmartBack, useGuardedNavigate } from '@/lib/navigation';

const TAB_ROOTS = ['/packages', '/order', '/wishlist', '/profile'];

export default function BrandedHeader({ title, right = null, backTo = null }) {
  const location = useLocation();
  const isTabRoot = TAB_ROOTS.includes(location.pathname);
  const { itemCount } = useCart();
  const showCart = location.pathname.startsWith('/package/');
  const rightSlot = right || (showCart ? 'cart' : null);

  const smartBack = useSmartBack('/');
  const guardedNavigate = useGuardedNavigate();
  // backTo forces a fixed destination (e.g. Home after a completed checkout)
  // instead of returning through the in-app history.
  const goBack = backTo ? () => guardedNavigate(backTo, { replace: true }) : smartBack;

  return (
    <header className="sticky top-0 z-30 bg-card border-b border-border">
      <div
        className="flex items-center gap-2 px-3 pb-2.5 max-w-md mx-auto w-full"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 10px)' }}
      >
        <div className="w-10 shrink-0">
          {!isTabRoot && (
            <button
              type="button"
              onClick={goBack}
              aria-label="Back"
              className="w-11 h-11 rounded-full flex items-center justify-center text-foreground active:scale-90 transition-transform touch-manipulation"
            >
              <ArrowLeft className="w-[22px] h-[22px]" strokeWidth={2.2} />
            </button>
          )}
        </div>

        <h1 className="flex-1 text-[15px] font-bold text-foreground tracking-tight text-center truncate">
          {title}
        </h1>

        <div className="w-10 shrink-0 flex justify-end">
          {rightSlot === 'cart' && (
            <Link
              to="/cart"
              aria-label="Cart"
              className="relative w-10 h-10 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-transform"
            >
              <ShoppingCart className="w-[18px] h-[18px] text-retail" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center ring-2 ring-card">
                  {itemCount}
                </span>
              )}
            </Link>
          )}
          {rightSlot !== 'cart' && rightSlot}
        </div>
      </div>
    </header>
  );
}