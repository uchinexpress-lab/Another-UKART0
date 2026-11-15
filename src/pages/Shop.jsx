import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ProductCard from '@/components/product/ProductCard';
import { getBroadCategory } from '@/lib/broadCategories';

const slugify = (val) =>
  String(val || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export default function Shop() {
  const { slug } = useParams();
  const [resolvedCategory, setResolvedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([base44.entities.Category.list(), base44.entities.Product.list()])
      .then(([cats, prods]) => {
        if (!mounted) return;
        const target = slugify(slug);
        const broad = getBroadCategory(slug);

        const matchedCats = cats.filter((c) => {
          const cSlug = slugify(c.slug);
          const cNameSlug = slugify(c.name);
          if (broad?.slugs?.includes(c.slug) || broad?.slugs?.includes(cSlug)) return true;
          return c.id === slug || cSlug === target || cNameSlug === target;
        });

        if (!broad && matchedCats.length === 0) {
          setResolvedCategory(null);
          setProducts([]);
          setLoading(false);
          return;
        }

        const primaryDbCat = matchedCats[0];
        setResolvedCategory({
          name: broad?.name || primaryDbCat?.name || slug,
          icon: broad?.icon || primaryDbCat?.icon || '🛒',
          example: broad?.example || primaryDbCat?.subtitle || '',
        });

        const ids = new Set(matchedCats.map((c) => c.id));
        setProducts(
          prods.filter(
            (p) =>
              !p.is_hidden &&
              (ids.has(p.category_id) ||
                (Array.isArray(p.category_ids) && p.category_ids.some((id) => ids.has(id))))
          )
        );
        setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#2E7D32] rounded-full animate-spin" />
      </div>
    );
  }

  if (!resolvedCategory) {
    return <div className="p-8 text-center text-muted-foreground">Category not found</div>;
  }

  return (
    <div className="uk-page">
      <h1 className="uk-title mb-1">
        {resolvedCategory.icon} {resolvedCategory.name}
      </h1>
      <p className="uk-sub mb-4">
        {resolvedCategory.example ? `${resolvedCategory.example} · ` : ''}
        {products.length} products
      </p>
      {products.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No products in this category yet</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}