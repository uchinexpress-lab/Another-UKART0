import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// Scroll memory keyed by history entry (location.key). POP (Back/Forward)
// restores exactly where the user was; PUSH starts the new page at the top.
const positions = new Map();

const getHashId = (hash) => {
  const rawId = hash.slice(1);
  try {
    return decodeURIComponent(rawId);
  } catch {
    return rawId;
  }
};

export default function ScrollToTop() {
  const { pathname, hash, key } = useLocation();
  const navigationType = useNavigationType();

  // Take over from the browser: its restoration fights the router and the
  // kept-alive tab panels.
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Remember the position of the entry being left.
  useEffect(() => {
    const entryKey = key;
    return () => {
      positions.set(entryKey, window.scrollY);
    };
  }, [key]);

  useEffect(() => {
    if (hash) {
      const id = getHashId(hash);
      const timer = window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 50);
      return () => window.clearTimeout(timer);
    }

    if (navigationType === "POP") {
      const target = positions.get(key) || 0;
      let tries = 0;
      const restore = () => {
        // Content (lazy pages, images) may still be growing — retry briefly.
        const maxScroll = Math.max(
          0,
          document.documentElement.scrollHeight - window.innerHeight
        );
        window.scrollTo({ top: Math.min(target, maxScroll), left: 0, behavior: "instant" });
        if (tries++ < 4 && Math.abs(window.scrollY - Math.min(target, maxScroll)) > 4) {
          window.setTimeout(restore, 90);
        }
      };
      restore();
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [key, hash, pathname, navigationType]);

  return null;
}