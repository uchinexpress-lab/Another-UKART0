import React from 'react';
import { MapPin, Navigation, X } from 'lucide-react';
import { useLocation } from '@/context/LocationContext';

export default function LocationPrompt() {
  const { status, retry, dismissPrompt, promptDismissed } = useLocation();

  const show =
    !promptDismissed && (status === 'denied' || status === 'unavailable' || status === 'error');

  if (!show) return null;

  const isDenied = status === 'denied';

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-[calc(env(safe-area-inset-bottom)+24px)] shadow-2xl animate-[slideUp_0.25s_ease-out]">
        <div className="flex justify-end -mt-2 -mr-2">
          <button
            onClick={dismissPrompt}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 transition-transform"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-col items-center text-center -mt-4">
          <div className="w-16 h-16 rounded-full bg-[#E8F5E9] flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-[#2E7D32]" strokeWidth={2} />
          </div>
          <h2 className="text-lg font-bold text-[#1a2238] mb-1.5">
            Turn on location
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed px-2 mb-6">
            We use your location to show delivery times, stores, and items
            available in your area.
          </p>

          <button
            onClick={retry}
            className="w-full h-12 rounded-full bg-[#2E7D32] text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Navigation className="w-4 h-4" strokeWidth={2.5} />
            {isDenied ? 'Enable location' : 'Try again'}
          </button>
          <button
            onClick={dismissPrompt}
            className="w-full h-11 mt-2 text-sm font-medium text-gray-500 active:opacity-70"
          >
            Choose area manually
          </button>

          {isDenied && (
            <p className="text-xs text-gray-400 mt-3 leading-relaxed">
              Location access was blocked. Enable it in your browser or device
              settings, then tap “Enable location”.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}