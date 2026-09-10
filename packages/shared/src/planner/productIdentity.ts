/**
 * Canonical identity for a commercial product.
 *
 * SKU is preferred when the source provides it. When it does not, the identity
 * is derived from stable catalog attributes. Prices, descriptions and URLs are
 * deliberately excluded so a price change does not create a new product.
 */
export interface ProductIdentityInput {
  sku?: string | null;
  brand?: string | null;
  model?: string | null;
  productName?: string | null;
  category?: string | null;
  variant?: string | null;
  voltage?: string | null;
}

export function normalizeIdentityPart(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildProductIdentityKey(input: ProductIdentityInput): string {
  const sku = normalizeIdentityPart(input.sku);
  if (sku) return `sku|${sku}`;

  const brand = normalizeIdentityPart(input.brand);
  const model = normalizeIdentityPart(input.model);
  const variant = normalizeIdentityPart(input.variant);
  const voltage = normalizeIdentityPart(input.voltage);
  const category = normalizeIdentityPart(input.category);
  const productName = normalizeIdentityPart(input.productName);

  return [brand, model || productName, variant, voltage, category]
    .filter(Boolean)
    .join('|');
}

export function sameProductIdentity(a: ProductIdentityInput, b: ProductIdentityInput): boolean {
  return buildProductIdentityKey(a) === buildProductIdentityKey(b);
}
