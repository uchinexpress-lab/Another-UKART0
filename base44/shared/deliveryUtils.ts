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
  "arrived",
  "otp_verified",
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
  "arrived",
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
  arrived: "on_the_way",
  otp_verified: "delivered",
  delivered: "delivered",
  cancelled: "cancelled",
};

// Customer-facing simplified status labels
export const CUSTOMER_STATUS_MAP: Record<string, string> = {
  pending: "Preparing Order",
  assigned: "Rider Assigned",
  accepted: "Rider Assigned",
  preparing: "Preparing Order",
  ready_for_pickup: "Preparing Order",
  picked_up: "On the Way",
  on_the_way: "On the Way",
  arriving_soon: "Arriving Soon",
  arrived: "Rider Has Arrived",
  otp_verified: "Delivery Confirmed",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// ── OTP configuration ──
export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 15;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_LOCK_MINUTES = 30; // lock after max failed attempts
export const OTP_RESEND_COOLDOWN_SECONDS = 60; // min seconds between resends

// ── OTP helpers ──

// Cryptographically secure random numeric OTP code
export function generateOtpCode(length: number = OTP_LENGTH): string {
  const digits = "0123456789";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += digits[array[i] % 10];
  }
  return code;
}

// SHA-256 hash of the OTP code — never store plaintext
export async function hashOtp(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── SMS helper (Twilio) ──
// Returns "not_configured" when SMS_PROVIDER secret is absent or not "twilio".
export async function sendSmsOtp(
  phone: string,
  message: string
): Promise<"sent" | "failed" | "not_configured"> {
  const provider = process.env.SMS_PROVIDER;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!provider || provider !== "twilio" || !sid || !token || !from) {
    return "not_configured";
  }

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(`${sid}:${token}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ From: from, To: phone, Body: message }),
      }
    );
    return res.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

// ── Audit log helper ──
export async function logDeliveryEvent(
  base44: any,
  params: {
    delivery_id: string;
    order_id?: string;
    order_number?: string;
    customer_email?: string;
    event_type: string;
    message: string;
    actor_type?: string;
    actor_id?: string;
    actor_name?: string;
    customer_visible?: boolean;
  }
): Promise<void> {
  try {
    await base44.entities.DeliveryAuditLog.create({
      delivery_id: params.delivery_id,
      order_id: params.order_id || null,
      order_number: params.order_number || null,
      customer_email: params.customer_email || null,
      event_type: params.event_type,
      message: params.message,
      actor_type: params.actor_type || "system",
      actor_id: params.actor_id || null,
      actor_name: params.actor_name || null,
      customer_visible: params.customer_visible || false,
    });
  } catch (e) {
    console.error("Audit log failed:", e);
  }
}

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