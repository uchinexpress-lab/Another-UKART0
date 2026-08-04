import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import QuickCategories from '@/components/categories/QuickCategories';
import PromoBanner from '@/components/home/PromoBanner';
import PackageCarousel from '@/components/home/PackageCarousel';
import ShopByBudget from '@/components/home/ShopByBudget';
import FeaturedCategories from '@/components/home/FeaturedCategories';
import BestSellers from '@/components/home/BestSellers';
import WeeklyDeals from '@/components/home/WeeklyDeals';
import PopularMealKits from '@/components/home/PopularMealKits';
import MealKitBanner from '@/components/home/MealKitBanner';
import CustomerReviews from '@/components/home/CustomerReviews';
import InfiniteProductGrid from '@/components/home/InfiniteProductGrid';
import PullToRefresh from '@/components/home/PullToRefresh';

export default function Home() {
  const [packages, setPackages] = useState([]);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = () =>
    Promise.all([
      base44.entities.Package.list(),
      base44.entities.Product.list(),
      base44.entities.Review.list(),
    ]).then(([pkgs, prods, revs]) => {
      setPackages(pkgs);
      setProducts(prods);
      setReviews(revs);
      setLoading(false);
    });

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#2E7D32] rounded-full animate-spin" />
      </div>
    );
  }

  const bestSellers = products.filter((p) => p.is_best_seller);
  const weeklyDeals = products.filter((p) => p.is_weekly_deal);

  return (
    <PullToRefresh onRefresh={loadData}>
    <div className="space-y-8 pb-4">
      <div className="px-4 pt-3">
        <QuickCategories />
      </div>
      <div className="px-4">
        <PromoBanner />
      </div>
      <WeeklyDeals products={weeklyDeals} />
      <MealKitBanner />
      <PopularMealKits packages={packages} />
      <PackageCarousel packages={packages} />
      <ShopByBudget />
      <FeaturedCategories />
      <BestSellers products={bestSellers} />
      <CustomerReviews reviews={reviews} />
      <InfiniteProductGrid products={products} />
    </div>
    </PullToRefresh>
  );
}