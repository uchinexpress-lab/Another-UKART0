import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@ukartapp.com";

const STATUS_SUBJECTS: Record<string, string> = {
  new: "Your Ukart order has been received!",
  processing: "Your Ukart order is being prepared",
  ready: "Your Ukart order is ready for dispatch",
  on_the_way: "Your Ukart rider is on the way!",
  delivered: "Your Ukart order has been delivered",
  cancelled: "Your Ukart order has been cancelled",
};

function buildOrderEmail(order: any, type: string, status?: string): { subject: string; html: string } {
  const orderNum = order?.order_number || "N/A";
  const total = Number(order?.total || 0).toLocaleString();
  const customerName = order?.customer_name || "there";

  if (type === "created") {
    return {
      subject: `Order #${orderNum} confirmed — Ukart`,
      html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:20px;">
        <h2>Hi ${customerName},</h2>
        <p>Thank you for your order! Your Ukart order <strong>#${orderNum}</strong> has been received and confirmed.</p>
        <p>Total: ₦${total}</p>
        <p>We'll notify you as your order progresses.</p>
        <p style="margin-top:24px;color:#888;font-size:12px;">Track your order at https://ukartapp.com</p>
      </div>`,
    };
  }

  const subject = STATUS_SUBJECTS[status || ""] || `Update on your Ukart order #${orderNum}`;
  return {
    subject,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:20px;">
      <h2>Hi ${customerName},</h2>
      <p>Your Ukart order <strong>#${orderNum}</strong> ${getStatusMessage(status)}</p>
      <p>Total: ₦${total}</p>
      <p style="margin-top:24px;color:#888;font-size:12px;">Track your order at https://ukartapp.com</p>
    </div>`,
  };
}

function getStatusMessage(status?: string): string {
  const messages: Record<string, string> = {
    processing: "is now being prepared and packed at our Ukart hub.",
    ready: "is packed and ready for dispatch!",
    on_the_way: "is out for delivery! Your Ukart rider is on the way to your address.",
    delivered: "has been delivered! Thank you for shopping with Ukart.",
    cancelled: "has been cancelled. If you need any assistance, please contact support.",
  };
  return messages[status || ""] || "has been updated.";
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured — email not sent");
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  return res.ok;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { type, orderId, status } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, html } = buildOrderEmail(order, type, status);
    const sent = await sendEmail(order.customer_email, subject, html);

    if (sent) {
      await supabase
        .from("orders")
        .update({ confirmation_email_sent: true, last_status_notified: status || order.status })
        .eq("id", orderId);
    }

    return new Response(JSON.stringify({ ok: true, emailSent: sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
