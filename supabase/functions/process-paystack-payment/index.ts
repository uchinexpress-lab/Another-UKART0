
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const uuidFromCartId = (value: unknown) => {
  const match = String(value || "").match(/(?:^|^(?:package-|mealkit-|addon-))([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  return match?.[1] || null;
};

const numberOrZero = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

async function calculateAuthoritativeCheckout(admin: any, user: any, input: any) {
  if (!input || !Array.isArray(input.items) || input.items.length === 0) {
    throw new Error("Your cart is empty");
  }

  if (!input.customer_name || !input.customer_phone || !input.customer_address || !input.landmark) {
    throw new Error("Please complete your delivery details");
  }

  if (!["island", "mainland"].includes(input.delivery_zone)) {
    throw new Error("Invalid delivery zone");
  }

  let subtotal = 0;
  const normalizedItems: any[] = [];

  for (const raw of input.items) {
    const quantity = Number(raw.quantity);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      throw new Error("Invalid item quantity");
    }

    const packageId = raw.package_id || uuidFromCartId(raw.id);
    const isStandalonePackageAddon = String(raw.id || "").startsWith("addon-");
    let unitPrice = 0;
    let normalized = { ...raw };

    if (packageId) {
      const { data: pkg, error: packageError } = await admin
        .from("packages")
        .select("*")
        .eq("id", packageId)
        .eq("active", true)
        .maybeSingle();

      if (packageError || !pkg || pkg.stock_status === "out_of_stock") {
        throw new Error(`This package is no longer available: ${raw.name || "package"}`);
      }

      if (isStandalonePackageAddon) {
        const addonIndex = Number(String(raw.id).split("-").at(-1));
        const addon = Array.isArray(pkg.addons) ? pkg.addons[addonIndex] : null;

        if (!addon || addon.active === false || addon.available === false) {
          throw new Error("A selected package extra is no longer available");
        }

        unitPrice = numberOrZero(addon.price);
        normalized = {
          ...raw,
          name: addon.name,
          package_id: packageId,
          price: unitPrice,
          addons_total: 0,
        };
      } else if (pkg.group === "meal_kits") {
        const size = raw.size_label
          ? (pkg.sizes || []).find(
              (entry: any) => entry?.label === raw.size_label && entry.available !== false
            )
          : null;

        if (raw.size_label && !size) {
          throw new Error("The selected meal-kit size is no longer available");
        }

        unitPrice = size
          ? numberOrZero(size.price)
          : numberOrZero(pkg.total_price || pkg.starting_price);

        if (unitPrice <= 0) {
          throw new Error(`Invalid price for ${pkg.name}`);
        }

        const proteinNames = Array.isArray(raw.protein_names) ? raw.protein_names : [];

        for (const proteinName of proteinNames) {
          const protein = (pkg.proteins || []).find(
            (entry: any) => entry?.name === proteinName && entry.available !== false
          );

          if (!protein) {
            throw new Error(`A selected protein is no longer available: ${proteinName}`);
          }

          unitPrice += numberOrZero(protein.price);
        }

        const addonIds = Array.isArray(raw.addon_ids) ? raw.addon_ids : [];

        for (const addonId of addonIds) {
          const addon = (pkg.addons || []).find(
            (entry: any) =>
              entry?.id === addonId &&
              entry.active !== false &&
              entry.available !== false
          );

          if (!addon) {
            throw new Error("A selected meal-kit extra is no longer available");
          }

          unitPrice += numberOrZero(addon.price);
        }

        const selections = Array.isArray(raw.selections) ? raw.selections : [];

        for (const selection of selections) {
          const selectionQty = Number(selection.quantity);

          if (!Number.isInteger(selectionQty) || selectionQty < 1 || selectionQty > 100) {
            throw new Error("Invalid meal-kit ingredient quantity");
          }

          const { data: product, error: productError } = await admin
            .from("products")
            .select("id,name,price,unit,variants,stock_status,status,is_hidden")
            .eq("id", selection.product_id)
            .maybeSingle();

          if (
            productError ||
            !product ||
            product.status !== "active" ||
            product.is_hidden ||
            product.stock_status === "out_of_stock"
          ) {
            throw new Error("A selected meal-kit ingredient is no longer available");
          }

          let ingredientPrice = numberOrZero(product.price);

          if (selection.unit && Array.isArray(product.variants) && product.variants.length) {
            const variant = product.variants.find(
              (entry: any) =>
                (entry?.label === selection.unit || entry?.unit === selection.unit) &&
                entry.stock_status !== "out_of_stock"
            );

            if (!variant) {
              throw new Error(`${product.name} is no longer available in the selected size`);
            }

            ingredientPrice = numberOrZero(variant.price);
          }

          unitPrice += ingredientPrice * selectionQty;
        }

        normalized = {
          ...raw,
          package_id: packageId,
          name: size ? `${pkg.name} — ${size.label}` : pkg.name,
          price: unitPrice,
          addons_total: 0,
          image: pkg.image || raw.image || "",
        };
      } else {
        unitPrice = numberOrZero(pkg.total_price || pkg.starting_price);

        if (unitPrice <= 0) {
          throw new Error(`Invalid price for ${pkg.name}`);
        }

        normalized = {
          ...raw,
          package_id: packageId,
          name: pkg.name,
          price: unitPrice,
          addons_total: 0,
          image: pkg.image || raw.image || "",
        };
      }
    } else {
      const productId = raw.product_id || String(raw.id || "").split("__")[0];

      const { data: product, error: productError } = await admin
        .from("products")
        .select("id,name,price,image,unit,variants,addons,stock_status,status,is_hidden")
        .eq("id", productId)
        .maybeSingle();

      if (
        productError ||
        !product ||
        product.status !== "active" ||
        product.is_hidden ||
        product.stock_status === "out_of_stock"
      ) {
        throw new Error(`This product is no longer available: ${raw.name || "product"}`);
      }

      unitPrice = numberOrZero(product.price);

      const selectedVariantLabel = raw.variant_label || raw.unit || "";

      if (selectedVariantLabel && Array.isArray(product.variants) && product.variants.length) {
        const variant = product.variants.find(
          (entry: any) =>
            (entry?.label === selectedVariantLabel || entry?.unit === selectedVariantLabel) &&
            entry.stock_status !== "out_of_stock"
        );

        if (!variant) {
          throw new Error(`${product.name} is no longer available in the selected size`);
        }

        unitPrice = numberOrZero(variant.price);
      }

      for (const addonId of (Array.isArray(raw.addon_ids) ? raw.addon_ids : [])) {
        const addon = (product.addons || []).find(
          (entry: any) => entry?.id === addonId && entry.active !== false
        );

        if (!addon) {
          throw new Error("A selected product extra is no longer available");
        }

        unitPrice += numberOrZero(addon.price);
      }

      normalized = {
        ...raw,
        product_id: product.id,
        name: product.name,
        price: unitPrice,
        addons_total: 0,
        image: product.image || raw.image || "",
      };
    }

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new Error("One of the cart items has an invalid price");
    }

    subtotal += unitPrice * quantity;
    normalizedItems.push(normalized);
  }

  const { data: deliverySettings } = await admin
    .from("delivery_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  const islandFee = numberOrZero(deliverySettings?.island_fee ?? 3000);
  const mainlandFee = numberOrZero(deliverySettings?.mainland_fee ?? 5000);
  const mainlandThreshold = numberOrZero(deliverySettings?.mainland_threshold ?? 10000);

  const baseDelivery =
    input.delivery_zone === "mainland" && subtotal >= mainlandThreshold
      ? mainlandFee
      : islandFee;

  const paidOrders = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("customer_email", user.email)
    .eq("payment_status", "Paid");

  const isFirstOrder = (paidOrders.count || 0) === 0;

  const discountPercent =
    deliverySettings?.discounts_enabled === false
      ? 0
      : isFirstOrder &&
          subtotal >= numberOrZero(deliverySettings?.first_order_min_subtotal ?? 4900)
        ? numberOrZero(deliverySettings?.first_order_discount_percent ?? 65)
        : numberOrZero(deliverySettings?.repeat_discount_percent ?? 50);

  const deliveryFee = Math.round(baseDelivery * (1 - discountPercent / 100));
  const serviceFee = subtotal < 5000 ? 0 : subtotal <= 50000 ? 310 : 490;

  const { data: promo } = await admin
    .from("promotion_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  const firstOrderDiscount =
    isFirstOrder && promo?.first_order_enabled !== false
      ? numberOrZero(promo?.first_order_discount ?? 500)
      : 0;

  let referralDiscount = 0;
  let verifiedReferralId: string | null = null;
  let verifiedReferralType: string | null = null;

  if (input.referral_id && ["referred", "referrer"].includes(input.referral_type)) {
    const { data: referral } = await admin
      .from("referrals")
      .select("*")
      .eq("id", input.referral_id)
      .maybeSingle();

    const eligible =
      referral &&
      referral.status === "first_order_placed" &&
      (input.referral_type === "referred"
        ? referral.referred_user_id === user.id && !referral.referred_rewarded
        : referral.referrer_id === user.id && !referral.referrer_rewarded);

    if (eligible) {
      referralDiscount = numberOrZero(referral.reward_amount || 550);
      verifiedReferralId = referral.id;
      verifiedReferralType = input.referral_type;
    }
  }

  let voucherDiscount = 0;
  let voucherCode: string | null = null;
  let voucherId: string | null = null;

  if (input.voucher_code) {
    const { data: voucher } = await admin
      .from("vouchers")
      .select("*")
      .ilike("code", String(input.voucher_code).trim())
      .eq("active", true)
      .maybeSingle();

    if (
      !voucher ||
      (voucher.expiry_date && new Date(voucher.expiry_date).getTime() < Date.now()) ||
      (voucher.max_uses != null && numberOrZero(voucher.uses) >= numberOrZero(voucher.max_uses)) ||
      (voucher.assigned_to_email &&
        voucher.assigned_to_email.toLowerCase() !== String(user.email).toLowerCase())
    ) {
      throw new Error("Your voucher is no longer valid. Please remove it and try again.");
    }

    if (voucher.one_time_use) {
      const { count: priorVoucherUse } = await admin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("customer_email", user.email)
        .eq("voucher_id", String(voucher.id))
        .eq("payment_status", "Paid");

      if ((priorVoucherUse || 0) > 0) {
        throw new Error("This voucher has already been used on your account");
      }
    }

    voucherCode = voucher.code;
    voucherId = voucher.id;

    voucherDiscount =
      voucher.discount_type === "fixed_amount"
        ? Math.min(numberOrZero(voucher.discount_amount), subtotal)
        : Math.round(subtotal * numberOrZero(voucher.discount_percent) / 100);
  }

  const discount = Math.min(subtotal, firstOrderDiscount + referralDiscount + voucherDiscount);
  const total = subtotal - discount + deliveryFee + serviceFee;

  if (subtotal < 5000) {
    throw new Error("Ukart requires a minimum order of ₦5,000");
  }

  if (!Number.isFinite(total) || total <= 0) {
    throw new Error("Invalid checkout total");
  }

  return {
    ...input,
    items: normalizedItems,
    subtotal,
    delivery_fee: deliveryFee,
    service_fee: serviceFee,
    discount,
    voucher_code: voucherCode,
    voucher_id: voucherId,
    total,
    is_first_order: isFirstOrder,
    first_order_discount: firstOrderDiscount,
    referral_id: verifiedReferralId,
    referral_type: verifiedReferralType,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return respond({ error: "Method not allowed" }, 405);
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY")!;

    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return respond({ error: "Authentication required" }, 401);
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return respond({ error: "Invalid session" }, 401);
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const action = body.action;

    if (action === "initialize") {
      const checkout = body.checkout;

      if (!checkout || !Array.isArray(checkout.items) || checkout.items.length === 0) {
        return respond({ error: "Your cart is empty" }, 400);
      }

      if (!user.email) {
        return respond({ error: "Customer email is missing" }, 400);
      }

      let authoritativeCheckout;

      try {
        authoritativeCheckout = await calculateAuthoritativeCheckout(admin, user, checkout);
      } catch (pricingError) {
        const message =
          pricingError instanceof Error
            ? pricingError.message
            : "Could not validate your cart";

        return respond({ error: message }, 400);
      }

      const amountKobo = Math.round(Number(authoritativeCheckout.total) * 100);
      const reference = `ukart-${crypto.randomUUID()}`;

      const { error: insertError } = await admin
        .from("payment_attempts")
        .insert({
          reference,
          user_id: user.id,
          amount_kobo: amountKobo,
          currency: "NGN",
          checkout_data: authoritativeCheckout,
          status: "initialized",
        });

      if (insertError) {
        console.error("Payment attempt insert failed:", insertError);
        return respond({ error: "Could not start payment" }, 500);
      }

      const requestedCallback = String(
        body.callbackUrl || "https://ukartapp.com/payment/callback"
      );

      let callbackUrl = "https://ukartapp.com/payment/callback";

      try {
        const parsedCallback = new URL(requestedCallback);

        if (
          parsedCallback.hostname === "ukartapp.com" ||
          parsedCallback.hostname.endsWith(".ukartapp.com")
        ) {
          callbackUrl = parsedCallback.toString();
        }
      } catch {
        // Use the fixed Ukart callback URL.
      }

      const paystackResponse = await fetch(
        "https://api.paystack.co/transaction/initialize",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.email,
            amount: amountKobo,
            reference,
            currency: "NGN",
            callback_url: callbackUrl,
            metadata: { user_id: user.id },
          }),
        }
      );

      const paystack = await paystackResponse.json();

      if (!paystackResponse.ok || !paystack.status) {
        await admin
          .from("payment_attempts")
          .update({ status: "failed" })
          .eq("reference", reference);

        return respond(
          { error: paystack.message || "Paystack initialization failed" },
          502
        );
      }

      return respond({
        ok: true,
        reference,
        amount_kobo: amountKobo,
        total_naira: authoritativeCheckout.total,
        authorization_url: paystack.data.authorization_url,
        access_code: paystack.data.access_code,
      });
    }

    if (action === "cancel") {
      const reference = String(body.reference || "");

      if (!reference) {
        return respond({ error: "Payment reference is required" }, 400);
      }

      const { error: cancelError } = await admin
        .from("payment_attempts")
        .update({ status: "failed" })
        .eq("reference", reference)
        .eq("user_id", user.id)
        .is("order_id", null)
        .eq("status", "initialized");

      if (cancelError) {
        return respond({ error: "Could not close payment attempt" }, 500);
      }

      return respond({ ok: true });
    }

    if (action === "verify") {
      const reference = String(body.reference || "");

      if (!reference) {
        return respond({ error: "Payment reference is required" }, 400);
      }

      const { data: attempt, error: attemptError } = await admin
        .from("payment_attempts")
        .select("*")
        .eq("reference", reference)
        .eq("user_id", user.id)
        .single();

      if (attemptError || !attempt) {
        return respond({ error: "Payment attempt not found" }, 404);
      }

      if (attempt.order_id) {
        return respond({
          ok: true,
          orderId: attempt.order_id,
          alreadyProcessed: true,
        });
      }

      const verifyResponse = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
        }
      );

      const verification = await verifyResponse.json();
      const transaction = verification.data;

      if (
        !verifyResponse.ok ||
        !verification.status ||
        transaction?.status !== "success" ||
        transaction?.reference !== reference ||
        Number(transaction?.amount) !== Number(attempt.amount_kobo) ||
        transaction?.currency !== "NGN"
      ) {
        return respond(
          { ok: false, error: "Payment has not been confirmed" },
          402
        );
      }

      const { data: finalized, error: finalizeError } = await admin.rpc(
        "finalize_paystack_payment",
        {
          p_reference: reference,
          p_transaction_id: transaction.id,
          p_transaction_data: transaction,
          p_mode: PAYSTACK_SECRET_KEY.startsWith("sk_test_") ? "test" : "live",
        }
      );

      if (finalizeError || !finalized?.ok || !finalized?.orderId) {
        console.error(
          "Verified payment finalization failed:",
          finalizeError || finalized
        );

        return respond(
          {
            ok: false,
            paid: true,
            error:
              finalized?.error ||
              "Payment verified but order creation needs reconciliation.",
            reference,
          },
          500
        );
      }

      return respond({
        ok: true,
        orderId: finalized.orderId,
        alreadyProcessed: Boolean(finalized.alreadyProcessed),
      });
    }

    return respond({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error("Payment function error:", error);
    return respond({ error: "Payment service error" }, 500);
  }
});