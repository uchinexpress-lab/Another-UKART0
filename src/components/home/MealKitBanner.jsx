import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import { usePageContent } from '@/lib/usePageContent';
import BannerSlider from '@/components/banners/BannerSlider';

const DEFAULT_BANNER_URL =
  'https://images.pexels.com/photos/7657072/pexels-photo-7657072.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

export default function MealKitBanner() {
  const navigate = useNavigate();
  const { getField } = usePageContent('home');

  const bannerUrl = getField('meal_kit_banner_image', DEFAULT_BANNER_URL);
  const ctaLink = getField('meal_kit_cta_link', '/packages#meal-kits');

  return (
    <section className="px-4" style={{ marginTop: '0.5rem', marginBottom: '-0.75rem' }}>
      <BannerSlider location="meal_kits" rounded="rounded-2xl" aspectRatio={2172 / 558}>
        <button
          onClick={() => navigate(ctaLink)}
          className="relative w-full rounded-2xl overflow-hidden block active:scale-[0.98] transition-transform"
          style={{ aspectRatio: '2172 / 558' }}
          aria-label="Explore Ukart Meal Kits"
        >
          <Image
            src={bannerUrl}
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