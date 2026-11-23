
import React from 'react';
import { MapPin, Navigation, X } from 'lucide-react';
import { useLocation } from '@/context/LocationContext';

export default function LocationPrompt() {
  const { status, retry, dismissPrompt, promptDismissed } = useLocation();

  const show =
    !promptDismissed &&
    (status === 'denied' || status === 'unavailable' || status === 'error');

  if (!show) return null;

  const isDenied = status === 'denied';

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-3">
      <div className="w-full max-w-[340px] bg-white rounded-2xl p-5 pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-2xl animate-[slideUp_0.25s_ease-out]">

        <div className="flex justify-end -mt-2 -mr-2">
          <button
            onClick={dismissPrompt}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 transition-transform"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-col items-center text-center -mt-2">

          <div className="w-12 h-12 rounded-full bg-[#E8F5E9] flex items-center justify-center mb-3">
            <MapPin className="w-6 h-6 text-[#2E7D32]" strokeWidth={2} />
          </div>

          <h2 className="text-base font-bold text-[#1a2238] mb-1">
            Turn on location
          </h2>

          <p className="text-xs text-gray-500 leading-relaxed px-2 mb-4">
            Find available groceries, nearby stores and delivery times in your area.
          </p>

          <button
            onClick={retry}
            className="w-full h-11 rounded-full bg-[#2E7D32] text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Navigation className="w-4 h-4" strokeWidth={2.5} />
            {isDenied ? 'Enable location' : 'Try again'}
          </button>

          <button
            onClick={dismissPrompt}
            className="w-full h-10 mt-1 text-xs font-semibold text-gray-600 active:opacity-70"
          >
            Choose area manually
          </button>

          {isDenied && (
            <p className="text-[10px] text-gray-400 mt-2 leading-relaxed px-2">
              Location access was blocked. Enable it in your browser or device settings, then try again.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}