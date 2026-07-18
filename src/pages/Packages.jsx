import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PackageCard from '@/components/package/PackageCard';

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Package.list().then((pkgs) => {
      setPackages(pkgs);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#2E7D32] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Grocery Packages</h1>
      <p className="text-sm text-gray-500 mb-4">Curated bundles for every lifestyle</p>
      <div className="space-y-4">
        {packages.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} className="w-full" />
        ))}
      </div>
    </div>
  );
}