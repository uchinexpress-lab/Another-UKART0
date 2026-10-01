import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { minutesFromNow, DEFAULT_PICKUP_LAT, DEFAULT_PICKUP_LNG } from "../../shared/deliveryUtils.ts";

// Test-mode simulation: advances a delivery through the delivery lifecycle
// with simulated GPS movement toward the destination.
// ONLY works on deliveries marked is_test_mode = true.

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { deliveryId, step } = body;

    const admin = base44.asServiceRole;
    const delivery = await admin.entities.Delivery.get(deliveryId);
    if (!delivery) return Response.json({ error: "Delivery not found" }, { status: 404 });

    if (!delivery.is_test_mode)
      return Response.json({ error: "Not a test-mode delivery" }, { status: 400 });

    // Only admin or assigned rider can simulate
    if (delivery.rider_user_id !== user.id && user.role !== "admin")
      return Response.json({ error: "Not authorized" }, { status: 403 });

    const now = new Date();

    // Simulated destination (Lagos default if no real coords)
    const destLat = delivery.delivery_lat || 6.43;
    const destLng = delivery.delivery_lng || 3.42;

    // Simulated steps with progressive movement toward destination
    const SIM_STEPS: Record<string, { minutes: number; latOffset: number; lngOffset: number; status: string; etaStatus: string }> = {
      start: { minutes: 30, latOffset: 0.03, lngOffset: 0.03, status: "on_the_way", etaStatus: "on_time" },
      "30min": { minutes: 30, latOffset: 0.03, lngOffset: 0.03, status: "on_the_way", etaStatus: "on_time" },
      "20min": { minutes: 20, latOffset: 0.02, lngOffset: 0.02, status: "on_the_way", etaStatus: "on_time" },
      "10min": { minutes: 10, latOffset: 0.01, lngOffset: 0.01, status: "on_the_way", etaStatus: "on_time" },
      "5min": { minutes: 5, latOffset: 0.005, lngOffset: 0.005, status: "arriving_soon", etaStatus: "arriving_soon" },
      delivered: { minutes: 0, latOffset: 0, lngOffset: 0, status: "delivered", etaStatus: "delivered" },
    };

    const sim = SIM_STEPS[step];
    if (!sim) return Response.json({ error: "Unknown simulation step" }, { status: 400 });

    const simLat = destLat + sim.latOffset;
    const simLng = destLng + sim.lngOffset;

    const update: Record<string, unknown> = {
      latest_lat: simLat,
      latest_lng: simLng,
      last_location_at: now.toISOString(),
      test_progress: step,
    };

    if (step === "start") {
      update.status = "on_the_way";
      update.started_at = now.toISOString();
      update.estimated_minutes = sim.minutes;
      update.estimated_delivery_at = minutesFromNow(sim.minutes);
      update.last_eta_update = now.toISOString();
      update.eta_status = sim.etaStatus;
    } else if (step === "delivered") {
      update.status = "delivered";
      update.delivered_at = now.toISOString();
      update.eta_status = "delivered";
      update.latest_lat = null;
      update.latest_lng = null;
      // Free rider
      if (delivery.rider_id) {
        const rider = await admin.entities.Rider.get(delivery.rider_id);
        if (rider) {
          await admin.entities.Rider.update(delivery.rider_id, {
            current_delivery_id: null,
            is_available: true,
            completed_deliveries: (rider.completed_deliveries || 0) + 1,
          });
        }
      }
      await admin.entities.Order.update(delivery.order_id, { status: "delivered" });
    } else {
      update.status = sim.status;
      update.estimated_minutes = sim.minutes;
      update.estimated_delivery_at = minutesFromNow(sim.minutes);
      update.last_eta_update = now.toISOString();
      update.eta_status = sim.etaStatus;
      if (sim.status === "arriving_soon") {
        update.arriving_soon_at = now.toISOString();
      }
    }

    await admin.entities.Delivery.update(deliveryId, update);

    return Response.json({
      ok: true,
      step,
      status: update.status,
      latest_lat: update.latest_lat,
      latest_lng: update.latest_lng,
      estimated_minutes: update.estimated_minutes,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}