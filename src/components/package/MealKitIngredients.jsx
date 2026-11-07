import React from 'react';
import { ListChecks } from 'lucide-react';

// The ingredients that come inside a meal kit.
export default function MealKitIngredients({ items }) {
  const list = (items || []).filter((i) => i.active !== false && i.name);
  if (list.length === 0) return null;

  return (
    <div className="px-3 mt-5">
      <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-1.5">
        <ListChecks className="w-4 h-4 text-[#2E7D32]" /> What&apos;s in the kit
      </h2>
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
        {list.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2.5 px-4 py-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] shrink-0" />
            <span className="flex-1 text-sm font-medium text-gray-900 truncate">
              {item.name}
            </span>
            {(item.quantity || item.unit) && (
              <span className="text-xs text-gray-500 shrink-0">
                {[item.quantity, item.unit].filter(Boolean).join(' ')}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}