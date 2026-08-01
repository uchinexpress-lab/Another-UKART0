import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ProductCard from '@/components/product/ProductCard';
import PackageCard from '@/components/package/PackageCard';

const budgetRanges = {
  'under-10000': { min: 0, max: 10000, label: 'Under ₦10,000' },
  '10000-20000': { min: 10000, max: 20000, label: '₦10,000 – ₦20,000' },
  'over-20000': { min: 20000, max: Infinity, label: '₦20,000+' },
};

export default function BudgetShop() {
  const { range } = useParams();
  const budget = budgetRanges[range];
  const [products, setProducts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!budget) {
      setLoading(false);
      return;
    }
    Promise.all([base44.entities.Product.list(), base44.entities.Package.list()]).then(
      ([prods, pkgs]) => {
        setProducts(prods.filter((p) => p.status !== 'coming_soon' && p.price >= budget.min && p.price < budget.max));
        setPackages(
          pkgs.filter((p) => p.starting_price >= budget.min && p.starting_price < budget.max)
        );
        setLoading(false);
      }
    );
  }, [range]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#2E7D32] rounded-full animate-spin" />
      </div>
    );
  }

  if (!budget) return <div className="p-8 text-center text-gray-500">Invalid budget range</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-1 mt-2">💚 {budget.label}</h1>
      <p className="text-sm text-gray-500 mb-4">Everything within your budget</p>

      {packages.length > 0 && (
        <div className="mb-6">
          <h2 className="font-bold text-gray-900 mb-3">Packages</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {packages.map((pkg) => (
              <div key={pkg.id} className="w-72 flex-shrink-0">
                <PackageCard pkg={pkg} className="w-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="font-bold text-gray-900 mb-3">Products</h2>
      {products.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No products in this range</p>
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