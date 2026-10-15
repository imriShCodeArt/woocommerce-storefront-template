import { cache } from 'react';

import { getPublicWooCommerceStoreUrl } from './public-config';
import {
  mapCategoriesResponse,
  mapRestCurrency,
  mapRestProduct,
  mapRestVariation,
  mapStoreProduct,
} from './map-product';
import { sampleCategories, sampleProducts } from './sample-catalog';
import type {
  CatalogCategoriesResult,
  CatalogListResult,
  CatalogProduct,
  CatalogProductResult,
} from './types';

const CATALOG_PAGE_SIZE = 12;
const REVALIDATE_SECONDS = 60;

type ListQuery = {
  page: number;
  perPage: number;
  search: string;
  categorySlug: string;
};

type WooCredentials = {
  key: string;
  secret: string;
};

function getCredentials(): WooCredentials | 'incomplete' | null {
  const key = process.env.WOOCOMMERCE_CONSUMER_KEY?.trim() ?? '';
  const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET?.trim() ?? '';
  if (!key && !secret) return null;
  if (!key || !secret) return 'incomplete';
  return { key, secret };
}

function authorizationHeader(credentials: WooCredentials): string {
  return `Basic ${Buffer.from(`${credentials.key}:${credentials.secret}`).toString('base64')}`;
}

function wooEndpoint(storeUrl: string, path: string): string {
  const base = storeUrl.replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

async function wooFetch(
  storeUrl: string,
  path: string,
  credentials: WooCredentials | null,
): Promise<Response | null> {
  const endpoint = wooEndpoint(storeUrl, path);
  try {
    const headers = new Headers({ Accept: 'application/json' });
    if (credentials) {
      headers.set('Authorization', authorizationHeader(credentials));
    }
    return await fetch(endpoint, {
      headers,
      next: { revalidate: REVALIDATE_SECONDS },
    });
  } catch (error) {
    console.error('[woocommerce] Request failed', path, error);
    return null;
  }
}

async function readJson(response: Response | null): Promise<unknown | null> {
  if (!response?.ok) {
    if (response) {
      console.error('[woocommerce] Catalog request failed', response.status);
    }
    return null;
  }
  try {
    return (await response.json()) as unknown;
  } catch (error) {
    console.error('[woocommerce] Catalog response was not JSON', error);
    return null;
  }
}

function readTotals(
  response: Response,
  fallbackCount: number,
  perPage: number,
): { total: number; totalPages: number } {
  const total = Number(response.headers.get('X-WP-Total'));
  const totalPages = Number(response.headers.get('X-WP-TotalPages'));
  return {
    total: Number.isFinite(total) && total >= 0 ? total : fallbackCount,
    totalPages:
      Number.isFinite(totalPages) && totalPages >= 1
        ? totalPages
        : Math.max(1, Math.ceil(fallbackCount / perPage)),
  };
}

const getRestCurrency = cache(
  async (storeUrl: string, key: string, secret: string) => {
    const response = await wooFetch(
      storeUrl,
      '/wp-json/wc/v3/settings/general/woocommerce_currency',
      { key, secret },
    );
    const json = await readJson(response);
    return mapRestCurrency(json) ?? 'USD';
  },
);

function sampleList(query: ListQuery): CatalogListResult {
  const search = query.search.trim().toLowerCase();
  const filtered = sampleProducts.filter((product) => {
    const matchesCategory = query.categorySlug
      ? product.categories.some(
          (category) => category.slug === query.categorySlug,
        )
      : true;
    const matchesSearch = search
      ? `${product.name} ${product.shortDescription} ${product.sku}`
          .toLowerCase()
          .includes(search)
      : true;
    return matchesCategory && matchesSearch;
  });
  const start = (query.page - 1) * query.perPage;
  const products = filtered.slice(start, start + query.perPage);
  return {
    status: 'ready',
    source: 'sample',
    products,
    page: query.page,
    perPage: query.perPage,
    total: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / query.perPage)),
  };
}

async function categoryIdForSlug(
  storeUrl: string,
  credentials: WooCredentials | null,
  slug: string,
): Promise<number | null | 'unavailable'> {
  if (!slug) return null;
  const base = credentials
    ? '/wp-json/wc/v3/products/categories'
    : '/wp-json/wc/store/v1/products/categories';
  const params = new URLSearchParams({ slug });
  const response = await wooFetch(
    storeUrl,
    `${base}?${params.toString()}`,
    credentials,
  );
  const json = await readJson(response);
  if (!json) return 'unavailable';
  const categories = mapCategoriesResponse(json);
  if (!categories) return 'unavailable';
  return categories[0]?.id ?? null;
}

