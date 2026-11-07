import { useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// ---------------------------------------------------------------------------
// One navigation model for the whole app.
//
// React Router v6 keeps an entry index (`idx`) in window.history.state for
// every in-app entry it pushed. That is the only reliable signal of "there is
// a previous page inside the app" — window.history.length is not, because it
// also counts entries from before the app was opened, which is what made Back
// sometimes leave Ukart entirely.
//
//   idx > 0  -> navigate(-1) returns to the real previous page.
//   idx = 0  -> this is the app's first entry, so go to the page's parent.
// ---------------------------------------------------------------------------

/** The app area a path belongs to: 'admin' | 'rider' | 'customer'. */
export function areaFor(pathname = '') {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/rider')) return 'rider';
  return 'customer';
}

/** The homepage for the area a path belongs to. */
export function homeRouteFor(pathname = '') {
  const area = areaFor(pathname);
  if (area === 'admin') return '/admin';
  if (area === 'rider') return '/rider/home';
  return '/';
}

// Where a page falls back to when the visitor landed on it directly
// (deep link, refresh, notification) and there is no in-app history.
const TAB_FALLBACKS = ['/', '/packages', '/order', '/wishlist', '/profile'];

export function parentRouteFor(pathname = '') {
  const area = areaFor(pathname);
  if (area === 'admin') return pathname === '/admin' ? '/' : '/admin';
  if (area === 'rider') return pathname === '/rider/home' ? '/rider/home' : '/rider/home';

  if (pathname === '/' ) return '/';
  if (pathname === '/package' ) return '/packages';
  if (pathname.startsWith('/package/')) return '/packages';
  if (pathname.startsWith('/packages')) return '/';
  if (pathname.startsWith('/shop/')) return '/categories';
  if (pathname.startsWith('/category/')) return '/categories';
  if (pathname.startsWith('/categories')) return '/';
  if (pathname.startsWith('/search')) return '/';
  if (pathname.startsWith('/offers')) return '/';
  if (pathname.startsWith('/budget/')) return '/';
  if (pathname.startsWith('/cart')) return '/';
  if (pathname.startsWith('/checkout')) return '/cart';
  if (pathname.endsWith('/payment-success')) return '/orders';
  if (pathname.startsWith('/payment/callback')) return '/orders';
  if (pathname.startsWith('/payment-methods')) return '/profile';
  if (pathname.startsWith('/orders/')) return '/orders';
  if (pathname.startsWith('/orders')) return '/profile';
  if (pathname.startsWith('/order')) return '/';
  if (pathname.startsWith('/track-order/')) return '/orders';
  if (pathname.startsWith('/track')) return '/';
  if (pathname.startsWith('/wishlist')) return '/';
  if (pathname.startsWith('/profile')) return '/';
  if (pathname.startsWith('/notifications')) return '/profile';
  if (pathname.startsWith('/support')) return '/profile';
  if (pathname.startsWith('/tickets')) return '/support';
  if (pathname.startsWith('/about')) return '/profile';
  if (pathname.startsWith('/settings')) return '/profile';
  if (pathname.startsWith('/account')) return '/profile';
  return '/';
}

/** True when the current history entry has an in-app page before it. */
export function hasInAppHistory() {
  const idx = window.history.state?.idx;
  return typeof idx === 'number' && idx > 0;
}

/**
 * One tap, one navigation.
 * Returns a stable handler: goes back when there is in-app history,
 * otherwise lands on the given fallback (or the page's natural parent).
 * Rapid repeat taps are ignored so a double tap can't pop two pages.
 */
export function useSmartBack(fallback) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const lastTap = useRef(0);

  return useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 450) return;
    lastTap.current = now;

    if (hasInAppHistory()) {
      navigate(-1);
    } else {
      navigate(fallback || parentRouteFor(pathname), { replace: true });
    }
  }, [navigate, fallback, pathname]);
}

/** Debounced navigation for rapid taps on nav items. */
export function useGuardedNavigate() {
  const navigate = useNavigate();
  const lastTap = useRef(0);

  return useCallback(
    (to, options) => {
      const now = Date.now();
      if (now - lastTap.current < 350) return;
      lastTap.current = now;
      navigate(to, options);
    },
    [navigate]
  );
}

export { TAB_FALLBACKS };