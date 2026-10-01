import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons for Leaflet in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom rider marker (green bike)
const riderIcon = L.divIcon({
  className: 'rider-marker',
  html: '<div style="background:#2E7D32;width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:16px;">🛵</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Custom destination marker
const destIcon = L.divIcon({
  className: 'dest-marker',
  html: '<div style="background:#E65100;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function MapBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 1) {
      const bounds = L.latLngBounds(positions.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (positions.length === 1) {
      map.setView([positions[0].lat, positions[0].lng], 14);
    }
  }, [positions]);
  return null;
}

export default function LiveMap({ riderLat, riderLng, destLat, destLng, className }) {
  const positions = [];
  if (riderLat && riderLng) positions.push({ lat: riderLat, lng: riderLng, type: 'rider' });
  if (destLat && destLng) positions.push({ lat: destLat, lng: destLng, type: 'dest' });

  if (positions.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-2xl ${className || 'h-64'}`}>
        <p className="text-sm text-gray-400">Waiting for location...</p>
      </div>
    );
  }

  const center = positions[0];

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={14}
      scrollWheelZoom={false}
      className={`rounded-2xl overflow-hidden z-0 ${className || 'h-64'}`}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {riderLat && riderLng && (
        <Marker position={[riderLat, riderLng]} icon={riderIcon}>
          <Popup>Your Ukart rider</Popup>
        </Marker>
      )}
      {destLat && destLng && (
        <Marker position={[destLat, destLng]} icon={destIcon}>
          <Popup>Delivery destination</Popup>
        </Marker>
      )}
      {riderLat && riderLng && destLat && destLng && (
        <Polyline
          positions={[[riderLat, riderLng], [destLat, destLng]]}
          pathOptions={{ color: '#2E7D32', dashArray: '8 8', weight: 3 }}
        />
      )}
      <MapBounds positions={positions} />
    </MapContainer>
  );
}