import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tag } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import PullToRefresh from '@/components/home/PullToRefresh';

export default function Offers() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOffers = async () => {
    try {
      const prods = await base44.entities.Product.list();
      setProducts(prods.filter((p) => p.is_weekly_deal));
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
    <div className="p-4">
      <div className="flex items-center gap-2 mb-1">
        <Tag className="w-5 h-5 text-[#2E7D32]" />
        <h1 className="text-2xl font-bold text-foreground">Weekly Offers</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Limited time deals on your favourites</p>
      {products.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No active offers right now</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}