import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { BANNER_LOCATIONS } from '@/lib/bannerConfig';

/**
 * Renders the text overlay (gradient + badge + heading + subheading + CTA)
 * for banners that have overlay content. Matches the original hardcoded
 * PromoBanner design so migration is visually seamless.
 */
function BannerOverlay({ banner, onCtaClick }) {
  const hasOverlay =
    banner.show_overlay ||
    banner.heading ||
    banner.badge_text ||
    banner.cta_text;
  if (!hasOverlay) return null;

  return (
    <>
      {banner.show_overlay && (
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'linear-gradient(135deg, rgba(27,94,32,0.55) 0%, rgba(46,125,50,0.30) 100%)',
          }}
        />
      )}
      <div className="relative p-5 h-full flex flex-col justify-center">
        {banner.badge_text && (
          <span className="inline-block bg-white/25 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-1 rounded-full mb-2 tracking-wide w-fit">
            {banner.badge_text}
          </span>
        )}
        {banner.heading && (
          <h2 className="text-2xl font-bold text-white leading-tight tracking-tight drop-shadow-md">
            {banner.heading}
          </h2>
        )}
        {banner.subheading && (
          <p className="text-xs text-white/95 mt-1 mb-3 max-w-[210px] font-medium drop-shadow-sm">
            {banner.subheading}
          </p>
        )}
        {banner.cta_text && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCtaClick();
            }}
            className="inline-flex items-center gap-1.5 bg-white text-[#2E7D32] text-xs font-bold px-4 py-2 rounded-full hover:bg-gray-50 active:scale-95 transition-all w-fit shadow-md"
          >
            {banner.cta_text} <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </>
  );
}

/**
 * Customer-facing banner slider.
 * Loads active banners for a location from the Banner entity and displays them
 * as a carousel with auto-slide, arrows, and dots.
 *
 * Falls back to children if no banners exist for the location (preserves
 * existing hardcoded banners until the admin adds managed ones).
 *
 * Uses saved zoom/position/fit settings for consistent responsive display.
 * Renders text overlay (heading, CTA, badge) when the banner has overlay fields.
 */
export default function BannerSlider({ location, className = '', rounded = 'rounded-3xl', aspectRatio: frameAspectRatio, children }) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    base44.entities.Banner.list()
      .then((all) => {
        if (!mounted) return;
        const filtered = all
          .filter((b) => b.location === location && b.active)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setBanners(filtered);
        setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [location]);

  // Auto-slide
  useEffect(() => {
    if (banners.length <= 1) return;
    const first = banners[0];
    if (!first.auto_slide) return;
    const duration = (first.slide_duration || 5) * 1000;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % banners.length);
    }, duration);
    return () => clearInterval(timer);
  }, [banners, current]);

  if (loading) return null;
  if (banners.length === 0) return children;

  const config = BANNER_LOCATIONS[location];
  const aspectRatio = frameAspectRatio ?? config?.aspectRatio ?? 16 / 7;

  const handleClick = (banner) => {
    if (banner.link) navigate(banner.link);
  };

  const getBgStyle = (banner) => ({
    backgroundImage: `url(${banner.image})`,
    backgroundSize: banner.zoom > 1
      ? `${banner.zoom * 100}%`
      : banner.fit_mode === 'contain' ? 'contain' : 'cover',
    backgroundPosition: `${banner.pos_x || 50}% ${banner.pos_y || 50}%`,
    backgroundRepeat: 'no-repeat',
  });

  return (
    <div
      className={`relative ${rounded} overflow-hidden bg-gray-50 ${className}`}
      style={{ aspectRatio }}
    >
      {/* Slides */}
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="relative w-full h-full flex-shrink-0"
            onClick={() => handleClick(banner)}
            role={banner.link ? 'button' : undefined}
          >
            <div className="absolute inset-0" style={getBgStyle(banner)} />
            <BannerOverlay
              banner={banner}
              onCtaClick={() => navigate(banner.link || '/categories')}
            />
          </div>
        ))}
      </div>

      {/* Arrows (only if multiple banners) */}
      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrent((c) => (c - 1 + banners.length) % banners.length);
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white/90 active:scale-90 transition-all z-10"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrent((c) => (c + 1) % banners.length);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white/90 active:scale-90 transition-all z-10"
            aria-label="Next banner"
          >
            <ChevronRight className="w-4 h-4 text-gray-700" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrent(idx);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  idx === current ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}