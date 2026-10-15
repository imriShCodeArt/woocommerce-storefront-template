import { afterEach, describe, expect, it } from 'vitest';

import { wooAddToCartUrl, wooCartUrl } from '@/lib/woocommerce/hosted-urls';
import {
  formatCatalogPrice,
  parseDecimalAmount,
  parseMinorAmount,
} from '@/lib/woocommerce/money';
import { mapRestProduct, mapStoreProduct } from '@/lib/woocommerce/map-product';
import { getPublicWooCommerceStoreUrl } from '@/lib/woocommerce/public-config';
import {
  htmlToText,
  sanitizeProductHtml,
} from '@/lib/woocommerce/sanitize-html';

describe('catalog money', () => {
  it('parses decimal and minor-unit prices', () => {
    expect(parseDecimalAmount('19.90')).toBe(19.9);
    expect(parseDecimalAmount('')).toBeNull();
    expect(parseMinorAmount('1990', 2)).toBe(19.9);
    expect(parseMinorAmount('5', 0)).toBe(5);
  });

  it('formats a price for the active locale', () => {
    expect(formatCatalogPrice(48, 'ILS', 'en')).toContain('48');
    expect(formatCatalogPrice(null, 'ILS', 'en')).toBe('');
  });
});

describe('hosted WooCommerce URLs', () => {
  it('builds cart and add-to-cart links on the store host', () => {
    expect(wooCartUrl('https://shop.example.com')).toBe(
      'https://shop.example.com/cart/',
    );
    expect(wooAddToCartUrl('https://shop.example.com/store', 42, 2)).toBe(
      'https://shop.example.com/store/cart/?add-to-cart=42&quantity=2',
    );
  });
});

describe('getPublicWooCommerceStoreUrl', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL;
  });

  it('drops credentials and a trailing slash', () => {
    process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL =
      'https://user:pass@shop.example.com/store/';
    expect(getPublicWooCommerceStoreUrl()).toBe(
      'https://shop.example.com/store',
    );
  });
});

describe('product HTML', () => {
  it('removes scripts and unsafe links', () => {
    const html = sanitizeProductHtml(
      '<p>Hello</p><script>alert(1)</script><a href="javascript:alert(1)">x</a><a href="https://shop.example.com/cart">Cart</a>',
    );
    expect(html).not.toContain('script');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('https://shop.example.com/cart');
    expect(htmlToText('<p>Hello <strong>there</strong></p>')).toBe(
      'Hello there',
    );
  });
});

describe('WooCommerce product mapping', () => {
  it('maps a REST product', () => {
    const product = mapRestProduct(
      {
        id: 7,
        name: 'Mug',
        slug: 'mug',
        type: 'simple',
        price: '48',
        regular_price: '48',
        purchasable: true,
        stock_status: 'instock',
        short_description: '<p>Stoneware</p>',
      },
      'ILS',
    );
    expect(product).toMatchObject({
      id: 7,
      slug: 'mug',
      priceAmount: 48,
      currency: 'ILS',
      shortDescription: 'Stoneware',
      inStock: true,
    });
  });

  it('maps a Store API product from minor units', () => {
    const product = mapStoreProduct({
      id: 8,
      name: 'Tote',
      slug: 'tote',
      type: 'simple',
      on_sale: true,
      is_in_stock: true,
      is_purchasable: true,
      prices: {
        price: '9600',
        regular_price: '12000',
        currency_code: 'ILS',
        currency_minor_unit: 2,
      },
    });
    expect(product).toMatchObject({
      priceAmount: 96,
      regularPriceAmount: 120,
      onSale: true,
      currency: 'ILS',
    });
  });
});
