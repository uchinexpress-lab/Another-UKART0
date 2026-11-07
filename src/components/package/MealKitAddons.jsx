import React from 'react';
import { Check } from 'lucide-react';

// Paid extras the admin attached to a meal kit (e.g. extra pepper, ground crayfish).
export default function MealKitAddons({ addons, selected, onToggle }) {
  const list = (addons || [])
    .map((addon, index) => ({ addon, index }))
    .filter(({ addon }) => addon && addon.name && addon.active !== false && addon.available !== false);

  if (list.length === 0) return null;

  return (
    <div className="px-3 mt-5">
      <h2 className="text-base font-bold text-gray-900 mb-1">Add-ons</h2>
      <p className="text-xs text-gray-400 mb-3">Optional extras for this kit</p>
      <div className="space-y-2.5">
        {list.map(({ addon, index }) => {
          const active = !!selected[index];
          return (
            <button
              key={index}
              onClick={() => onToggle(index)}
              className={`w-full flex items-center gap-3 bg-white rounded-2xl border p-3.5 text-left transition-colors ${
                active ? 'border-[#2E7D32] bg-[#F1F8F2]' : 'border-gray-100'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                  active
                    ? 'bg-[#2E7D32] border-[#2E7D32]'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {active && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-gray-900 truncate">
                  {addon.name}
                </span>
                {addon.description && (
                  <span className="block text-xs text-gray-500 truncate">
                    {addon.description}
                  </span>
                )}
              </span>
              <span className="text-sm font-bold text-[#2E7D32] shrink-0">
                {addon.price > 0 ? `+₦${addon.price.toLocaleString()}` : 'Free'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}