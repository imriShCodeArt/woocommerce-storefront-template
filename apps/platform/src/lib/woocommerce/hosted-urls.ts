/**
 * Default WooCommerce page slugs. Change these if the store renamed
 * Cart, Checkout, or My account (WooCommerce → Settings → Advanced → Page setup).
 * Pretty permalinks ("Post name") are required.
 */
const CART_PATH = '/cart/';
const CHECKOUT_PATH = '/checkout/';
const ACCOUNT_PATH = '/my-account/';

export function joinStoreUrl(storeUrl: string, path: string): string {
  const base = storeUrl.replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function wooCartUrl(storeUrl: string): string {
  return joinStoreUrl(storeUrl, CART_PATH);
}

export function wooCheckoutUrl(storeUrl: string): string {
  return joinStoreUrl(storeUrl, CHECKOUT_PATH);
}

export function wooAccountUrl(storeUrl: string): string {
  return joinStoreUrl(storeUrl, ACCOUNT_PATH);
}

/**
 * Lands the shopper on the WooCommerce cart with the product already added.
 * The Next.js app does not create a cart session of its own.
 */
export function wooAddToCartUrl(
  storeUrl: string,
  productId: number,
  quantity: number,
): string {
  const url = new URL(wooCartUrl(storeUrl));
  const safeQuantity = Number.isFinite(quantity)
    ? Math.min(99, Math.max(1, Math.trunc(quantity)))
    : 1;
  url.searchParams.set('add-to-cart', String(productId));
  url.searchParams.set('quantity', String(safeQuantity));
  return url.toString();
}
