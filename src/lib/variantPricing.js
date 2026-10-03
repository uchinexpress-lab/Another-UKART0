// Shared variant-aware pricing logic for the Ukart storefront.

export function getActiveVariants(product) {
  if (!product?.variants || !Array.isArray(product.variants)) return [];
  return product.variants.filter((v) => v && v.stock_status !== 'out_of_stock');
}

export function getAllVariants(product) {
  if (!product?.variants || !Array.isArray(product.variants)) return [];
  return product.variants.filter(Boolean);
}

export function formatNaira(n) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

/**
 * Returns the display price info for a product card.
 *  - 0 active variants → product-level price
 *  - 1 active variant  → that variant's price
 *  - multiple, same price → single price
 *  - multiple, different prices → "₦min – ₦max"
 */
export function getDisplayPrice(product) {
  const active = getActiveVariants(product);

  if (active.length === 0) {
    const p = product?.price || 0;
    return { text: formatNaira(p), isRange: false, min: p, max: p };
  }

  if (active.length === 1) {
    const p = active[0].price || 0;
    return { text: formatNaira(p), isRange: false, min: p, max: p };
  }

  const prices = active.map((v) => v.price).filter((p) => p != null && !isNaN(p));
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  if (min === max) {
    return { text: formatNaira(min), isRange: false, min, max };
  }

  return { text: `${formatNaira(min)} – ${formatNaira(max)}`, isRange: true, min, max };
}

export function hasMultipleVariants(product) {
  return getActiveVariants(product).length > 1;
}

/** Lowest active variant price, or product-level price when no variants. */
export function getEffectivePrice(product) {
  const active = getActiveVariants(product);
  if (active.length === 0) return product?.price || 0;
  return Math.min(...active.map((v) => v.price));
}

/** Builds the cart item object for a selected variant (with optional add-ons). */
export function buildCartItem(product, variant, addons = []) {
  const addonSuffix = addons.length > 0 ? `__a_${addons.map((a) => a.id).sort().join('-')}` : '';
  const addonsTotal = addons.reduce((sum, a) => sum + (a.price || 0), 0);
  if (!variant) {
    return {
      ...product,
      id: `${product.id}${addonSuffix}`,
      product_id: product.id,
      addons,
      addons_total: addonsTotal,
    };
  }
  return {
    ...product,
    id: `${product.id}__${variant.label}${addonSuffix}`,
    product_id: product.id,
    price: variant.price,
    original_price: variant.original_price || product.original_price,
    unit: variant.label,
    variant_label: variant.label,
    addons,
    addons_total: addonsTotal,
  };
}

/** Returns the active add-ons for a product (sorted by display_order). */
export function getActiveAddons(product) {
  if (!product?.addons || !Array.isArray(product.addons)) return [];
  return product.addons
    .filter((a) => a && a.active !== false)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
}

/** Returns the variant to use for a single-variant product, or null. */
export function getSingleVariant(product) {
  const active = getActiveVariants(product);
  return active.length === 1 ? active[0] : null;
}