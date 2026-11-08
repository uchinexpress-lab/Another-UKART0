import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { secrets } from "base44:runtime";
import { confirmPayment } from "../../shared/paystackUtils.ts";

// Paystack webhook endpoint — receives transaction events from Paystack.
// Validates the HMAC SHA-512 signature, then re-verifies the transaction
// with Paystack's API before marking the order as paid.
//
// Webhook URL to register in your Paystack dashboard:
//   https://ukart.base44.app/functions/paystackWebhook
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    // Validate the Paystack signature (HMAC SHA-512 of the raw body)
    const signature = req.headers.get("x-paystack-signature") || "";
    const rawBody = await req.text();
    const secret = secrets.get("PAYSTACK_SECRET_KEY");
    if (!secret) {
      console.error("PAYSTACK_SECRET_KEY is not configured");
      return Response.json({ error: "Payment provider not configured" }, { status: 500 });
    }

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"]
    );
    const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(rawBody));
    const computed = Array.from(new Uint8Array(sigBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (computed !== signature) {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    // Only process successful charge events
    if (event.event === "charge.success") {
      const reference = event.data?.reference;
      if (reference) {
        try {
          // confirmPayment re-verifies with Paystack and is idempotent, so a
          // duplicate event never double-pays or double-emails.
          const result = await confirmPayment(base44, reference);
          if (result && result.ok === false && /not found/i.test(result.reason || "")) {
            // Not one of our transactions — acknowledge so Paystack stops retrying.
            return Response.json({ status: "ignored", reason: result.reason });
          }
        } catch (e) {
          // Transient failure: ask Paystack to retry the event.
          console.error("Webhook confirmation failed:", e);
          return Response.json({ error: "Retry later" }, { status: 500 });
        }
      }
    }

    // Paystack expects a 200 OK to stop retrying
    return Response.json({ status: "ok" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}