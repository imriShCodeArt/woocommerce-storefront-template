# WooCommerce storefront template

A reusable Next.js storefront. The app renders the catalog. Cart, checkout, and customer accounts stay on a WooCommerce store.

Copy this repository when starting a new shop, then replace the placeholder name, copy, and pages, and point it at a WooCommerce site.

This repo is a Turborepo monorepo:

| Path              | Purpose                                  |
| ----------------- | ---------------------------------------- |
| `apps/platform`   | The Next.js storefront (port 3000)       |
| `packages/ui`     | MUI theme and direction                  |
| `packages/i18n`   | Locales and next-intl navigation helpers |
| `packages/config` | Site config and public env validation    |

## Stack

- Next.js App Router
- React and TypeScript
- MUI
- next-intl (Hebrew default, English)
- WooCommerce as the commerce host

## How shopping works

- Product, category, and search pages are rendered by this app.
- Catalog data is read server-side from WooCommerce:
  - `wc/v3` when `WOOCOMMERCE_CONSUMER_KEY` and `WOOCOMMERCE_CONSUMER_SECRET` are both set (this includes variations)
  - the public Store API (`wc/store/v1`) when the store URL is set and the keys are empty
- **Add to cart** sends the shopper to `{store}/cart/?add-to-cart={id}&quantity={n}`
- The header cart and account links open `{store}/cart/` and `{store}/my-account/`
- Checkout is the WooCommerce checkout page. This app does not create a cart session or take payment
- With no store URL, the shop shows a small sample catalog so the template runs before a store is connected

WooCommerce must use pretty permalinks ("Post name"). If the cart, checkout, or account page slugs were renamed, update the paths in `apps/platform/src/lib/woocommerce/hosted-urls.ts`.

The sitemap includes the first 100 products and the category list from the connected store.

## Getting started

```bash
yarn install
cp apps/platform/.env.example apps/platform/.env.local
```

Set at least:

| Variable                            | Purpose                                               |
| ----------------------------------- | ----------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`              | Public origin, for example `http://localhost:3000`    |
| `NEXT_PUBLIC_WOOCOMMERCE_STORE_URL` | WooCommerce origin. Omit it to use the sample catalog |
| `WOOCOMMERCE_CONSUMER_KEY`          | Optional read-only REST key                           |
| `WOOCOMMERCE_CONSUMER_SECRET`       | Optional REST secret. Set both keys, or neither       |

Then:

```bash
yarn dev
```

## Scripts

```bash
yarn dev
yarn build
yarn lint
yarn typecheck
yarn test
yarn validate
```

## Branching

Feature branches start from `preview`. Open pull requests against `preview`. Promote to production with a `preview` → `main` pull request. See [`.github/BRANCHING.md`](.github/BRANCHING.md).
