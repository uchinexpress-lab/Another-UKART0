import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ukart_delivery_location';

// Known Lagos Island areas — matched against the reverse-geocoded place name.
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
        line2: '🛵 Estimated delivery: 35–90 mins',
      };
    }
  }
  const area = rawName && rawName.toLowerCase() !== 'lagos' ? rawName : 'Lagos';
  return {
    area,
    zone: 'mainland',
    line2: '🚚 Delivery: Today',
  };
}

export function useDeliveryLocation() {
  const [location, setLocation] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [status, setStatus] = useState(location ? 'detected' : 'idle');

  useEffect(() => {
    if (location) return;
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
          const data = await res.json();
          const rawName =
            data.locality || data.city || data.principalSubdivision || 'Lagos';
          const loc = classify(rawName);
          setLocation(loc);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
          setStatus('detected');
        } catch {
          setStatus('error');
        }
      },
      () => setStatus('denied'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setManual = (areaName) => {
    const loc = classify(areaName);
    setLocation(loc);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    setStatus('detected');
  };

  return { location, status, setManual };
}