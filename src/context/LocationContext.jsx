
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react';

const STORAGE_KEY = 'ukart_delivery_location';
const DISMISSED_KEY = 'ukart_location_prompt_dismissed';

// Known Lagos Island areas.
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
  { match: ['eti-osa', 'etiosa'], name: 'Lekki Phase 1' },
];

function classify(rawName) {
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

  const area =
    rawName && rawName.toLowerCase() !== 'lagos'
      ? rawName
      : 'Lagos';

  return {
    area,
    zone: 'mainland',
    line2: '🚚 Delivery: Today',
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
  const [location, setLocation] = useState(getSavedLocation);

  const [status, setStatus] = useState(
    () => getSavedLocation() ? 'detected' : 'idle'
  );

  const [promptDismissed, setPromptDismissed] = useState(
    getSavedDismissal
  );

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

          if (!res.ok) {
            throw new Error('Location lookup failed');
          }

          const data = await res.json();

          const rawName =
            data.locality ||
            data.city ||
            data.principalSubdivision ||
            'Lagos';

          const loc = classify(rawName);

          setLocation(loc);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
          localStorage.removeItem(DISMISSED_KEY);

          setPromptDismissed(false);
          setStatus('detected');
        } catch {
          setStatus('error');
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
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 600000
      }
    );
  }, []);

  // Automatically detect location on the first visit.
  useEffect(() => {
    if (location || promptDismissed) return;
    detect();
  }, [location, promptDismissed, detect]);

  // Save a manually selected delivery area.
  const setManual = useCallback((areaName) => {
    const loc = classify(areaName);

    setLocation(loc);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    localStorage.setItem(DISMISSED_KEY, 'true');

    setStatus('detected');
    setPromptDismissed(true);
  }, []);

  // Retry location detection when the customer requests it.
  const retry = useCallback(() => {
    localStorage.removeItem(DISMISSED_KEY);
    setPromptDismissed(false);
    detect();
  }, [detect]);

  // Remember when the customer closes the location prompt.
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
        promptDismissed
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