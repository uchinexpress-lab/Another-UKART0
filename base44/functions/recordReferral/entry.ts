import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";

// Creates a Referral record on signup. The reward amount is a server-defined
// constant — the client never supplies it. Referral entity create RLS is
// admin-only, so this backend function (service role) is the only path that
// can create a referral record.

const REFERRAL_REWARD_AMOUNT = 1000;

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { referrerId } = body;
    if (!referrerId) return Response.json({ error: "referrerId required" }, { status: 400 });

    const admin = base44.asServiceRole;

    // Reject self-referral — a user must not be their own referrer.
    if (referrerId === user.id) {
      return Response.json({ error: "Cannot refer yourself" }, { status: 400 });
    }

    // Validate the referrer is a real user (prevents garbage/orphan referrals).
    try {
      await admin.entities.User.get(referrerId);
    } catch {
      return Response.json({ error: "Invalid referrer" }, { status: 400 });
    }

    // Only create one referral per referred user
    const existing = await admin.entities.Referral.filter(
      { referred_user_id: user.id },
      { limit: 1 }
    );
    if (existing.items && existing.items.length > 0) {
      return Response.json({ ok: true, alreadyExists: true });
    }

    await admin.entities.Referral.create({
      referrer_id: referrerId,
      referred_user_id: user.id,
      referred_email: user.email,
      status: "pending",
      reward_amount: REFERRAL_REWARD_AMOUNT,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}