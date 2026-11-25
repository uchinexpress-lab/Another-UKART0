import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { deliveryId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: delivery, error } = await supabase
      .from("deliveries")
      .select("id, customer_phone, customer_name, order_number, otp_attempts, otp_max_attempts, otp_locked_until")
      .eq("id", deliveryId)
      .single();

    if (error || !delivery) {
      return new Response(JSON.stringify({ error: "Delivery not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (delivery.otp_locked_until && new Date(delivery.otp_locked_until) > new Date()) {
      return new Response(JSON.stringify({ error: "OTP is temporarily locked. Please try again later." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const now = new Date();
    const expires = new Date(now.getTime() + 10 * 60 * 1000);

    await supabase
      .from("deliveries")
      .update({
        otp_active: true,
        otp_attempts: 0,
        otp_last_sent_at: now.toISOString(),
      })
      .eq("id", deliveryId);

    return new Response(JSON.stringify({ ok: true, message: "OTP resent successfully" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
