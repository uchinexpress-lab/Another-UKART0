import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import {
  BIRTHDAY_VOUCHER_AMOUNT,
  getLagosDateParts,
  getEndOfLagosDay,
  generateVoucherCode,
  buildBirthdayEmail,
} from "../../shared/birthdayUtils.ts";

// Daily birthday reward batch. Secured: requires an authenticated admin. The
// scheduled workflow runtime invokes this function with the app owner's admin
// context, so the daily job authenticates automatically — no shared secret is
// passed in the workflow args, keeping any secret out of source code. Anonymous
// and non-admin HTTP calls are rejected. The response returns only aggregate
// counts — no customer emails or voucher codes are leaked.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // Authenticate: require an admin user. The scheduled workflow runtime
    // invokes this function with the app owner's admin context, so the daily
    // job authenticates automatically without any shared secret in the
    // workflow args. Anonymous and non-admin HTTP calls are rejected.
    let user = null;
    try {
      user = await base44.auth.me();
    } catch {}
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = base44.asServiceRole;
    const { year, month, day } = getLagosDateParts();
    const todayMonthDay = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const dobRes = await admin.entities.CustomerDOB.filter({}, { limit: 1000 });
    const customers = dobRes.items || [];

    let alreadyRewardCount = 0;
    let rewardedCount = 0;
    let emailFailedCount = 0;

    for (const c of customers) {
      if (!c.date_of_birth) continue;
      const dob = new Date(c.date_of_birth);
      if (isNaN(dob.getTime())) continue;
      const dobMonthDay = `${String(dob.getMonth() + 1).padStart(2, "0")}-${String(dob.getDate()).padStart(2, "0")}`;
      if (dobMonthDay !== todayMonthDay) continue;

      // Skip if already rewarded this year (non-test)
      const existing = await admin.entities.BirthdayReward.filter(
        { customer_id: c.customer_id, birthday_year: year, is_test: { $ne: true } },
        { limit: 1 }
      );
      if (existing.items && existing.items.length > 0) {
        alreadyRewardCount++;
        continue;
      }

      const voucherCode = generateVoucherCode(year);
      const expiryDate = getEndOfLagosDay();
      const voucher = await admin.entities.Voucher.create({
        code: voucherCode,
        discount_type: "fixed_amount",
        discount_amount: BIRTHDAY_VOUCHER_AMOUNT,
        max_uses: 1,
        uses: 0,
        active: true,
        assigned_to_email: c.customer_email,
        expiry_date: expiryDate,
        one_time_use: true,
        description: `Birthday reward for ${c.customer_name || c.customer_email}`,
      });

      const reward = await admin.entities.BirthdayReward.create({
        customer_id: c.customer_id,
        customer_email: c.customer_email,
        customer_name: c.customer_name || "",
        date_of_birth: c.date_of_birth,
        birthday_year: year,
        voucher_id: voucher.id,
        voucher_code: voucherCode,
        voucher_amount: BIRTHDAY_VOUCHER_AMOUNT,
        expiry_date: expiryDate,
        status: "created",
      });

      await admin.entities.Voucher.update(voucher.id, {
        birthday_reward_id: reward.id,
      });

      try {
        const firstName = (c.customer_name || "").split(" ")[0] || "there";
        const { subject, html } = buildBirthdayEmail(firstName, voucherCode);
        await admin.integrations.Core.SendEmail({
          to: c.customer_email,
          subject,
          html,
        });
        await admin.entities.BirthdayReward.update(reward.id, {
          status: "sent",
          sent_at: new Date().toISOString(),
        });
        rewardedCount++;
      } catch (emailErr) {
        emailFailedCount++;
        console.error("Birthday email failed:", emailErr.message);
      }
    }

    return Response.json({
      processed: alreadyRewardCount + rewardedCount + emailFailedCount,
      date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      already_rewarded_count: alreadyRewardCount,
      rewarded_count: rewardedCount,
      email_failed_count: emailFailedCount,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}