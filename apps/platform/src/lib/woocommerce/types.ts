export type CatalogSource = 'sample' | 'woocommerce';

export type CatalogCategory = {
  id: number;
  slug: string;
  name: string;
  count: number;
};

export type CatalogImage = {
  src: string;
  alt: string;
};

export type CatalogVariation = {
  id: number;
  attributes: { name: string; value: string }[];
  priceAmount: number | null;
  regularPriceAmount: number | null;
  currency: string;
  inStock: boolean;
  purchasable: boolean;
};

export type CatalogProduct = {
  id: number;
  slug: string;
  name: string;
  sku: string;
  type: 'simple' | 'variable' | 'grouped' | 'external' | 'unknown';
  permalink: string;
  externalUrl: string;
  shortDescription: string;
  descriptionHtml: string;
  priceAmount: number | null;
  regularPriceAmount: number | null;
  currency: string;
  onSale: boolean;
  purchasable: boolean;
  inStock: boolean;
  images: CatalogImage[];
  categories: { id: number; slug: string; name: string }[];
  variations: CatalogVariation[];
};

export type CatalogListResult =
  | {
      status: 'ready';
      source: CatalogSource;
      products: CatalogProduct[];
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    }
  | { status: 'unavailable' };

export type CatalogCategoriesResult =
  | { status: 'ready'; source: CatalogSource; categories: CatalogCategory[] }
  | { status: 'unavailable' };

export type CatalogProductResult =
  | { status: 'found'; source: CatalogSource; product: CatalogProduct }
  | { status: 'missing'; source: CatalogSource }
  | { status: 'unavailable' };
