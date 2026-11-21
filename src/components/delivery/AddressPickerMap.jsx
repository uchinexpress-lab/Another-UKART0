
import React, { useState, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';

// Default map position: Lekki/Ajah
const DEFAULT_CENTER = [6.4698, 3.5852];

function MapController({ center, onLocationSelect }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.flyTo(center, 16, { duration: 0.8 });
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
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [coords, setCoords] = useState(DEFAULT_CENTER);
  const [zone, setZone] = useState('island');
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState('');

  const timer = useRef(null);
  const controller = useRef(null);

  // Approximate delivery-zone classification.
  const detectLagosZone = (lat, lng) => {
    const isIsland = lat < 6.485 && lng > 3.405;
    return isIsland ? 'island' : 'mainland';
  };

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

  // Get an address from selected GPS/map coordinates.
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

      return feature
        ? formatAddress(feature.properties || {})
        : '';
    } catch {
      return '';
    }
  };

  const updatePosition = async (lat, lng, label = '') => {
    const newCoords = [lat, lng];
    const detectedZone = detectLagosZone(lat, lng);

    setCoords(newCoords);
    setZone(detectedZone);
    setSuggestions([]);
    setMessage('');

    const resolvedAddress = label || await reverseLookup(lat, lng);

    if (resolvedAddress) {
      setQuery(resolvedAddress);
    }

    onConfirmLocation?.({
      address: resolvedAddress || query,
      lat,
      lng,
      zone: detectedZone
    });
  };

  // Search for places using Photon.
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
          q: query.trim(),
          limit: '5',
          lang: 'en',
          lat: '6.5244',
          lon: '3.3792'
        });

        const response = await fetch(
          `https://photon.komoot.io/api/?${params.toString()}`,
          { signal: abortController.signal }
        );

        if (!response.ok) {
          throw new Error('Search failed');
        }

        const data = await response.json();

        const results = (data.features || [])
          .map((feature) => {
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
  }, [query]);

  const handleUseCurrentLocation = () => {
    setMessage('');

    if (!navigator.geolocation) {
      setMessage('Your browser does not support GPS location.');
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await updatePosition(
          position.coords.latitude,
          position.coords.longitude
        );
        setLocating(false);
      },
      (error) => {
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
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type street, estate, or landmark in Lagos..."
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
            {suggestions.map((item) => (
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
          Detected Zone: {zone}
        </span>
      </div>

      {message && (
        <p className="text-xs text-red-600">{message}</p>
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
            dragend: (e) => {
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
        Drag the pin or tap the map to select your exact delivery location.
        You can also use your current GPS location.
      </p>
    </div>
  );
}