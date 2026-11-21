
import React, { useState, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents
} from 'react-leaflet';
import { useLocation } from '@/context/LocationContext';

// Approximate map centres for homepage delivery areas.
const AREA_CENTRES = {
  'ajah': [6.4698, 3.5852],
  'lekki phase 1': [6.4474, 3.4723],
  'victoria island': [6.4281, 3.4219],
  'ikoyi': [6.4549, 3.4357],
  'chevron': [6.4430, 3.5360],
  'vgc': [6.4570, 3.5660],
  'sangotedo': [6.4690, 3.6480],
  'abraham adesanya': [6.4670, 3.5980],
  'ikate': [6.4380, 3.5030],
  'oniru': [6.4330, 3.4380],
  'yaba': [6.5095, 3.3711],
  'surulere': [6.4969, 3.3580],
  'ikeja': [6.6018, 3.3515],
  'maryland': [6.5700, 3.3670],
  'gbagada': [6.5580, 3.3900],
  'ikorodu': [6.6194, 3.5105],
  'festac': [6.4698, 3.2820],
  'isolo': [6.5330, 3.3080],
  'egbeda': [6.5900, 3.2870],
  'agege': [6.6210, 3.3250],
  'oshodi': [6.5550, 3.3430],
  'mushin': [6.5270, 3.3500],
  'ketu': [6.6000, 3.3950],
  'ogudu': [6.5710, 3.3900],
  'magodo': [6.6220, 3.3770]
};

const ISLAND_AREAS = [
  'ajah',
  'lekki phase 1',
  'lekki',
  'victoria island',
  'ikoyi',
  'chevron',
  'vgc',
  'victoria garden city',
  'sangotedo',
  'abraham adesanya',
  'ikate',
  'oniru',
  'eti-osa',
  'etiosa'
];

const MAINLAND_AREAS = [
  'yaba',
  'surulere',
  'ikeja',
  'maryland',
  'gbagada',
  'ikorodu',
  'festac',
  'isolo',
  'egbeda',
  'agege',
  'oshodi',
  'mushin',
  'ketu',
  'ogudu',
  'magodo'
];

function classifyAddress(address, fallbackZone = 'mainland') {
  const text = (address || '').toLowerCase();

  const islandMatch = ISLAND_AREAS.find(area => text.includes(area));
  if (islandMatch) {
    return { zone: 'island', area: islandMatch };
  }

  const mainlandMatch = MAINLAND_AREAS.find(area => text.includes(area));
  if (mainlandMatch) {
    return { zone: 'mainland', area: mainlandMatch };
  }

  return { zone: fallbackZone, area: null };
}

function getInitialCentre(location) {
  const area = (location?.area || '').toLowerCase();
  return AREA_CENTRES[area] || [6.5244, 3.3792];
}

function MapController({ center, onLocationSelect }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { duration: 0.8 });
    }
  }, [center, map]);

  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }
  });

  return null;
}

