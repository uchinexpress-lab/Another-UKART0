import React, { useState, useEffect, useRef, useCallback } from 'react';
import ProductCard from '@/components/product/ProductCard';

const BATCH_SIZE = 10;

export default function InfiniteProductGrid({ products }) {

  const [visible, setVisible] = useState([]);
  const [loading, setLoading] = useState(false);

  const sentinelRef = useRef(null);
  const indexRef = useRef(0);

  const loadMore = useCallback(() => {
    if (!products.length) return;
    setLoading(true);
    // Simulate a short fetch delay for smooth UX on each batch
    setTimeout(() => {
      const next = [];
      for (let i = 0; i < BATCH_SIZE; i++) {
        next.push(products[(indexRef.current + i) % products.length]);
      }
      indexRef.current += BATCH_SIZE;
      setVisible((prev) => [...prev, ...next]);
      setLoading(false);
    }, 400);
  }, [products]);

  // Seed the first batch on mount (or when products change)
  useEffect(() => {
    if (!products.length) return;
    indexRef.current = 0;
    const first = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
      first.push(products[i % products.length]);
    }
    indexRef.current = BATCH_SIZE;
    setVisible(first);
  }, [products]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          loadMore();
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore, loading]);

  if (!products.length) return null;

  return (
    <div className="px-4 pt-2">
      <h2 className="text-lg font-bold text-gray-900 mb-2">More to Explore</h2>
      <div className="grid grid-cols-3 gap-2">
        {visible.map((p, idx) => (
          <ProductCard key={`${p.id}-${idx}`} product={p} animated={false}
            showOriginalPrice={false} showDiscount={false} respectComingSoon={false} />
        ))}
      </div>
      <div ref={sentinelRef} className="h-8 flex items-center justify-center py-2">
        {loading && (
          <div className="w-6 h-6 border-3 border-gray-200 border-t-[#2E7D32] rounded-full animate-spin" />
        )}
      </div>

    </div>
  );
}