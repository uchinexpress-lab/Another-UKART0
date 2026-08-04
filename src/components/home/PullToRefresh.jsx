import React, { useRef, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children }) {
  const startY = useRef(0);
  const pulling = useRef(false);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const refreshFn = useRef(onRefresh);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refreshFn.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const onStart = (e) => {
      if (refreshingRef.current) return;
      if (window.scrollY <= 0) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    };
    const onMove = (e) => {
      if (!pulling.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) {
        const next = Math.min(dy * 0.5, 100);
        pullRef.current = next;
        setPull(next);
      }
    };
    const onEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;
      if (pullRef.current >= THRESHOLD) {
        refreshingRef.current = true;
        setRefreshing(true);
        setPull(THRESHOLD);
        try {
          await refreshFn.current?.();
        } finally {
          refreshingRef.current = false;
          setRefreshing(false);
          pullRef.current = 0;
          setPull(0);
        }
      } else {
        pullRef.current = 0;
        setPull(0);
      }
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, []);

  return (
    <>
      <div
        className="fixed top-14 left-0 right-0 z-30 flex justify-center pointer-events-none transition-[height,opacity] duration-200"
        style={{ height: refreshing ? THRESHOLD : pull, opacity: pull / THRESHOLD }}
      >
        <Loader2 className={`w-5 h-5 text-[#2E7D32] mt-2 ${refreshing ? 'animate-spin' : ''}`} />
      </div>
      {children}
    </>
  );
}