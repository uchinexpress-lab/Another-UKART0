import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useSmartBack } from '@/lib/navigation';

export default function BackHeader() {
  const goBack = useSmartBack('/');

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="Back"
      className="fixed top-3 left-3 z-50 w-11 h-11 rounded-full bg-white/80 backdrop-blur-md shadow-md flex items-center justify-center hover:bg-white active:scale-90 transition-transform touch-manipulation"
    >
      <ArrowLeft className="w-5 h-5 text-gray-700" />
    </button>
  );
}