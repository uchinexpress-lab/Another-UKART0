// Shared delivery constants and helpers used by backend functions.
// Importable from any base44/functions/*/entry.ts via relative path.

export const DELIVERY_STATUSES = [
  "pending",
  "assigned",
  "accepted",
  "preparing",
  "ready_for_pickup",
  "picked_up",
  "on_the_way",
  "arriving_soon",
  "delivered",
  "cancelled",
] as const;

export const ACTIVE_DELIVERY_STATUSES = [
  "assigned",
  "accepted",
  "preparing",
  "ready_for_pickup",
  "picked_up",
  "on_the_way",
  "arriving_soon",
] as const;

export const ORDER_STATUS_MAP: Record<string, string> = {
  pending: "new",
  assigned: "processing",
  accepted: "processing",
  preparing: "processing",
  ready_for_pickup: "ready",
  picked_up: "on_the_way",
  on_the_way: "on_the_way",
  arriving_soon: "on_the_way",
  delivered: "delivered",
  cancelled: "cancelled",
};

// Haversine distance in km between two lat/lng points
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Estimate travel minutes from distance (km) and average speed (km/h, default 20 for Lagos traffic)
export function estimateMinutes(distanceKm: number, avgSpeedKmh = 20): number {
  if (distanceKm <= 0) return 1;
  return Math.max(1, Math.round((distanceKm / avgSpeedKmh) * 60));
}

// Compute ISO timestamp N minutes from now
export function minutesFromNow(minutes: number): string {
  return new Date(Date.now() + minutes * 60000).toISOString();
}

// Lagos default pickup (can be overridden per delivery)
export const DEFAULT_PICKUP_LAT = 6.4541;
export const DEFAULT_PICKUP_LNG = 3.4749;
export const DEFAULT_PICKUP_ADDRESS = "Ukart Hub, Lagos";