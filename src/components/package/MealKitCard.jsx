import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ShoppingBag, ChevronRight } from 'lucide-react';

export default function MealKitCard({ pkg }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/package/${pkg.id}`)}
      className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col h-full active:scale-[0.98] transition-transform cursor-pointer"
    >
      <div className="relative h-32 bg-gray-50">
        {pkg.image ? (
          <img
            src={pkg.image}
            alt={pkg.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#E8F5E9]">
            <ShoppingBag className="w-8 h-8 text-[#2E7D32]/40" />
          </div>
        )}
        <span className="absolute top-2 left-2 bg-[#2E7D32] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
          Meal Kit
        </span>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-sm font-bold text-card-foreground leading-tight line-clamp-1">
          {pkg.name}
        </h3>
        <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
          <Users className="w-3 h-3" />
          <span>{pkg.serves || 'Serves 4-6'}</span>
        </div>
        <span className="text-base font-bold text-[#2E7D32] mt-1">
          ₦{(pkg.total_price || pkg.starting_price || 0).toLocaleString()}
        </span>
        <div className="flex items-center justify-center gap-1 mt-2 w-full h-8 rounded-full border border-[#2E7D32] text-[#2E7D32] text-xs font-semibold">
          View Kit <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}