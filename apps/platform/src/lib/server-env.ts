/**
 * Server-only environment variables. Import this only from server code
 * such as route handlers. WooCommerce catalog settings are read in
 * `src/lib/woocommerce`.
 */

export const serverEnv = {
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  CONTACT_FROM_EMAIL: process.env.CONTACT_FROM_EMAIL,
  CONTACT_TO_EMAIL: process.env.CONTACT_TO_EMAIL,
};
