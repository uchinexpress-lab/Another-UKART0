import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useAuth } from '@/lib/AuthContext';

const STORAGE_KEY = 'ukart_delivery_location';
const DISMISSED_KEY = 'ukart_location_prompt_dismissed';

const ISLAND_MATCHERS = [
  { match: ['ajah'], name: 'Ajah' },
  { match: ['lekki'], name: 'Lekki Phase 1' },
  { match: ['victoria island', 'victoria'], name: 'Victoria Island' },
  { match: ['ikoyi'], name: 'Ikoyi' },
  { match: ['chevron'], name: 'Chevron' },
  { match: ['vgc', 'victoria garden'], name: 'VGC' },
  { match: ['sangotedo'], name: 'Sangotedo' },
  { match: ['abraham adesanya'], name: 'Abraham Adesanya' },
  { match: ['ikate'], name: 'Ikate' },
  { match: ['oniru'], name: 'Oniru' },
  { match: ['eti-osa', 'etiosa'], name: 'Lekki' },
];

function classify(rawName, coords = null) {
  const n = (rawName || '').toLowerCase();

  for (const m of ISLAND_MATCHERS) {
    if (m.match.some((k) => n.includes(k))) {
      return {
        area: m.name,
        zone: 'island',
        line2: '🛵 Estimated delivery: 30 mins',
      };
    }
  }

  // Coordinate fallback for Lagos Island / Lekki-Epe corridor (Ikoyi/VI east to Sangotedo/Ajah)
  if (
    coords &&
    typeof coords.latitude === 'number' &&
    typeof coords.longitude === 'number' &&
    coords.latitude >= 6.40 &&
    coords.latitude <= 6.49 &&
    coords.longitude >= 3.39 &&
    coords.longitude <= 3.70
  ) {
    const islandArea =
      rawName && !['lagos', 'nigeria', 'eti-osa'].includes(n)
        ? rawName
        : 'Lekki / Ajah';
    return {
      area: islandArea,
      zone: 'island',
      line2: '🛵 Estimated delivery: 30 mins',
    };
  }

  const area =
    rawName && !['lagos', 'nigeria'].includes(n)
      ? rawName
      : 'Lagos Mainland';

  return {
    area,
    zone: 'mainland',
    line2: '🚚 Delivery: Same Day',
  };
}

function getSavedLocation() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function getSavedDismissal() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const { user } = useAuth();
  const [location, setLocation] = useState(getSavedLocation);
  const [status, setStatus] = useState(() =>
    getSavedLocation() ? 'detected' : 'idle'
  );
  const [promptDismissed, setPromptDismissed] = useState(getSavedDismissal);

  const detect = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable');
      return;
    }

    setStatus('requesting');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );

          if (!res.ok) throw new Error('Location lookup failed');
          const data = await res.json();

          // Gather all neighborhood/admin labels so specific Lagos areas aren't lost
          const adminNames = [
            data.locality,
            data.city,
            ...(data.localityInfo?.administrative || []).map((a) => a.name),
            ...(data.localityInfo?.informative || []).map((i) => i.name),
          ].filter(Boolean);

          const matchedIsland = adminNames.find((label) =>
            ISLAND_MATCHERS.some((m) =>
              m.match.some((k) => label.toLowerCase().includes(k))
            )
          );

          const rawName =
            matchedIsland ||
            data.locality ||
            data.city ||
            data.principalSubdivision ||
            'Lagos';

          const loc = { ...classify(rawName, { latitude, longitude }), manual: false };

          setLocation(loc);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
          localStorage.removeItem(DISMISSED_KEY);

          setPromptDismissed(false);
          setStatus('detected');
        } catch {
          // Even if reverse-geocode fails, classify accurately using GPS coordinates
          const loc = { ...classify('', { latitude, longitude }), manual: false };
          setLocation(loc);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
          setStatus('detected');
        }
      },
      (error) => {
        if (error.code === 1) {
          setStatus('denied');
        } else {
          setStatus('error');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, []);

  // Automatically detect location on first visit AND right after a customer logs in (unless manually overridden)
  useEffect(() => {
    if (location?.manual) return;
    if (!location && promptDismissed && !user?.id) return;
    detect();
  }, [user?.id]);

  const setManual = useCallback((areaName) => {
    const loc = { ...classify(areaName), manual: true };

    setLocation(loc);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    localStorage.setItem(DISMISSED_KEY, 'true');

    setStatus('detected');
    setPromptDismissed(true);
  }, []);

  const retry = useCallback(() => {
    localStorage.removeItem(DISMISSED_KEY);
    setPromptDismissed(false);
    detect();
  }, [detect]);

  const dismissPrompt = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setPromptDismissed(true);
  }, []);

  return (
    <LocationContext.Provider
      value={{
        location,
        status,
        setManual,
        retry,
        dismissPrompt,
        promptDismissed,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return ctx;
}
