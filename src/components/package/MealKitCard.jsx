import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ShoppingBag, ChevronRight } from 'lucide-react';
import { Image } from '@/components/ui/image';

const STOCK_CFG = {
  in_stock: {
    label: 'IN STOCK',
    sub: 'Ready to order',
    dot: 'bg-[#2E7D32]',
    text: 'text-[#2E7D32]',
  },
  low_stock: {
    label: 'LOW STOCK',
    sub: 'Order soon',
    dot: 'bg-amber-500',
    text: 'text-amber-600',
  },
  out_of_stock: {
    label: 'OUT OF STOCK',
    sub: 'Currently unavailable',
    dot: 'bg-red-500',
    text: 'text-red-600',
  },
};

export default function MealKitCard({ pkg }) {
  const navigate = useNavigate();
  const stock = STOCK_CFG[pkg.stock_status] || STOCK_CFG.in_stock;

  return (
    <div
      onClick={() => navigate(`/package/${pkg.id}`)}
      className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col h-full active:scale-[0.98] transition-transform cursor-pointer"
    >
      <div className="relative h-32 bg-gray-50 overflow-hidden">
        {pkg.image ? (
          <Image
            src={pkg.image}
            alt={pkg.name}
            fittingType="fill"
            className="absolute inset-0 w-full h-full scale-105 blur-[2px]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#E8F5E9]">
            <ShoppingBag className="w-8 h-8 text-[#2E7D32]/40" />
          </div>
        )}
        <span className="absolute top-2 left-2 bg-[#2E7D32] text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-10">
          Meal Kit
        </span>

        {/* Availability banner across the middle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[86%] z-10">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/85 backdrop-blur-sm shadow-sm border border-white/60">
            <span className={`w-2 h-2 rounded-full ${stock.dot} shrink-0`} />
            <div className="leading-tight">
              <div className={`text-[10px] font-bold tracking-wide ${stock.text}`}>
                {stock.label}
              </div>
              <div className="text-[9px] text-gray-500 leading-tight">
                {stock.sub}
              </div>
            </div>
          </div>
        </div>
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