import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Image } from '@/components/ui/image';

const BANNER_URL =
  'https://media.base44.com/images/public/6a5b618b391a439e5e7749cc/3f02716ea_80948D94-EADE-4581-AA25-CA71CF4BA066.png';

export default function MealKitBanner() {
  const navigate = useNavigate();

  return (
    <section className="px-4">
      <button
        onClick={() => navigate('/packages#meal-kits')}
        className="relative w-full rounded-3xl overflow-hidden h-44 block active:scale-[0.98] transition-transform"
        aria-label="Explore Ukart Meal Kits"
      >
        <Image
          src={BANNER_URL}
          alt="Ukart Meal Kits — Cook Something Delicious"
          className="absolute inset-0 w-full h-full"
          fittingType="fill"
          focalPointX={0.35}
        />
      </button>
    </section>
  );
}