import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Checks a voucher for the signed-in customer and returns only the public
// discount details. The voucher's assigned_to_email is a private field, so the
// assignment check has to happen here rather than in the browser.

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json(
        { valid: false, error: 'Please sign in to use a voucher code' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const code = String(body?.code || '').trim().toUpperCase();
    if (!code) return Response.json({ valid: false, error: 'Enter a voucher code' });

    const admin = base44.asServiceRole;
    const res = await admin.entities.Voucher.filter({ code, active: true }, { limit: 1 });
    const v = res.items && res.items[0];
    if (!v) return Response.json({ valid: false, error: 'Invalid or expired voucher code' });

    if (v.max_uses && (v.uses || 0) >= v.max_uses) {
      return Response.json({
        valid: false,
        error: 'This voucher has reached its usage limit',
      });
    }
    if (v.assigned_to_email && v.assigned_to_email !== user.email) {
      return Response.json({
        valid: false,
        error: 'This voucher is not available for your account',
      });
    }
    if (v.expiry_date && new Date(v.expiry_date) < new Date()) {
      return Response.json({ valid: false, error: 'This voucher has expired' });
    }

    return Response.json({
      valid: true,
      code: v.code,
      discount_type: v.discount_type || 'percentage',
      discount_percent: Number(v.discount_percent) || 0,
      discount_amount: Number(v.discount_amount) || 0,
    });
  } catch (error) {
    return Response.json(
      { valid: false, error: 'Could not validate voucher' },
      { status: 500 }
    );
  }
}