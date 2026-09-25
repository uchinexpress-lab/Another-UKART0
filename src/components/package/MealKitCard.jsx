import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Eye } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function MealKitCard({ pkg }) {
  const navigate = useNavigate();
  const { addItem } = useCart();

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col h-full">
      <div className="relative h-32 bg-gray-50">
        <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover" />
        <span className="absolute top-2 left-2 bg-[#2E7D32] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
          Meal Kit
        </span>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-sm font-bold text-card-foreground leading-tight mb-0.5">{pkg.name}</h3>
        <p className="text-[11px] text-gray-500 line-clamp-1 mb-1.5">{pkg.description}</p>
        <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-2">
          <Users className="w-3 h-3" />
          <span>{pkg.serves || 'Serves 2-4'}</span>
        </div>
        <span className="text-base font-bold text-[#2E7D32] mb-2">
          ₦{pkg.starting_price.toLocaleString()}
        </span>
        <div className="flex gap-1.5 mt-auto">
          <button
            onClick={() => navigate(`/package/${pkg.id}`)}
            className="flex-1 flex items-center justify-center gap-1 border border-[#2E7D32] text-[#2E7D32] text-[11px] font-semibold py-1.5 rounded-full hover:bg-[#E8F5E9] transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> Details
          </button>
          <button
            onClick={() =>
              addItem({
                id: `package-${pkg.id}`,
                name: pkg.name,
                price: pkg.total_price,
                image: pkg.image,
                unit: pkg.serves || 'Meal Kit',
              })
            }
            className="flex-1 flex items-center justify-center gap-1 bg-[#2E7D32] text-white text-[11px] font-semibold py-1.5 rounded-full hover:bg-[#1B5E20] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}