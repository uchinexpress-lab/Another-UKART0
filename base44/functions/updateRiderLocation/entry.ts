import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { haversineKm, estimateMinutes, minutesFromNow } from "../../shared/deliveryUtils.ts";

// Minimum distance (km) to trigger a location + ETA recalculation
const MIN_DISTANCE_KM = 0.05; // 50 meters
// Minimum time (ms) between updates even if moving
const MIN_INTERVAL_MS = 8000;

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { deliveryId, latitude, longitude } = body;

    if (typeof latitude !== "number" || typeof longitude !== "number")
      return Response.json({ error: "latitude and longitude required" }, { status: 400 });

    const admin = base44.asServiceRole;
    const delivery = await admin.entities.Delivery.get(deliveryId);
    if (!delivery) return Response.json({ error: "Delivery not found" }, { status: 404 });

    // Only the assigned rider or admin can update location
    if (delivery.rider_user_id !== user.id && user.role !== "admin")
      return Response.json({ error: "Not authorized" }, { status: 403 });

    // Only track during active delivery
    if (!["on_the_way", "arriving_soon", "picked_up"].includes(delivery.status))
      return Response.json({ error: "Delivery not active" }, { status: 400 });

    const now = new Date();
    const update: Record<string, unknown> = {
      latest_lat: latitude,
      latest_lng: longitude,
      last_location_at: now.toISOString(),
    };

    // Recalculate ETA if we have destination coords and enough distance/time has passed
    const prevLat = delivery.latest_lat;
    const prevLng = delivery.latest_lng;
    const prevTime = delivery.last_location_at ? new Date(delivery.last_location_at).getTime() : 0;
    const timeSince = now.getTime() - prevTime;

    let shouldRecalcEta = false;
    if (delivery.delivery_lat && delivery.delivery_lng) {
      if (!prevLat || !prevLng) {
        shouldRecalcEta = true; // first location
      } else {
        const moved = haversineKm(prevLat, prevLng, latitude, longitude);
        if (moved >= MIN_DISTANCE_KM || timeSince >= 30000) {
          shouldRecalcEta = true;
        }
      }
    }

    if (shouldRecalcEta) {
      const distToDest = haversineKm(latitude, longitude, delivery.delivery_lat, delivery.delivery_lng);
      const newMinutes = estimateMinutes(distToDest);
      update.estimated_minutes = newMinutes;
      update.estimated_delivery_at = minutesFromNow(newMinutes);
      update.last_eta_update = now.toISOString();

      // Auto-arriving-soon if very close
      if (newMinutes <= 5 && delivery.status === "on_the_way") {
        update.status = "arriving_soon";
        update.arriving_soon_at = now.toISOString();
        update.eta_status = "arriving_soon";
      }
    }

    // Throttle: skip update if too soon and not moved enough
    if (prevLat && prevLng && timeSince < MIN_INTERVAL_MS) {
      const moved = haversineKm(prevLat, prevLng, latitude, longitude);
      if (moved < MIN_DISTANCE_KM) {
        return Response.json({ ok: true, throttled: true });
      }
    }

    await admin.entities.Delivery.update(deliveryId, update);

    return Response.json({
      ok: true,
      updated: true,
      estimated_minutes: update.estimated_minutes,
      status: update.status || delivery.status,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}