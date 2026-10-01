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
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin")
      return Response.json({ error: "Admin only" }, { status: 403 });
    if (user.staffRole !== "super_admin")
      return Response.json({ error: "Super Admin only" }, { status: 403 });

    const body = await req.json();
    const { customerEmail } = body;
    if (!customerEmail)
      return Response.json({ error: "customerEmail is required" }, { status: 400 });

    const admin = base44.asServiceRole;

    // Find the customer
    const usersRes = await admin.entities.User.list({ limit: 1000 });
    const customer = (usersRes.items || []).find(
      (u) => u.email === customerEmail
    );
    if (!customer)
      return Response.json({ error: "Customer not found" }, { status: 404 });
    if (!customer.date_of_birth)
      return Response.json(
        { error: "Customer has no date of birth set" },
        { status: 400 }
      );

    const { year } = getLagosDateParts();

    // Check for existing test reward this year
    const existing = await admin.entities.BirthdayReward.filter(
      { customer_id: customer.id, birthday_year: year, is_test: true },
      { limit: 1 }
    );
    if (existing.items && existing.items.length > 0) {
      return Response.json(
        {
          error: "Test reward already exists for this customer this year",
          existingReward: existing.items[0],
        },
        { status: 409 }
      );
    }

    // Create test voucher
    const voucherCode = generateVoucherCode(year, true);
    const expiryDate = getEndOfLagosDay();
    const voucher = await admin.entities.Voucher.create({
      code: voucherCode,
      discount_type: "fixed_amount",
      discount_amount: BIRTHDAY_VOUCHER_AMOUNT,
      max_uses: 1,
      uses: 0,
      active: true,
      assigned_to_email: customer.email,
      expiry_date: expiryDate,
      one_time_use: true,
      description: `TEST birthday reward for ${customer.full_name || customer.email}`,
    });

    // Create test birthday reward
    const reward = await admin.entities.BirthdayReward.create({
      customer_id: customer.id,
      customer_email: customer.email,
      customer_name: customer.full_name || "",
      date_of_birth: customer.date_of_birth,
      birthday_year: year,
      voucher_id: voucher.id,
      voucher_code: voucherCode,
      voucher_amount: BIRTHDAY_VOUCHER_AMOUNT,
      expiry_date: expiryDate,
      status: "created",
      is_test: true,
    });

    // Link voucher to reward
    await admin.entities.Voucher.update(voucher.id, {
      birthday_reward_id: reward.id,
    });

    // Send birthday email
    let emailSent = false;
    let emailError = null;
    try {
      const firstName = (customer.full_name || "").split(" ")[0] || "there";
      const { subject, html } = buildBirthdayEmail(firstName, voucherCode, true);
      await admin.integrations.Core.SendEmail({
        to: customer.email,
        subject,
        html,
      });
      await admin.entities.BirthdayReward.update(reward.id, {
        status: "sent",
        sent_at: new Date().toISOString(),
      });
      emailSent = true;
    } catch (e) {
      emailError = e.message;
    }

    return Response.json({
      success: true,
      message: "Test birthday reward created",
      voucherCode,
      voucherAmount: BIRTHDAY_VOUCHER_AMOUNT,
      expiryDate,
      customer: customer.email,
      customerName: customer.full_name,
      dateOfBirth: customer.date_of_birth,
      rewardId: reward.id,
      emailSent,
      emailError,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}