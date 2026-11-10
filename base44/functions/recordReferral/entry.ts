import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";

// Creates a Referral record on signup. The reward amount is a server-defined
// constant — the client never supplies it. Referral entity create RLS is
// admin-only, so this backend function (service role) is the only path that
// can create a referral record.

const REFERRAL_REWARD_AMOUNT = 1000;
// A referral must be established as part of signing up: the account has to be
// brand new and still empty. Without this, any signed-in user could attach a
// referrer to an old account at will and farm the reward with extra accounts.
const REFERRAL_SIGNUP_WINDOW_MINUTES = 60;
// Cap how many referrals one account can open per day, so a single referrer
// cannot mint rewards from a large batch of throwaway accounts.
const REFERRAL_MAX_PER_DAY = 5;

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

    // The referred account must be newly created — a referral cannot be
    // attached to an account that already exists and has been using the app.
    const referredRecord = await admin.entities.User.get(user.id);
    const createdMs = new Date(referredRecord?.created_date || 0).getTime();
    if (!createdMs || Date.now() - createdMs > REFERRAL_SIGNUP_WINDOW_MINUTES * 60 * 1000) {
      return Response.json(
        { error: "Referrals can only be set up when an account is created" },
        { status: 403 }
      );
    }

    // A brand-new signup has no orders. Any order means the account is already
    // active, so a referral arriving now would be a retroactive discount.
    const existingOrder = await admin.entities.Order.filter(
      { created_by_id: user.id },
      { limit: 1 }
    );
    if (existingOrder.items && existingOrder.items.length > 0) {
      return Response.json(
        { error: "Referrals can only be set up before the first order" },
        { status: 403 }
      );
    }

    // Rate limit: one referrer may open a limited number of referrals per day.
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentByReferrer = await admin.entities.Referral.filter(
      { referrer_id: referrerId, created_date: { $gte: since } },
      { limit: REFERRAL_MAX_PER_DAY }
    );
    if ((recentByReferrer.items || []).length >= REFERRAL_MAX_PER_DAY) {
      return Response.json(
        { error: "This referrer has reached the daily referral limit" },
        { status: 429 }
      );
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