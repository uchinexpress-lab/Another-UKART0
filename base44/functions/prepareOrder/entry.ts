import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";

// Server-side order preparation. The client NEVER provides prices or totals —
// it sends only product_id, variant_label, quantity, addon_ids, voucher_code,
// and delivery details. The server re-fetches each Product from the catalog,
// resolves the true unit price for the chosen variant, resolves add-on prices
// from the saved product data, enforces stock, recomputes the subtotal,
// validates the voucher and referral server-side, checks first-order
// promotion eligibility, computes the delivery fee and discount, and creates
// the Order record itself.
//
// Voucher usage is NOT incremented here — that happens on successful payment
// (confirmPayment), so a failed/abandoned payment never consumes a one-time
// voucher. The referral reward is likewise finalized on successful payment.

const REFERRAL_REWARD_AMOUNT = 1000;
const DELIVERY_FEE = 1500;

// Service fee by order subtotal (naira). Mirrors src/lib/fees.js.
function getServiceFee(subtotal: number): number {
  if (subtotal <= 0) return 0;
  if (subtotal <= 5000) return 560;
  if (subtotal <= 25000) return 865;
  if (subtotal <= 55000) return 1265;
  if (subtotal <= 125000) return 1865;
  return 2665;
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      items,
      voucherCode,
      customer_name,
      customer_phone,
      customer_address,
      landmark,
      delivery_zone,
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ error: "Cart is empty" }, { status: 400 });
    }
    if (!customer_name || !customer_phone || !customer_address || !landmark) {
      return Response.json({ error: "Missing delivery details" }, { status: 400 });
    }

    const admin = base44.asServiceRole;

    // --- Load promotion settings (server-authoritative) ---
    const promoRes = await admin.entities.PromotionSetting.filter({}, { limit: 1 });
    const promo = promoRes.items && promoRes.items[0];
    const firstOrderEnabled = promo ? promo.first_order_enabled !== false : true;
    const firstOrderDiscountAmount = promo ? Number(promo.first_order_discount) || 0 : 500;
    const freeDeliveryThreshold = promo ? Number(promo.free_delivery_threshold) || 30000 : 30000;
    const firstOrderFreeDeliveryEnabled = promo ? promo.first_order_free_delivery_enabled !== false : true;

    // --- First-order eligibility: no previously paid orders ---
    const paidOrdersRes = await admin.entities.Order.filter(
      { customer_email: user.email, payment_status: "Paid" },
      { limit: 1 }
    );
    const isFirstOrder = !paidOrdersRes.items || paidOrdersRes.items.length === 0;

    // --- Recompute subtotal from the catalog ---
    const orderItems: any[] = [];
    let subtotal = 0;

    for (const ci of items) {
      const productId = ci.product_id;
      const variantLabel = ci.variant_label || "";
      const quantity = Number(ci.quantity);

      if (!productId || !quantity || quantity <= 0) {
        return Response.json({ error: "Invalid cart item" }, { status: 400 });
      }

      const product = await admin.entities.Product.get(productId);
      if (!product) {
        return Response.json({ error: `Product not found: ${productId}` }, { status: 400 });
      }
      if (product.is_hidden) {
        return Response.json({ error: `Product not available: ${product.name}` }, { status: 400 });
      }

      let unitPrice: number;
      let unit: string = product.unit || "";
      let itemStockStatus = product.stock_status || "in_stock";

      if (Array.isArray(product.variants) && product.variants.length > 0) {
        const variant = product.variants.find(
          (v: any) => v.label === variantLabel
        );
        if (!variant) {
          return Response.json(
            { error: `Variant "${variantLabel}" not found for ${product.name}` },
            { status: 400 }
          );
        }
        unitPrice = Number(variant.price);
        if (variant.unit) unit = variant.unit;
        if (variant.stock_status) itemStockStatus = variant.stock_status;
      } else {
        if (variantLabel) {
          return Response.json(
            { error: `${product.name} has no variants` },
            { status: 400 }
          );
        }
        unitPrice = Number(product.price);
      }

      if (itemStockStatus === "out_of_stock" || product.stock_status === "out_of_stock") {
        return Response.json(
          { error: `${product.name} is out of stock` },
          { status: 400 }
        );
      }

      // --- Resolve add-ons from the product's saved data (server-authoritative) ---
      const addonIds: string[] = Array.isArray(ci.addon_ids) ? ci.addon_ids : [];
      let addonsTotal = 0;
      const resolvedAddons: any[] = [];
      if (addonIds.length > 0 && Array.isArray(product.addons)) {
        for (const addonId of addonIds) {
          const addon = product.addons.find(
            (a: any) => a.id === addonId && a.active !== false
          );
          if (addon) {
            const addonPrice = Number(addon.price) || 0;
            addonsTotal += addonPrice;
            resolvedAddons.push({
              id: addon.id,
              name: addon.name,
              price: addonPrice,
            });
          }
        }
      }

      const lineTotal = (unitPrice + addonsTotal) * quantity;
      subtotal += lineTotal;

      const displayLabel = variantLabel
        ? `${product.name} (${variantLabel})`
        : product.name;

      orderItems.push({
        product_id: productId,
        product_name: product.name,
        variant_label: variantLabel,
        name: displayLabel,
        price: unitPrice,
        quantity,
        unit,
        addons: resolvedAddons,
        addons_total: addonsTotal,
      });
    }

    // --- First-order promotion calculations ---
    let firstOrderDiscount = 0;

    if (isFirstOrder && firstOrderEnabled) {
      firstOrderDiscount = Math.min(firstOrderDiscountAmount, subtotal);
    }

    // --- Delivery fee ---
    // Base and discount are admin-editable (DeliverySetting); the defaults
    // below apply until an admin saves their own values.
    // Mirrors src/lib/delivery.js.
    const zone = delivery_zone === "mainland" ? "mainland" : "island";
    const deliverySettingRes = await admin.entities.DeliverySetting.filter({}, { limit: 1 });
    const ds = (deliverySettingRes.items && deliverySettingRes.items[0]) || {};
    const islandFee = Number(ds.island_fee ?? 3000) || 0;
    const mainlandFee = Number(ds.mainland_fee ?? 5000) || 0;
    const mainlandThreshold = Number(ds.mainland_threshold ?? 10000) || 0;
    const discountsEnabled = ds.discounts_enabled !== false;
    const firstOrderPercent = Number(ds.first_order_discount_percent ?? 65) || 0;
    const repeatPercent = Number(ds.repeat_discount_percent ?? 50) || 0;
    const firstOrderMinSubtotal = Number(ds.first_order_min_subtotal ?? 4900) || 0;

    const baseDelivery = zone === "mainland" && subtotal >= mainlandThreshold
      ? mainlandFee
      : islandFee;
    const splashFirst = isFirstOrder && subtotal >= firstOrderMinSubtotal;
    const deliveryPercent = discountsEnabled
      ? (splashFirst ? firstOrderPercent : repeatPercent)
      : 0;
    const delivery_fee = subtotal > 0
      ? Math.round(baseDelivery * (1 - deliveryPercent / 100))
      : 0;

    // --- Voucher validation (check only — do NOT increment) ---
    let voucherDiscount = 0;
    let voucher_code = "";
    let voucher_id = "";
    if (voucherCode && String(voucherCode).trim()) {
      const code = String(voucherCode).trim().toUpperCase();
      const vRes = await admin.entities.Voucher.filter(
        { code, active: true },
        { limit: 1 }
      );
      const v = vRes.items && vRes.items[0];
      if (!v) {
        return Response.json({ error: "Invalid or expired voucher code" }, { status: 400 });
      }
      if (v.max_uses && (v.uses || 0) >= v.max_uses) {
        return Response.json({ error: "This voucher has reached its usage limit" }, { status: 400 });
      }
      if (v.assigned_to_email && v.assigned_to_email !== user.email) {
        return Response.json({ error: "This voucher is not available for your account" }, { status: 400 });
      }
      if (v.expiry_date && new Date(v.expiry_date) < new Date()) {
        return Response.json({ error: "This voucher has expired" }, { status: 400 });
      }
      voucherDiscount =
        v.discount_type === "fixed_amount"
          ? Math.min(Number(v.discount_amount) || 0, subtotal)
          : Math.round((subtotal * (Number(v.discount_percent) || 0)) / 100);
      voucher_code = code;
      voucher_id = v.id;
    }

    // --- Referral validation (server-capped amount, legitimate status) ---
    let referralDiscount = 0;
    let referral_id = "";
    let referral_type = "";

    // As the referred user (discount on this order if first_order_placed + not rewarded)
    const asReferred = await admin.entities.Referral.filter(
      { referred_user_id: user.id, status: "first_order_placed", referred_rewarded: false },
      { limit: 1 }
    );
    if (asReferred.items && asReferred.items.length > 0) {
      referralDiscount = REFERRAL_REWARD_AMOUNT;
      referral_id = asReferred.items[0].id;
      referral_type = "referred";
    } else {
      // As the referrer (discount on this order if first_order_placed + not rewarded)
      const asReferrer = await admin.entities.Referral.filter(
        { referrer_id: user.id, status: "first_order_placed", referrer_rewarded: false },
        { limit: 1 }
      );
      if (asReferrer.items && asReferrer.items.length > 0) {
        referralDiscount = REFERRAL_REWARD_AMOUNT;
        referral_id = asReferrer.items[0].id;
        referral_type = "referrer";
      }
    }

    // --- Service fee (tiered by subtotal) ---
    const service_fee = getServiceFee(subtotal);

    // --- Totals ---
    const discount = Math.min(referralDiscount + voucherDiscount + firstOrderDiscount, subtotal);
    const total = subtotal - discount + delivery_fee + service_fee;

    if (total <= 0) {
      return Response.json({ error: "Invalid order amount" }, { status: 400 });
    }

    // --- Create the Order (service role) ---
    const orderNumber = `UK-${Date.now().toString().slice(-6)}`;
    const order = await admin.entities.Order.create({
      order_number: orderNumber,
      items: orderItems,
      subtotal,
      delivery_fee,
      service_fee,
      discount,
      voucher_code,
      total,
      customer_name,
      customer_phone,
      customer_email: user.email,
      customer_address,
      landmark,
      delivery_zone: zone,
      status: "awaiting_payment",
      payment_method: "Pay Online",
      payment_status: "Pending",
      referral_id,
      referral_type,
      is_first_order: isFirstOrder && firstOrderDiscount > 0,
      first_order_discount: firstOrderDiscount,
    });

    // --- Transition the referred user's pending referral → first_order_placed ---
    // (Preserves existing trigger behavior: happens on the first order placement,
    //  so the discount applies on a subsequent order. Reward finalization is
    //  deferred to successful payment.)
    if (!referral_id) {
      const pending = await admin.entities.Referral.filter(
        { referred_user_id: user.id, status: "pending" },
        { limit: 1 }
      );
      if (pending.items && pending.items.length > 0) {
        await admin.entities.Referral.update(pending.items[0].id, {
          status: "first_order_placed",
        });
      }
    }

    return Response.json({
      orderId: order.id,
      orderNumber,
      subtotal,
      delivery_fee,
      service_fee,
      discount,
      total,
      voucher_id,
      is_first_order: isFirstOrder && firstOrderDiscount > 0,
      first_order_discount: firstOrderDiscount,
      delivery_zone: zone,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}