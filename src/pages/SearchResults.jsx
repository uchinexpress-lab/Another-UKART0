import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Search } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';

export default function SearchResults() {
  const [params] = useSearchParams();
  const query = params.get('q') || '';
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Product.list().then((prods) => {
      const filtered = prods.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      );
      setProducts(filtered);
      setLoading(false);
    });
  }, [query]);

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
      <h1 className="text-lg font-bold text-gray-900 mb-1">Search: &ldquo;{query}&rdquo;</h1>
      <p className="text-sm text-gray-500 mb-4">{products.length} results</p>
      {products.length === 0 ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No products found</p>
        </div>
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