import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ProductCard from '@/components/product/ProductCard';
import KitProductCard from '@/components/package/KitProductCard';

export default function CategoryProducts() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const kitId = searchParams.get('kit');
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Category.get(id),
      base44.entities.Product.list(),
    ]).then(([cat, prods]) => {
      setCategory(cat);
      setProducts(
        prods.filter(
          (p) =>
            !p.is_hidden &&
            (p.category_id === id ||
              (p.category_ids && p.category_ids.includes(id)))
        )
      );
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#2E7D32] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="uk-page">
      <h1 className="uk-title mb-1">
        {category?.icon} {category?.name}
      </h1>
      {kitId ? (
        <p className="text-sm font-semibold text-retail mb-3">
          Choose a product to add to your meal kit
        </p>
      ) : (
        <p className="uk-sub mb-3">{products.length} products</p>
      )}
      {products.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          No products in this category yet
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {products.map((p) =>
            kitId ? (
              <KitProductCard
                key={p.id}
                product={p}
                kitId={kitId}
                categoryName={category?.name}
              />
            ) : (
              <ProductCard key={p.id} product={p} />
            )
          )}
        </div>
      )}
    </div>
  );
}