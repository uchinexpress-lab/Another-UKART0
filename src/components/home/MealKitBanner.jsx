import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import BannerSlider from '@/components/banners/BannerSlider';

const BANNER_URL =
  'https://media.base44.com/images/public/6a5b618b391a439e5e7749cc/3f02716ea_80948D94-EADE-4581-AA25-CA71CF4BA066.png';

export default function MealKitBanner() {
  const navigate = useNavigate();

  return (
    <section className="px-4" style={{ marginTop: '0.5rem', marginBottom: '-0.75rem' }}>
      <BannerSlider location="meal_kits" rounded="rounded-2xl">
        <button
          onClick={() => navigate('/packages#meal-kits')}
          className="relative w-full rounded-2xl overflow-hidden block active:scale-[0.98] transition-transform"
          style={{ aspectRatio: '16 / 7' }}
          aria-label="Explore Ukart Meal Kits"
        >
          <Image
            src={BANNER_URL}
            alt="Ukart Meal Kits — Cook Something Delicious"
            className="absolute inset-0 w-full h-full"
            fittingType="fit"
            focalPointX={0.5}
            focalPointY={0.5}
          />
        </button>
      </BannerSlider>
    </section>
  );
}