import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { usePageContent } from '@/lib/usePageContent';
import QuickCategories from '@/components/categories/QuickCategories';
import PromoBanner from '@/components/home/PromoBanner';
import PackageCarousel from '@/components/home/PackageCarousel';
import FeaturedCategories from '@/components/home/FeaturedCategories';
import BestSellers from '@/components/home/BestSellers';
import WeeklyDeals from '@/components/home/WeeklyDeals';
import PopularMealKits from '@/components/home/PopularMealKits';
import MealKitBanner from '@/components/home/MealKitBanner';
import CustomerReviews from '@/components/home/CustomerReviews';
import InfiniteProductGrid from '@/components/home/InfiniteProductGrid';
import PullToRefresh from '@/components/home/PullToRefresh';
import BannerSlider from '@/components/banners/BannerSlider';
import { currentHourSeed, hourlyShuffle } from '@/lib/hourlyShuffle';

export default function Home() {
  const { isSectionVisible } = usePageContent('home');
  const [packages, setPackages] = useState([]);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [weeklyDeals, setWeeklyDeals] = useState([]);
  const [explorePool, setExplorePool] = useState([]);
  const [hourSeed, setHourSeed] = useState(currentHourSeed);
  const [loading, setLoading] = useState(true);

  const loadData = () =>
  Promise.all([
  base44.entities.Package.list(),
  base44.entities.Product.list(),
  base44.entities.Review.list(),
  base44.entities.HomepageSection.list()]
  ).then(([pkgs, allProds, revs, hsections]) => {
    // Products the admin hid stay in the admin panel only.
    const prods = allProds.filter((p) => !p.is_hidden);
    const sMap = {};
    hsections.forEach(s => { sMap[s.section] = s.product_ids || []; });
    const wdIds = sMap.weekly_deals || [];
    const wdProducts = wdIds.map(sid => prods.find(p => p.id === sid)).filter(Boolean);
    const finalWd = wdProducts.length > 0 ? wdProducts : prods.filter(p => p.is_weekly_deal);
    const mteIds = sMap.more_to_explore || [];
    const mteProducts = mteIds.map(sid => prods.find(p => p.id === sid)).filter(Boolean);
    const finalMte = mteProducts.length > 0 ? mteProducts : prods;
    setPackages(pkgs);
    setProducts(prods);
    setReviews(revs);
    setWeeklyDeals(finalWd);
    setExplorePool(finalMte);
  }).catch((e) => {
    console.error('Failed to load home content:', e);
  }).finally(() => {
    setLoading(false);
  });

  useEffect(() => {
    loadData();
  }, []);

  // More to Explore reshuffles itself as each new hour starts.
  useEffect(() => {
    const now = Date.now();
    const nextHour = (Math.floor(now / 3600000) + 1) * 3600000;
    const timer = setTimeout(
      () => setHourSeed(currentHourSeed()),
      Math.max(1000, nextHour - now)
    );
    return () => clearTimeout(timer);
  }, [hourSeed]);

  const moreToExplore = useMemo(
    () => hourlyShuffle(explorePool, hourSeed),
    [explorePool, hourSeed]
  );

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#2E7D32] rounded-full animate-spin" />
      </div>);

  }

  const bestSellers = products.filter((p) => p.is_best_seller);

  return (
    <PullToRefresh onRefresh={loadData}>
    <div className="space-y-5 pb-4">
      {isSectionVisible('categories', true) && (
        <div className="px-4 pt-1">
          <QuickCategories />
        </div>
      )}
      {isSectionVisible('promo_banner', true) && (
        <div className="px-4">
          <PromoBanner />
        </div>
      )}
      {isSectionVisible('deals', true) && <WeeklyDeals products={weeklyDeals} />}
      {isSectionVisible('meal_kits', true) && <MealKitBanner />}
      {isSectionVisible('meal_kits', true) && <PopularMealKits packages={packages} />}
      {isSectionVisible('packages', true) && <PackageCarousel packages={packages} />}
      {isSectionVisible('categories', true) && <FeaturedCategories />}
      <BestSellers products={bestSellers} />
      {isSectionVisible('reviews', true) && <CustomerReviews reviews={reviews} />}
      <InfiniteProductGrid products={moreToExplore} />
    </div>
    </PullToRefresh>);

}