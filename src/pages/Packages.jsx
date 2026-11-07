import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PackageCard from '@/components/package/PackageCard';
import MealKitCard from '@/components/package/MealKitCard';
import PullToRefresh from '@/components/home/PullToRefresh';

export default function Packages() {
  const location = useLocation();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('essentials');

  const loadPackages = async () => {
    try {
      const pkgs = await base44.entities.Package.list();
      setPackages(pkgs);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadPackages();
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

  const sellable = packages.filter((p) => p.active !== false);
  const essentials = sellable.filter((p) => p.group !== 'meal_kits');
  const mealKits = sellable.filter((p) => p.group === 'meal_kits');

  return (
    <PullToRefresh onRefresh={loadPackages}>
    <div className="uk-page">
      <h1 className="uk-title mb-1">Grocery Packages</h1>
      <p className="uk-sub mb-3">Curated bundles for every lifestyle</p>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 -mx-1 px-1">
        <button
          onClick={() => setTab('essentials')}
          className={`uk-chip ${tab === 'essentials' ? 'uk-chip-active' : ''}`}
        >
          Essentials
        </button>
        <button
          onClick={() => setTab('meal_kits')}
          className={`uk-chip ${tab === 'meal_kits' ? 'uk-chip-active' : ''}`}
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
    </PullToRefresh>
  );
}