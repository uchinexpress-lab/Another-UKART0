import { useCallback, useRef } from 'react';

/**
 * Prevents double-fire on important actions (place order, pay, submit).
 * Returns a guarded handler that only fires once per cooldown window.
 * While the async action is running, repeated taps are silently ignored.
 *
 * Usage:
 *   const guarded = useClickGuard(async () => { await placeOrder(); });
 *   <button onClick={guarded}>Place Order</button>
 */
export function useClickGuard(cooldownMs = 800) {
  const busy = useRef(false);

  return useCallback(
    (fn) => {
      return async (...args) => {
        if (busy.current) return;
        busy.current = true;
        try {
          await fn(...args);
        } finally {
          setTimeout(() => { busy.current = false; }, cooldownMs);
        }
      };
    },
    [cooldownMs]
  );
}
