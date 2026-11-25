import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["assigned", "accepted", "cancelled"],
  assigned: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready_for_pickup"],
  ready_for_pickup: ["picked_up", "cancelled"],
  picked_up: ["on_the_way"],
  on_the_way: ["arriving_soon"],
  arriving_soon: ["arrived"],
  arrived: ["otp_verified", "delivered"],
  otp_verified: ["delivered"],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { action, deliveryId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: delivery, error: fetchErr } = await supabase
      .from("deliveries")
      .select("id, status")
      .eq("id", deliveryId)
      .single();

    if (fetchErr || !delivery) {
      return new Response(JSON.stringify({ error: "Delivery not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allowed = VALID_TRANSITIONS[delivery.status] || [];
    if (!allowed.includes(action)) {
      return new Response(JSON.stringify({ error: `Cannot transition from ${delivery.status} to ${action}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const updates: Record<string, any> = { status: action };
    if (action === "picked_up") updates.started_at = new Date().toISOString();
    if (action === "delivered") updates.delivered_at = new Date().toISOString();
    if (action === "arrived") updates.arrived_at = new Date().toISOString();

    const { error: updateErr } = await supabase
      .from("deliveries")
      .update(updates)
      .eq("id", deliveryId);

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, status: action }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
