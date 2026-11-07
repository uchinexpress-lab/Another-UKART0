import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Search } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';

export default function SearchResults() {
  const [params] = useSearchParams();
  const query = params.get('q') || '';
  const [products, setProducts] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Product.list().then((prods) => {
      const q = query.toLowerCase();
      const matched = prods.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q)
      );
      setProducts(matched);

      // Related: share a category with a matched product but don't match the query
      const matchedIds = new Set(matched.map((p) => p.id));
      const matchedCatIds = new Set(
        matched.flatMap((p) => p.category_ids || [])
      );
      const relatedProducts = prods.filter(
        (p) =>
          !matchedIds.has(p.id) &&
          (p.category_ids || []).some((c) => matchedCatIds.has(c))
      );
      setRelated(relatedProducts);
      setLoading(false);
    });
  }, [query]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-border border-t-[#2E7D32] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="uk-page">
      <h1 className="uk-title mb-1">Results for &ldquo;{query}&rdquo;</h1>
      <p className="uk-sub mb-4">
        {products.length} item{products.length === 1 ? '' : 's'} found
      </p>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="uk-sub">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {related.length > 0 && (
        <div className="mt-7">
          <h2 className="uk-title mb-3">You might also like</h2>
          <div className="grid grid-cols-2 gap-3">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}