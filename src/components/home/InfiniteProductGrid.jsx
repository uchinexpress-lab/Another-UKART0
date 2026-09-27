import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import { useCart } from '@/context/CartContext';
import { Plus } from 'lucide-react';
import VariantPickerSheet from '@/components/product/VariantPickerSheet';
import { getDisplayPrice, getActiveVariants, getSingleVariant, buildCartItem } from '@/lib/variantPricing';

const BATCH_SIZE = 10;

export default function InfiniteProductGrid({ products }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [visible, setVisible] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sheetProduct, setSheetProduct] = useState(null);
  const sentinelRef = useRef(null);
  const indexRef = useRef(0);

  const handleAdd = (p) => {
    const active = getActiveVariants(p);
    if (active.length > 1) {
      setSheetProduct(p);
    } else if (active.length === 1) {
      addItem(buildCartItem(p, active[0]));
    } else {
      addItem(p);
    }
  };

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
      <h2 className="text-lg font-bold text-gray-900 mb-3">More to Explore</h2>
      <div className="grid grid-cols-3 gap-2">
        {visible.map((p, idx) => (
          <div
            key={`${p.id}-${idx}`}
            className="bg-white rounded-2xl border border-gray-100 flex flex-col"
          >
            <div className="relative">
              <div className="relative h-[135px] bg-[#F5F5F5] rounded-t-2xl overflow-hidden">
                <button
                  onClick={() => navigate(`/category/${p.category_ids?.[0] || ''}`)}
                  className="w-full h-full flex items-center justify-center"
                >
                  {p.image ? (
                    <Image src={p.image} alt={p.name} className="w-full h-full" fittingType="fit" />
                  ) : (
                    <span className="text-3xl">🛒</span>
                  )}
                </button>
              </div>
              <button
                onClick={() => handleAdd(p)}
                className="absolute right-1.5 -bottom-2.5 w-9 h-9 rounded-full bg-[#2E7D32] text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 pt-3 flex flex-col flex-1">
              <p className="text-[11px] font-semibold text-gray-900 leading-tight line-clamp-2 min-h-[28px] mb-1">
                {p.name}
              </p>
              <span className={`font-bold text-[#2E7D32] leading-tight mt-auto ${(getDisplayPrice(p)).isRange ? 'text-[10px]' : 'text-[11px]'} whitespace-nowrap`}>
                {(getDisplayPrice(p)).text}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div ref={sentinelRef} className="h-12 flex items-center justify-center py-4">
        {loading && (
          <div className="w-6 h-6 border-3 border-gray-200 border-t-[#2E7D32] rounded-full animate-spin" />
        )}
      </div>
      <VariantPickerSheet
        product={sheetProduct}
        open={!!sheetProduct}
        onOpenChange={(open) => !open && setSheetProduct(null)}
        onAdd={(variant) => sheetProduct && addItem(buildCartItem(sheetProduct, variant))}
      />
    </div>
  );
}