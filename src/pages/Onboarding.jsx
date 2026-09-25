import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Image } from '@/components/ui/image';

// Onboarding slides — each image is the full designed screen (source of truth).
// Add images here as they are provided.
const SLIDES = [
  {
    image:
      'https://media.base44.com/images/public/6a5b618b391a439e5e7749cc/fb0338633_file_00000000182c81f4a48501a7bc97877f.png',
  },
];

const ONBOARDING_KEY = 'ukart_onboarding_complete';

export default function Onboarding() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  // If already completed, don't show again — go to login.
  if (typeof window !== 'undefined' && localStorage.getItem(ONBOARDING_KEY) === 'true') {
    return <Navigate to="/login" replace />;
  }

  const finish = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {}
    navigate('/login', { replace: true });
  };

  const next = () => {
    if (index < SLIDES.length - 1) {
      setIndex((i) => i + 1);
    } else {
      finish();
    }
  };

  const slide = SLIDES[index];

  return (
    <div className="fixed inset-0 bg-white overflow-hidden select-none">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 36 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -36 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          <Image
            src={slide.image}
            fittingType="fill"
            alt=""
            className="block w-full h-full"
          />
        </motion.div>
      </AnimatePresence>

      {/* Skip — invisible tap target over the top-right "Skip" in the design */}
      <button
        onClick={finish}
        aria-label="Skip onboarding"
        className="absolute top-0 right-0 z-10 pt-[calc(env(safe-area-inset-top)+14px)] pr-5 pb-6 pl-10 text-transparent active:opacity-70"
        style={{ minHeight: 44 }}
      >
        Skip
      </button>

      {/* Next / FAB — invisible tap target over the bottom-right arrow in the design */}
      <button
        onClick={next}
        aria-label={index < SLIDES.length - 1 ? 'Next' : 'Get started'}
        className="absolute bottom-0 right-0 z-10 p-7 pb-[calc(env(safe-area-inset-bottom)+22px)] text-transparent active:opacity-70"
        style={{ minHeight: 44, minWidth: 44 }}
      >
        Next
      </button>
    </div>
  );
}