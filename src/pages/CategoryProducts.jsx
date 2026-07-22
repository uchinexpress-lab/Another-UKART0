import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';

export default function CategoryProducts() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Category.get(id),
      base44.entities.Product.list(),
    ]).then(([cat, prods]) => {
      setCategory(cat);
      setProducts(prods.filter((p) => p.category_id === id || (p.category_ids && p.category_ids.includes(id))));
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
    <div className="p-4">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-gray-700">
        <ArrowLeft className="w-5 h-5" /> Back
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {category?.icon} {category?.name}
      </h1>
      <p className="text-sm text-gray-500 mb-4">{products.length} products</p>
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