import { emailShell } from "./emailBanner.ts";

export const BIRTHDAY_VOUCHER_AMOUNT = 2000;
const LAGOS_TZ = "Africa/Lagos";
const APP_URL = "https://ukart-fresh-now.base44.app";

export function getLagosDateParts(): { year: number; month: number; day: number } {
  const now = new Date();
  const lagosStr = now.toLocaleString("en-US", {
    timeZone: LAGOS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = lagosStr.split("/");
  return {
    month: parseInt(parts[0], 10),
    day: parseInt(parts[1], 10),
    year: parseInt(parts[2], 10),
  };
}

export function getEndOfLagosDay(): string {
  const { year, month, day } = getLagosDateParts();
  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return new Date(`${dateStr}T23:59:59+01:00`).toISOString();
}

export function generateVoucherCode(year: number, isTest = false): string {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return isTest
    ? `UKART-BDAY-TEST-${year}-${random}`
    : `UKART-BDAY-${year}-${random}`;
}

export function buildBirthdayEmail(
  firstName: string,
  voucherCode: string,
  isTest = false
): { subject: string; html: string } {
  const testLabel = isTest ? " [TEST]" : "";
  const content = `
    <h2 style="margin:0 0 8px;color:#2E7D32;font-size:20px;">Happy Birthday, ${firstName}! 🎉</h2>
    <p style="margin:0 0 16px;color:#444;font-size:14px;line-height:1.6;">Everyone at Ukart wishes you a wonderful birthday.</p>
    <p style="margin:0 0 16px;color:#444;font-size:14px;line-height:1.6;">As our birthday gift to you, we've added a ₦2,000 Ukart voucher to your account.</p>
    <p style="margin:0 0 8px;color:#444;font-size:14px;line-height:1.6;">Your voucher code:</p>
    <div style="text-align:center;margin:12px 0;">
      <div style="display:inline-block;background:#E8F5E9;border:2px dashed #2E7D32;border-radius:8px;padding:12px 24px;font-size:18px;font-weight:bold;color:#2E7D32;letter-spacing:2px;">${voucherCode}</div>
    </div>
    <p style="margin:0 0 16px;color:#444;font-size:14px;line-height:1.6;">Use it to shop for your favourite groceries on Ukart today.</p>
    <p style="margin:0 0 16px;color:#e53935;font-size:13px;font-weight:500;">⚠️ Your voucher expires today.</p>
    <div style="text-align:center;margin:20px 0;">
      <a href="${APP_URL}" style="display:inline-block;background:#2E7D32;color:#fff;text-decoration:none;font-weight:bold;padding:13px 36px;border-radius:8px;font-size:14px;">Shop on Ukart</a>
    </div>
    <p style="margin:16px 0 0;color:#999;font-size:12px;text-align:center;">Enjoy your special day! ❤️<br>Ukart — No Market Wahala.</p>
  `;
  return {
    subject: `Happy Birthday from Ukart! 🎉 Your ₦2,000 Birthday Gift Is Here${testLabel}`,
    html: emailShell(content),
  };
}