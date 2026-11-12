import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Image } from '@/components/ui/image';

const budgets = [
  {
    label: 'Under ₦10,000',
    range: 'under-10000',
    image: 'https://images.pexels.com/photos/37321079/pexels-photo-37321079.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    label: '₦10,000 – ₦20,000',
    range: '10000-20000',
    image: 'https://images.pexels.com/photos/8287244/pexels-photo-8287244.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    label: '₦20,000+',
    range: 'over-20000',
    image: 'https://images.pexels.com/photos/7363085/pexels-photo-7363085.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
];

export default function ShopByBudget() {
  const navigate = useNavigate();

  return (
    <section className="px-4">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Shop by Budget</h2>
      <p className="text-xs text-gray-500 mb-2">Shop within your budget</p>
      <div className="grid grid-cols-3 gap-2.5">
        {budgets.map((b) => (
          <button
            key={b.range}
            onClick={() => navigate(`/budget/${b.range}`)}
            aria-label={b.label}
            className="relative rounded-2xl overflow-hidden h-24 flex flex-col justify-end hover:opacity-90 transition-opacity"
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