export default function AddressPickerMap({ onConfirmLocation }) {
  const {
    location: selectedLocation,
    setManual
  } = useLocation();

  const initialCentre = getInitialCentre(selectedLocation);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [coords, setCoords] = useState(initialCentre);
  const [zone, setZone] = useState(selectedLocation?.zone || 'mainland');
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState('');

  const timer = useRef(null);
  const controller = useRef(null);

  // Follow changes made to the homepage location selector.
  useEffect(() => {
    if (!selectedLocation) return;

    const centre = getInitialCentre(selectedLocation);

    setCoords(centre);
    setZone(selectedLocation.zone || 'mainland');
    setQuery('');

    onConfirmLocation?.({
      address: '',
      lat: null,
      lng: null,
      zone: selectedLocation.zone || 'mainland'
    });
  }, [selectedLocation?.area, selectedLocation?.zone]);

  const formatAddress = (p) => {
    const parts = [
      p.housenumber,
      p.street || p.name,
      p.district,
      p.city || p.county,
      p.state,
      p.country
    ].filter(Boolean);

    return [...new Set(parts)].join(', ');
  };

  const reverseLookup = async (lat, lng) => {
    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lng),
        lang: 'en'
      });

      const response = await fetch(
        `https://photon.komoot.io/reverse?${params.toString()}`
      );

      if (!response.ok) return '';

      const data = await response.json();
      const feature = data.features?.[0];

      return feature ? formatAddress(feature.properties || {}) : '';
    } catch {
      return '';
    }
  };

  const updatePosition = async (lat, lng, label = '') => {
    setCoords([lat, lng]);
    setSuggestions([]);
    setMessage('');

    const resolvedAddress = label || await reverseLookup(lat, lng);
    const classification = classifyAddress(
      resolvedAddress,
      selectedLocation?.zone || zone
    );

    setZone(classification.zone);

    if (resolvedAddress) {
      setQuery(resolvedAddress);
    }

    // Keep the homepage location context consistent when a known area is found.
    if (classification.area) {
      const displayArea = classification.area === 'lekki'
        ? 'Lekki Phase 1'
        : classification.area;

      setManual(
        displayArea.replace(/\b\w/g, char => char.toUpperCase())
      );
    }

    onConfirmLocation?.({
      address: resolvedAddress || label || '',
      lat,
      lng,
      zone: classification.zone
    });

    if (!classification.area) {
      setMessage(
        'We could not identify this neighbourhood automatically. Please confirm your delivery area.'
      );
    }
  };

  // Search addresses using Photon / OpenStreetMap.
  useEffect(() => {
    clearTimeout(timer.current);
    controller.current?.abort();

    if (query.trim().length < 3) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    timer.current = setTimeout(async () => {
      const abortController = new AbortController();
      controller.current = abortController;

      setSearching(true);

      try {
        const params = new URLSearchParams({
          q: `${query.trim()}, Lagos, Nigeria`,
          limit: '6',
          lang: 'en',
          lat: String(coords[0]),
          lon: String(coords[1])
        });

        const response = await fetch(
          `https://photon.komoot.io/api/?${params.toString()}`,
          { signal: abortController.signal }
        );

        if (!response.ok) {
          throw new Error('Address search failed');
        }

        const data = await response.json();

        const results = (data.features || [])
          .map(feature => {
            const p = feature.properties || {};
            const address = formatAddress(p);
            const coordinates = feature.geometry?.coordinates;

            if (!address || !coordinates) return null;

            return {
              id: `${p.osm_type || ''}-${p.osm_id || address}`,
              address,
              lat: coordinates[1],
              lng: coordinates[0]
            };
          })
          .filter(Boolean);

        setSuggestions(results);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setSuggestions([]);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setSearching(false);
        }
      }
    }, 500);

    return () => clearTimeout(timer.current);
  }, [query, coords]);

  const handleUseCurrentLocation = () => {
    setMessage('');

    if (!navigator.geolocation) {
      setMessage('Your browser does not support GPS location.');
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async position => {
        await updatePosition(
          position.coords.latitude,
          position.coords.longitude
        );
        setLocating(false);
      },
      error => {
        setLocating(false);

        if (error.code === 1) {
          setMessage('Location permission was denied. You can select your location on the map instead.');
        } else if (error.code === 2) {
          setMessage('Your location could not be detected. Please try again or select it on the map.');
        } else {
          setMessage('Location request timed out. Please try again.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      }
    );
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={`Search for an address around ${selectedLocation?.area || 'Lagos'}...`}
          className="w-full p-3 border rounded-xl text-sm"
          autoComplete="off"
        />

        {searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
            Searching...
          </span>
        )}

        {suggestions.length > 0 && (
          <ul className="absolute z-50 w-full bg-white border rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
            {suggestions.map(item => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() =>
                    updatePosition(item.lat, item.lng, item.address)
                  }
                  className="w-full text-left p-2.5 text-xs hover:bg-gray-100 border-b last:border-none"
                >
                  <span className="font-medium block">
                    {item.address}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between text-xs gap-2">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={locating}
          className="text-green-700 font-medium underline disabled:opacity-50"
        >
          {locating ? 'Detecting location...' : '📍 Use my current GPS location'}
        </button>

        <span className="px-2 py-1 bg-gray-100 rounded-md font-medium">
          Detected Zone: {zone === 'island' ? 'Island' : 'Mainland'}
        </span>
      </div>

      {message && (
        <p className="text-xs text-amber-700">{message}</p>
      )}

      <MapContainer
        center={coords}
        zoom={15}
        className="h-56 w-full rounded-2xl z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <Marker
          position={coords}
          draggable={true}
          eventHandlers={{
            dragend: e => {
              const { lat, lng } = e.target.getLatLng();
              updatePosition(lat, lng);
            }
          }}
        />

        <MapController
          center={coords}
          onLocationSelect={(lat, lng) => updatePosition(lat, lng)}
        />
      </MapContainer>

      <p className="text-xs text-gray-500">
        Drag the pin or tap the map to select your delivery location.
        You can also use your current GPS location.
      </p>
    </div>
  );
}