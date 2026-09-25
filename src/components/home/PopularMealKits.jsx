import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Users, ShoppingBag } from 'lucide-react';

export default function PopularMealKits({ packages }) {
  const navigate = useNavigate();
  const mealKits = (packages || [])
    .filter((p) => p.group === 'meal_kits')
    .slice(0, 6);

  if (!mealKits.length) return null;

  return (
    <section className="px-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900">Popular Meal Kits</h2>
        <Link
          to="/packages#meal-kits"
          className="flex items-center gap-0.5 text-xs font-semibold text-[#2E7D32] active:scale-95 transition-transform"
        >
          See All <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
        {mealKits.map((kit) => (
          <div
            key={kit.id}
            onClick={() => navigate(`/package/${kit.id}`)}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col w-40 shrink-0 active:scale-[0.98] transition-transform cursor-pointer"
          >
            <div className="relative h-28 bg-gray-50">
              {kit.image ? (
                <img
                  src={kit.image}
                  alt={kit.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#E8F5E9]">
                  <ShoppingBag className="w-7 h-7 text-[#2E7D32]/40" />
                </div>
              )}
              <span className="absolute top-1.5 left-1.5 bg-[#2E7D32] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                Meal Kit
              </span>
            </div>
            <div className="p-2.5 flex flex-col flex-1">
              <h3 className="text-xs font-bold text-gray-900 leading-tight line-clamp-1">
                {kit.name}
              </h3>
              <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                <Users className="w-3 h-3" /> {kit.serves || 'Serves 4-6'}
              </div>
              <span className="text-sm font-bold text-[#2E7D32] mt-1">
                ₦{(kit.total_price || kit.starting_price || 0).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}