import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import { getBroadCategory } from '@/lib/broadCategories';

export default function Shop() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const broad = getBroadCategory(slug);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!broad) {
      setLoading(false);
      return;
    }
    Promise.all([base44.entities.Category.list(), base44.entities.Product.list()]).then(
      ([cats, prods]) => {
        const ids = new Set(
          broad.slugs
            .map((s) => cats.find((c) => c.slug === s))
            .filter(Boolean)
            .map((c) => c.id)
        );
        setProducts(
          prods.filter(
            (p) =>
              ids.has(p.category_id) ||
              (p.category_ids && p.category_ids.some((id) => ids.has(id)))
          )
        );
        setLoading(false);
      }
    );
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#2E7D32] rounded-full animate-spin" />
      </div>
    );
  }

  if (!broad) {
    return <div className="p-8 text-center text-gray-500">Category not found</div>;
  }

  return (
    <div className="p-4">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-2 text-gray-700"
      >
        <ArrowLeft className="w-5 h-5" /> Back
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {broad.icon} {broad.name}
      </h1>
      <p className="text-sm text-gray-500 mb-4">
        {broad.example} · {products.length} products
      </p>
      {products.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No products in this category yet</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}