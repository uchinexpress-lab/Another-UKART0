import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PackageCard from '@/components/package/PackageCard';
import MealKitCard from '@/components/package/MealKitCard';

export default function Packages() {
  const location = useLocation();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('essentials');

  useEffect(() => {
    base44.entities.Package.list().then((pkgs) => {
      setPackages(pkgs);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (location.hash === '#meal-kits') setTab('meal_kits');
  }, [location.hash]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#2E7D32] rounded-full animate-spin" />
      </div>
    );
  }

  const essentials = packages.filter((p) => p.group !== 'meal_kits');
  const mealKits = packages.filter((p) => p.group === 'meal_kits');

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Grocery Packages</h1>
      <p className="text-sm text-gray-500 mb-4">Curated bundles for every lifestyle</p>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-full mb-4 sticky top-16 z-30">
        <button
          onClick={() => setTab('essentials')}
          className={`flex-1 py-2 rounded-full text-sm font-semibold transition-colors ${
            tab === 'essentials' ? 'bg-white text-[#2E7D32] shadow-sm' : 'text-gray-500'
          }`}
        >
          Essentials
        </button>
        <button
          onClick={() => setTab('meal_kits')}
          className={`flex-1 py-2 rounded-full text-sm font-semibold transition-colors ${
            tab === 'meal_kits' ? 'bg-white text-[#2E7D32] shadow-sm' : 'text-gray-500'
          }`}
        >
          Meal Kits
        </button>
      </div>

      {tab === 'essentials' ? (
        <div className="space-y-4">
          {essentials.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} className="w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {mealKits.map((pkg) => (
            <MealKitCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      )}
    </div>
  );
}