import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import {
  BIRTHDAY_VOUCHER_AMOUNT,
  getLagosDateParts,
  getEndOfLagosDay,
  generateVoucherCode,
  buildBirthdayEmail,
} from "../../shared/birthdayUtils.ts";

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // Allow workflow calls (no user) and admin calls
    let user = null;
    try {
      user = await base44.auth.me();
    } catch {}
    if (user && user.role !== "admin") {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }

    const admin = base44.asServiceRole;
    const { year, month, day } = getLagosDateParts();
    const todayMonthDay = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    // Get all users
    const usersRes = await admin.entities.User.list({ limit: 1000 });
    const users = usersRes.items || [];

    const results = [];

    for (const u of users) {
      if (!u.date_of_birth) continue;

      // Parse DOB
      const dob = new Date(u.date_of_birth);
      if (isNaN(dob.getTime())) continue;

      const dobMonth = dob.getMonth() + 1;
      const dobDay = dob.getDate();
      const dobMonthDay = `${String(dobMonth).padStart(2, "0")}-${String(dobDay).padStart(2, "0")}`;

      // Check if today is the birthday
      if (dobMonthDay !== todayMonthDay) continue;

      // Check for existing reward this year (non-test)
      const existing = await admin.entities.BirthdayReward.filter(
        { customer_id: u.id, birthday_year: year, is_test: { $ne: true } },
        { limit: 1 }
      );
      if (existing.items && existing.items.length > 0) {
        results.push({ customer: u.email, status: "already_rewarded" });
        continue;
      }

      // Create voucher
      const voucherCode = generateVoucherCode(year);
      const expiryDate = getEndOfLagosDay();
      const voucher = await admin.entities.Voucher.create({
        code: voucherCode,
        discount_type: "fixed_amount",
        discount_amount: BIRTHDAY_VOUCHER_AMOUNT,
        max_uses: 1,
        uses: 0,
        active: true,
        assigned_to_email: u.email,
        expiry_date: expiryDate,
        one_time_use: true,
        description: `Birthday reward for ${u.full_name || u.email}`,
      });

      // Create birthday reward record
      const reward = await admin.entities.BirthdayReward.create({
        customer_id: u.id,
        customer_email: u.email,
        customer_name: u.full_name || "",
        date_of_birth: u.date_of_birth,
        birthday_year: year,
        voucher_id: voucher.id,
        voucher_code: voucherCode,
        voucher_amount: BIRTHDAY_VOUCHER_AMOUNT,
        expiry_date: expiryDate,
        status: "created",
      });

      // Link voucher to reward
      await admin.entities.Voucher.update(voucher.id, {
        birthday_reward_id: reward.id,
      });

      // Send birthday email
      try {
        const firstName = (u.full_name || "").split(" ")[0] || "there";
        const { subject, html } = buildBirthdayEmail(firstName, voucherCode);
        await admin.integrations.Core.SendEmail({
          to: u.email,
          subject,
          html,
        });

        await admin.entities.BirthdayReward.update(reward.id, {
          status: "sent",
          sent_at: new Date().toISOString(),
        });

        results.push({ customer: u.email, status: "rewarded", voucherCode });
      } catch (emailErr) {
        results.push({
          customer: u.email,
          status: "email_failed",
          voucherCode,
          error: emailErr.message,
        });
      }
    }

    return Response.json({
      processed: results.length,
      date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}