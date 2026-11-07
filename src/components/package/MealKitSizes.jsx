import React from 'react';

// Size choices for a meal kit (Small, Family…). Selecting one can change the price.
export default function MealKitSizes({ sizes, selectedIndex, onSelect }) {
  const list = (sizes || [])
    .map((size, index) => ({ size, index }))
    .filter(({ size }) => size.available !== false && size.label);

  if (list.length === 0) return null;

  return (
    <div className="px-3 mt-5">
      <h2 className="text-base font-bold text-gray-900 mb-3">Choose a size</h2>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {list.map(({ size, index }) => {
          const active = selectedIndex === index;
          return (
            <button
              key={index}
              onClick={() => onSelect(index)}
              className={`shrink-0 text-left px-4 py-2.5 rounded-2xl border transition-colors ${
                active
                  ? 'bg-[#2E7D32] border-[#2E7D32] text-white'
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              <span className="block text-sm font-bold leading-tight">{size.label}</span>
              <span
                className={`block text-[11px] leading-tight mt-0.5 ${
                  active ? 'text-white/85' : 'text-gray-500'
                }`}
              >
                {size.serves || '—'} · ₦{(size.price || 0).toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}