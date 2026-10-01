export const BIRTHDAY_VOUCHER_AMOUNT = 2000;
const LAGOS_TZ = "Africa/Lagos";
const APP_URL = "https://ukart-fresh-now.base44.app";

// Dedicated birthday banner — only used for the automated birthday reward email.
// Do NOT use this for order/payment/delivery transactional emails.
export const BIRTHDAY_BANNER_URL =
  "https://media.base44.com/images/public/6a5b618b391a439e5e7749cc/650c3e27a_HappyBirthdayUkartCelebration.png";

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

/**
 * Dedicated email shell for the birthday reward email.
 * Uses the uploaded birthday banner (not the standard Ukart transactional banner).
 * Mobile-responsive, dark-mode safe (white card on light gray background).
 */
function birthdayEmailShell(content: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="max-width:680px;margin:0 auto;padding:16px;">
    <img src="${BIRTHDAY_BANNER_URL}" alt="Happy Birthday from Ukart" style="width:100%;max-width:680px;height:auto;display:block;margin:0 auto;border-radius:12px 12px 0 0;" />
    <div style="background:#ffffff;padding:28px 24px;border-radius:0 0 12px 12px;">
      ${content}
    </div>
    <p style="text-align:center;color:#aaa;font-size:11px;margin:16px 0 0;">This is an automated email from Ukart. Please do not reply.</p>
  </div>
</body></html>`;
}

export function buildBirthdayEmail(
  firstName: string,
  voucherCode: string,
  isTest = false
): { subject: string; html: string } {
  const testLabel = isTest ? " [TEST]" : "";
  const content = `
    <h2 style="margin:0 0 8px;color:#2E7D32;font-size:20px;line-height:1.3;">Happy Birthday, ${firstName}! 🎉</h2>
    <p style="margin:0 0 16px;color:#444;font-size:14px;line-height:1.6;">We hope you have a wonderful birthday and an amazing year ahead.</p>
    <p style="margin:0 0 16px;color:#444;font-size:14px;line-height:1.6;">As our special birthday gift to you, we've added a:</p>
    <p style="margin:0 0 16px;color:#2E7D32;font-size:15px;font-weight:bold;line-height:1.6;">₦2,000 UKART BIRTHDAY VOUCHER</p>
    <p style="margin:0 0 20px;color:#444;font-size:14px;line-height:1.6;">to your account.</p>
    <div style="text-align:center;margin:20px 0;">
      <div style="display:inline-block;background:linear-gradient(135deg,#E8F5E9,#C8E6C9);border:2px solid #2E7D32;border-radius:12px;padding:20px 28px;max-width:280px;">
        <p style="margin:0 0 8px;color:#2E7D32;font-size:13px;font-weight:bold;letter-spacing:1px;">YOUR BIRTHDAY GIFT 🎁</p>
        <p style="margin:0 0 6px;color:#1B5E20;font-size:32px;font-weight:bold;line-height:1.1;">₦2,000</p>
        <p style="margin:0 0 12px;color:#2E7D32;font-size:12px;font-weight:bold;letter-spacing:1px;">BIRTHDAY VOUCHER</p>
        <p style="margin:0 0 8px;color:#666;font-size:11px;">Your voucher code:</p>
        <div style="background:#fff;border:1px dashed #2E7D32;border-radius:6px;padding:8px 12px;font-size:15px;font-weight:bold;color:#1B5E20;letter-spacing:1.5px;word-break:break-all;">${voucherCode}</div>
        <p style="margin:10px 0 0;color:#e53935;font-size:11px;font-weight:600;">⏰ Valid today only</p>
      </div>
    </div>
    <div style="text-align:center;margin:24px 0 16px;">
      <a href="${APP_URL}" style="display:inline-block;background:#2E7D32;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 40px;border-radius:8px;font-size:15px;">SHOP ON UKART →</a>
    </div>
    <p style="margin:16px 0 0;color:#999;font-size:12px;text-align:center;line-height:1.6;">Enjoy your special day! ❤️<br>Thank you for shopping with Ukart.<br><strong style="color:#2E7D32;">No Market Wahala.</strong></p>
  `;
  return {
    subject: `Happy Birthday from Ukart! 🎉 Your ₦2,000 Birthday Gift Is Here${testLabel}`,
    html: birthdayEmailShell(content),
  };
}