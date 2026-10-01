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

    // Get all CustomerDOB records
    const dobRes = await admin.entities.CustomerDOB.filter({}, { limit: 1000 });
    const customers = dobRes.items || [];

    const results = [];

    for (const c of customers) {
      if (!c.date_of_birth) continue;

      // Parse DOB
      const dob = new Date(c.date_of_birth);
      if (isNaN(dob.getTime())) continue;

      const dobMonth = dob.getMonth() + 1;
      const dobDay = dob.getDate();
      const dobMonthDay = `${String(dobMonth).padStart(2, "0")}-${String(dobDay).padStart(2, "0")}`;

      // Check if today is the birthday
      if (dobMonthDay !== todayMonthDay) continue;

      // Check for existing reward this year (non-test)
      const existing = await admin.entities.BirthdayReward.filter(
        { customer_id: c.customer_id, birthday_year: year, is_test: { $ne: true } },
        { limit: 1 }
      );
      if (existing.items && existing.items.length > 0) {
        results.push({ customer: c.customer_email, status: "already_rewarded" });
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
        assigned_to_email: c.customer_email,
        expiry_date: expiryDate,
        one_time_use: true,
        description: `Birthday reward for ${c.customer_name || c.customer_email}`,
      });

      // Create birthday reward record
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

      // Link voucher to reward
      await admin.entities.Voucher.update(voucher.id, {
        birthday_reward_id: reward.id,
      });

      // Send birthday email
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

        results.push({ customer: c.customer_email, status: "rewarded", voucherCode });
      } catch (emailErr) {
        results.push({
          customer: c.customer_email,
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