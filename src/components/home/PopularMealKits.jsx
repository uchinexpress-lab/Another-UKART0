import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Users, Plus } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function PopularMealKits({ packages }) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const mealKits = (packages || []).filter((p) => p.group === 'meal_kits').slice(0, 4);

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
      <div className="space-y-2.5">
        {mealKits.map((kit) => (
          <div
            key={kit.id}
            onClick={() => navigate(`/package/${kit.id}`)}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex h-24 active:scale-[0.98] transition-transform cursor-pointer"
          >
            <div className="w-24 flex-shrink-0 bg-gray-50">
              <img src={kit.image} alt={kit.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-2.5 flex flex-col flex-1">
              <h3 className="text-xs font-bold text-gray-900 leading-tight line-clamp-1">
                {kit.name}
              </h3>
              <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                <Users className="w-3 h-3" /> {kit.serves}
              </div>
              <div className="flex items-center justify-between mt-auto">
                <div>
                  <span className="text-[9px] text-gray-400 block leading-none">from</span>
                  <span className="text-sm font-bold text-[#2E7D32]">
                    ₦{kit.starting_price.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addItem({
                      id: `package-${kit.id}`,
                      name: kit.name,
                      price: kit.total_price,
                      image: kit.image,
                      unit: kit.serves || 'Meal Kit',
                    });
                  }}
                  className="w-7 h-7 rounded-full bg-[#2E7D32] flex items-center justify-center hover:bg-[#1B5E20] transition-colors flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}