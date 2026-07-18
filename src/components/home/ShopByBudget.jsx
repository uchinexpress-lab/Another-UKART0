import React from 'react';
import { useNavigate } from 'react-router-dom';

const budgets = [
  {
    label: 'Under ₦10,000',
    range: 'under-10000',
    style: { background: 'linear-gradient(135deg, #76C237, #2E7D32)' },
  },
  {
    label: '₦10,000 – ₦20,000',
    range: '10000-20000',
    style: { background: 'linear-gradient(135deg, #66BB6A, #1B5E20)' },
  },
  {
    label: '₦20,000+',
    range: 'over-20000',
    style: { background: 'linear-gradient(135deg, #81C784, #388E3C)' },
  },
];

export default function ShopByBudget() {
  const navigate = useNavigate();

  return (
    <section className="px-4">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Shop by Budget</h2>
      <p className="text-xs text-gray-500 mb-3">Shop within your budget</p>
      <div className="grid grid-cols-3 gap-2.5">
        {budgets.map((b) => (
          <button
            key={b.range}
            onClick={() => navigate(`/budget/${b.range}`)}
            style={b.style}
            className="rounded-2xl p-3 text-left h-24 flex flex-col justify-between hover:opacity-90 transition-opacity"
          >
            <span className="text-base">💚</span>
            <span className="text-[11px] font-bold text-white leading-tight">{b.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}