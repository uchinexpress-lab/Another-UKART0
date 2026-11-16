import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Default center: Lekki/Ajah area
const DEFAULT_CENTER = [6.4698, 3.5852];

function MapController({ center, onLocationSelect }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.flyTo(center, 16);
    }
  }, [center, map]);

  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

export default function AddressPickerMap({ onConfirmLocation }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [coords, setCoords] = useState(DEFAULT_CENTER);
  const [zone, setZone] = useState('Island');

  // Auto-detect Mainland vs Island from coordinates
  const detectLagosZone = (lat, lng) => {
    // Rough boundary: South of Lagos Lagoon & East of Five Cowrie Creek/Falomo
    const isIsland = lat < 6.485 && lng > 3.405;
    return isIsland ? 'Island' : 'Mainland';
  };

  const updatePosition = (lat, lng, label) => {
    setCoords([lat, lng]);
    const detectedZone = detectLagosZone(lat, lng);
    setZone(detectedZone);
    if (label) setQuery(label);
    setSuggestions([]);
    onConfirmLocation?.({ address: label || query, lat, lng, zone: detectedZone });
  };

  // Search Lagos addresses as user types
  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://openstreetmap.org{encodeURIComponent(
            query + ', Lagos, Nigeria'
          )}&limit=5`
        );
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.error('Address lookup failed:', err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  // One-tap current GPS location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      updatePosition(pos.coords.latitude, pos.coords.longitude);
    });
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
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-50 w-full bg-white border rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
            {suggestions.map((item) => (
              <li
                key={item.place_id}
                onClick={() => updatePosition(parseFloat(item.lat), parseFloat(item.lon), item.display_name)}
                className="p-2.5 text-xs hover:bg-gray-100 cursor-pointer border-b last:border-none"
              >
                {item.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="text-green-700 font-medium underline"
        >
          📍 Use my current GPS location
        </button>
        <span className="px-2 py-1 bg-gray-100 rounded-md font-medium">
          Detected Zone: {zone}
        </span>
      </div>

      <MapContainer center={coords} zoom={15} className="h-56 w-full rounded-2xl z-0">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap"
        />
        <Marker
          position={coords}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const { lat, lng } = e.target.getLatLng();
              updatePosition(lat, lng);
            },
          }}
        />
        <MapController center={coords} onLocationSelect={(lat, lng) => updatePosition(lat, lng)} />
      </MapContainer>
      <p className="text-xs text-gray-500">
        Tip: Drag the pin or tap the map to place it right on your house or estate gate.
      </p>
    </div>
  );
}
