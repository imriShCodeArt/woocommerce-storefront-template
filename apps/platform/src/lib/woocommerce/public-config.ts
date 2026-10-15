/**
 * Public WooCommerce origin. Safe to read from client components.
 * Cart, checkout, and customer account links are built from this URL.
 * Leave it unset to run the storefront against the built-in sample catalog.
 */
export function getPublicWooCommerceStoreUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL?.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    url.username = '';
    url.password = '';
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}
