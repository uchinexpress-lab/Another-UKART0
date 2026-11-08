import React from 'react';
import { Plus } from 'lucide-react';
import { Image } from '@/components/ui/image';

// Optional extras the admin attached to a meal kit, shown so customers can see
// exactly what comes with the kit.
export default function MealKitOptionalItems({ items }) {
  const list = (items || []).filter((i) => i && i.name && i.active !== false);
  if (list.length === 0) return null;

  return (
    <div className="px-3 mt-5">
      <h2 className="text-base font-bold text-gray-900 mb-1">Optional Items</h2>
      <p className="text-xs text-gray-400 mb-3">Also available with this kit</p>
      <div className="grid grid-cols-2 gap-2.5">
        {list.map((item, idx) => (
          <div
            key={`${item.name}-${idx}`}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          >
            {item.image ? (
              <Image
                src={item.image}
                alt={item.name}
                fittingType="fill"
                className="w-full h-24"
              />
            ) : (
              <div className="w-full h-24 bg-[#F1F8F2] flex items-center justify-center">
                <Plus className="w-5 h-5 text-[#2E7D32]/40" />
              </div>
            )}
            <div className="p-2.5">
              <p className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2">
                {item.name}
              </p>
              {item.price > 0 && (
                <p className="text-xs font-bold text-[#2E7D32] mt-1">
                  ₦{item.price.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}