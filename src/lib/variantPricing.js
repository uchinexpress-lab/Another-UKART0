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

/** Builds the cart item object for a selected variant (or returns the product as-is). */
export function buildCartItem(product, variant) {
  if (!variant) return product;
  return {
    ...product,
    id: `${product.id}__${variant.label}`,
    price: variant.price,
    original_price: variant.original_price || product.original_price,
    unit: variant.label,
    variant_label: variant.label,
  };
}

/** Returns the variant to use for a single-variant product, or null. */
export function getSingleVariant(product) {
  const active = getActiveVariants(product);
  return active.length === 1 ? active[0] : null;
}