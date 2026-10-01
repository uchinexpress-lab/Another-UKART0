// Shared Ukart email banner wrapper for backend transactional emails.
// Provides the branded banner image header + consistent email shell.
// Frontend emails use the equivalent emailShell in src/lib/emailTemplates.js.

export const UKART_BANNER_URL =
  "https://media.base44.com/images/public/6a5b618b391a439e5e7749cc/250e47ebc_ChatGPTImageSep16202612_22_03PM1.png";

/**
 * Wraps email body content in the standard Ukart branded email shell
 * with the banner image header. Use for all backend-sent transactional emails.
 */
export function emailShell(content: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="text-align:center;">
      <img src="${UKART_BANNER_URL}" alt="Ukart — No Market Wahala" style="width:100%;max-width:680px;height:auto;display:block;margin:0 auto;border-radius:12px 12px 0 0;" />
    </div>
    <div style="background:#fff;padding:28px 24px;border-radius:0 0 12px 12px;">
      ${content}
    </div>
    <p style="text-align:center;color:#aaa;font-size:11px;margin:16px 0 0;">This is an automated email from Ukart. Please do not reply.</p>
  </div>
</body></html>`;
}