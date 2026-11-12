import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tag } from 'lucide-react';
import { usePageContent } from '@/lib/usePageContent';
import ProductCard from '@/components/product/ProductCard';
import PullToRefresh from '@/components/home/PullToRefresh';

export default function Offers() {
  const { getField } = usePageContent('offers');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const title = getField('title', 'Weekly Offers');
  const subtitle = getField('subtitle', 'Limited time deals on your favourites');
  const emptyMessage = getField('empty_message', 'No active offers right now');

  const loadOffers = async () => {
    try {
      const prods = await base44.entities.Product.list();
      setProducts(prods.filter((p) => p.is_weekly_deal && !p.is_hidden));
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadOffers();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#2E7D32] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={loadOffers}>
    <div className="uk-page">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-8 h-8 rounded-full bg-retail/10 flex items-center justify-center">
          <Tag className="w-4 h-4 text-retail" />
        </span>
        <h1 className="uk-title">Weekly Offers</h1>
      </div>
      <p className="uk-sub mb-4">Limited time deals on your favourites</p>
      {products.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No active offers right now</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}