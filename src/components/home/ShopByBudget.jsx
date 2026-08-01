import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Image } from '@/components/ui/image';

const budgets = [
  {
    label: 'Under ₦10,000',
    range: 'under-10000',
    image: 'https://media.base44.com/images/public/6a5b618b391a439e5e7749cc/4d5a60cdb_6B0E7B31-8A6B-4A4C-A3C8-B1021C819EC6.png',
  },
  {
    label: '₦10,000 – ₦20,000',
    range: '10000-20000',
    image: 'https://media.base44.com/images/public/6a5b618b391a439e5e7749cc/8b656a89c_4E0590D9-DDED-42E3-B316-B3771C5FE41D.png',
  },
  {
    label: '₦20,000+',
    range: 'over-20000',
    image: 'https://media.base44.com/images/public/6a5b618b391a439e5e7749cc/df63f1381_A03C7B63-6C24-45CD-8997-AA8633C1C23B.png',
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
            aria-label={b.label}
            className="relative rounded-2xl overflow-hidden h-28 flex flex-col justify-end hover:opacity-90 transition-opacity"
          >
            <Image
              src={b.image}
              alt={b.label}
              className="absolute inset-0 w-full h-full"
              fittingType="fill"
            />
          </button>
        ))}
      </div>
    </section>
  );
}