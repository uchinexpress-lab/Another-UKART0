import React from 'react';
import { Image } from '@/components/ui/image';

/**
 * MealKitImage — renders a meal kit photo with the consistent Ukart branded
 * treatment: a subtle green overlay (~18% opacity) plus a soft white→green
 * gradient anchored at the top (where badges/text sit), fading toward the
 * center so the hero food stays sharp and vivid. No blur, no desaturation.
 *
 * Renders the responsive Image component (Wix Media transforms + fallback)
 * followed by two absolutely-positioned overlay layers. The parent must be
 * a positioned (relative) container that sets the size.
 */
export default function MealKitImage({
  src,
  alt,
  className,
  fittingType = 'fill',
  focalPointX,
  focalPointY,
}) {
  return (
    <>
      <Image
        src={src}
        alt={alt}
        fittingType={fittingType}
        focalPointX={focalPointX}
        focalPointY={focalPointY}
        className={className}
      />
      {/* Subtle green Ukart brand overlay */}
      <div className="absolute inset-0 bg-[#2E7D32]/[0.18] pointer-events-none" />
      {/* Soft white→green gradient behind top badges/text, fading to center */}
      <div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-white/55 via-[#E8F5E9]/25 to-transparent pointer-events-none" />
    </>
  );
}