async function listFromWoo(
  storeUrl: string,
  credentials: WooCredentials | null,
  query: ListQuery,
): Promise<CatalogListResult> {
  const categoryId = await categoryIdForSlug(
    storeUrl,
    credentials,
    query.categorySlug,
  );
  if (categoryId === 'unavailable') return { status: 'unavailable' };
  if (query.categorySlug && categoryId == null) {
    return {
      status: 'ready',
      source: 'woocommerce',
      products: [],
      page: query.page,
      perPage: query.perPage,
      total: 0,
      totalPages: 1,
    };
  }

  const params = new URLSearchParams({
    page: String(query.page),
    per_page: String(query.perPage),
    orderby: 'date',
    order: 'desc',
  });
  if (query.search) params.set('search', query.search);
  if (categoryId != null) params.set('category', String(categoryId));

  if (credentials) {
    params.set('status', 'publish');
    const response = await wooFetch(
      storeUrl,
      `/wp-json/wc/v3/products?${params.toString()}`,
      credentials,
    );
    const json = await readJson(response);
    if (!response || !json || !Array.isArray(json)) {
      return { status: 'unavailable' };
    }
    const currency = await getRestCurrency(
      storeUrl,
      credentials.key,
      credentials.secret,
    );
    const products = json.flatMap((item) => {
      const product = mapRestProduct(item, currency);
      return product ? [product] : [];
    });
    const totals = readTotals(response, products.length, query.perPage);
    return {
      status: 'ready',
      source: 'woocommerce',
      products,
      page: query.page,
      perPage: query.perPage,
      ...totals,
    };
  }

  const response = await wooFetch(
    storeUrl,
    `/wp-json/wc/store/v1/products?${params.toString()}`,
    null,
  );
  const json = await readJson(response);
  if (!response || !json || !Array.isArray(json)) {
    return { status: 'unavailable' };
  }
  const products = json.flatMap((item) => {
    const product = mapStoreProduct(item);
    return product ? [product] : [];
  });
  const totals = readTotals(response, products.length, query.perPage);
  return {
    status: 'ready',
    source: 'woocommerce',
    products,
    page: query.page,
    perPage: query.perPage,
    ...totals,
  };
}

async function loadRestVariations(
  storeUrl: string,
  credentials: WooCredentials,
  productId: number,
  currency: string,
): Promise<CatalogProduct['variations'] | null> {
  const response = await wooFetch(
    storeUrl,
    `/wp-json/wc/v3/products/${productId}/variations?per_page=100`,
    credentials,
  );
  const json = await readJson(response);
  if (!json || !Array.isArray(json)) return null;
  return json.flatMap((item) => {
    const variation = mapRestVariation(item, currency);
    return variation ? [variation] : [];
  });
}

const listProductsCached = cache(
  async (
    page: number,
    perPage: number,
    search: string,
    categorySlug: string,
  ): Promise<CatalogListResult> => {
    const query = { page, perPage, search, categorySlug };
    const storeUrl = getPublicWooCommerceStoreUrl();
    if (!storeUrl) return sampleList(query);

    const credentials = getCredentials();
    if (credentials === 'incomplete') {
      console.error(
        '[woocommerce] Set both WOOCOMMERCE_CONSUMER_KEY and WOOCOMMERCE_CONSUMER_SECRET, or leave both empty to use the public Store API.',
      );
      return { status: 'unavailable' };
    }

    return listFromWoo(storeUrl, credentials, query);
  },
);

export function parseCatalogPage(value: string | undefined): number {
  const page = Number(value);
  if (!Number.isInteger(page) || page < 1) return 1;
  return page;
}

export async function listProducts(options?: {
  page?: number;
  perPage?: number;
  search?: string;
  categorySlug?: string;
}): Promise<CatalogListResult> {
  return listProductsCached(
    options?.page && options.page > 0 ? options.page : 1,
    options?.perPage && options.perPage > 0
      ? options.perPage
      : CATALOG_PAGE_SIZE,
    options?.search?.trim() ?? '',
    options?.categorySlug?.trim() ?? '',
  );
}

export async function listCategories(): Promise<CatalogCategoriesResult> {
  const storeUrl = getPublicWooCommerceStoreUrl();
  if (!storeUrl) {
    return { status: 'ready', source: 'sample', categories: sampleCategories };
  }

  const credentials = getCredentials();
  if (credentials === 'incomplete') return { status: 'unavailable' };

  const path = credentials
    ? '/wp-json/wc/v3/products/categories?per_page=100&hide_empty=true'
    : '/wp-json/wc/store/v1/products/categories?per_page=100';
  const response = await wooFetch(storeUrl, path, credentials);
  const json = await readJson(response);
  const categories = json ? mapCategoriesResponse(json) : null;
  if (!categories) return { status: 'unavailable' };
  return { status: 'ready', source: 'woocommerce', categories };
}

const getProductBySlugCached = cache(
  async (slug: string): Promise<CatalogProductResult> => {
    const storeUrl = getPublicWooCommerceStoreUrl();
    if (!storeUrl) {
      const product = sampleProducts.find((item) => item.slug === slug);
      return product
        ? { status: 'found', source: 'sample', product }
        : { status: 'missing', source: 'sample' };
    }

    const credentials = getCredentials();
    if (credentials === 'incomplete') return { status: 'unavailable' };

    const params = new URLSearchParams({ slug });
    if (credentials) {
      params.set('status', 'publish');
      const response = await wooFetch(
        storeUrl,
        `/wp-json/wc/v3/products?${params.toString()}`,
        credentials,
      );
      const json = await readJson(response);
      if (!json || !Array.isArray(json)) return { status: 'unavailable' };
      const currency = await getRestCurrency(
        storeUrl,
        credentials.key,
        credentials.secret,
      );
      const product = mapRestProduct(json[0], currency);
      if (!product) return { status: 'missing', source: 'woocommerce' };
      if (product.type === 'variable') {
        const variations = await loadRestVariations(
          storeUrl,
          credentials,
          product.id,
          currency,
        );
        if (!variations) return { status: 'unavailable' };
        product.variations = variations;
      }
      return { status: 'found', source: 'woocommerce', product };
    }

    const response = await wooFetch(
      storeUrl,
      `/wp-json/wc/store/v1/products?${params.toString()}`,
      null,
    );
    const json = await readJson(response);
    if (!json || !Array.isArray(json)) return { status: 'unavailable' };
    const product = mapStoreProduct(json[0]);
    if (!product) return { status: 'missing', source: 'woocommerce' };
    return { status: 'found', source: 'woocommerce', product };
  },
);

export async function getProductBySlug(
  slug: string,
): Promise<CatalogProductResult> {
  return getProductBySlugCached(slug);
}
