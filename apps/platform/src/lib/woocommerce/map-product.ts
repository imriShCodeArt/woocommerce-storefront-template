import { z } from 'zod';

import { parseDecimalAmount, parseMinorAmount } from './money';
import { htmlToText, sanitizeProductHtml } from './sanitize-html';
import type {
  CatalogCategory,
  CatalogProduct,
  CatalogVariation,
} from './types';

const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  count: z.number().optional(),
});

const imageSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
});

const restAttributeSchema = z.object({
  name: z.string(),
  option: z.string().optional(),
});

const restVariationSchema = z.object({
  id: z.number(),
  price: z.string().optional(),
  regular_price: z.string().optional(),
  on_sale: z.boolean().optional(),
  purchasable: z.boolean().optional(),
  stock_status: z.string().optional(),
  attributes: z.array(restAttributeSchema).optional(),
});

const restProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  permalink: z.string().optional(),
  type: z.string().optional(),
  sku: z.string().optional(),
  price: z.string().optional(),
  regular_price: z.string().optional(),
  on_sale: z.boolean().optional(),
  purchasable: z.boolean().optional(),
  stock_status: z.string().optional(),
  short_description: z.string().optional(),
  description: z.string().optional(),
  external_url: z.string().optional(),
  images: z.array(imageSchema).optional(),
  categories: z.array(categorySchema).optional(),
});

const storePriceSchema = z.object({
  price: z.string().optional(),
  regular_price: z.string().optional(),
  currency_code: z.string().optional(),
  currency_minor_unit: z.number().optional(),
});

const storeAttributeSchema = z.object({
  name: z.string(),
  value: z.string().optional(),
});

const storeVariationSchema = z.object({
  id: z.number(),
  attributes: z.array(storeAttributeSchema).optional(),
  price: z.string().optional(),
  regular_price: z.string().optional(),
  prices: storePriceSchema.optional(),
  is_in_stock: z.boolean().optional(),
  is_purchasable: z.boolean().optional(),
});

const storeProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  permalink: z.string().optional(),
  type: z.string().optional(),
  sku: z.string().optional(),
  short_description: z.string().optional(),
  description: z.string().optional(),
  on_sale: z.boolean().optional(),
  is_in_stock: z.boolean().optional(),
  is_purchasable: z.boolean().optional(),
  prices: storePriceSchema.optional(),
  images: z.array(imageSchema).optional(),
  categories: z.array(categorySchema).optional(),
  variations: z.array(storeVariationSchema).optional(),
  external_url: z.string().optional(),
});

function normalizeType(type: string | undefined): CatalogProduct['type'] {
  if (
    type === 'simple' ||
    type === 'variable' ||
    type === 'grouped' ||
    type === 'external'
  ) {
    return type;
  }
  return 'unknown';
}

function mapCategories(
  categories: z.infer<typeof categorySchema>[] | undefined,
): CatalogProduct['categories'] {
  return (categories ?? []).map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
  }));
}

function mapImages(
  images: z.infer<typeof imageSchema>[] | undefined,
): CatalogProduct['images'] {
  return (images ?? [])
    .filter((image) => image.src.trim().length > 0)
    .map((image) => ({
      src: image.src,
      alt: image.alt?.trim() ?? '',
    }));
}

function salePrices(
  onSale: boolean,
  priceAmount: number | null,
  regularAmount: number | null,
): { priceAmount: number | null; regularPriceAmount: number | null } {
  if (!onSale || regularAmount == null || priceAmount == null) {
    return { priceAmount, regularPriceAmount: null };
  }
  if (regularAmount <= priceAmount) {
    return { priceAmount, regularPriceAmount: null };
  }
  return { priceAmount, regularPriceAmount: regularAmount };
}

export function mapRestVariation(
  input: unknown,
  currency: string,
): CatalogVariation | null {
  const parsed = restVariationSchema.safeParse(input);
  if (!parsed.success) return null;
  const variation = parsed.data;
  const priceAmount = parseDecimalAmount(variation.price ?? '');
  const regularAmount = parseDecimalAmount(variation.regular_price ?? '');
  const prices = salePrices(
    variation.on_sale ?? false,
    priceAmount,
    regularAmount,
  );
  return {
    id: variation.id,
    attributes: (variation.attributes ?? [])
      .filter((attribute) => attribute.option)
      .map((attribute) => ({
        name: attribute.name,
        value: attribute.option ?? '',
      })),
    priceAmount: prices.priceAmount,
    regularPriceAmount: prices.regularPriceAmount,
    currency,
    inStock: variation.stock_status !== 'outofstock',
    purchasable: variation.purchasable ?? false,
  };
}

export function mapRestProduct(
  input: unknown,
  currency: string,
  variations: CatalogVariation[] = [],
): CatalogProduct | null {
  const parsed = restProductSchema.safeParse(input);
  if (!parsed.success) return null;
  const product = parsed.data;
  const priceAmount = parseDecimalAmount(product.price ?? '');
  const regularAmount = parseDecimalAmount(product.regular_price ?? '');
  const prices = salePrices(
    product.on_sale ?? false,
    priceAmount,
    regularAmount,
  );
  const descriptionHtml = sanitizeProductHtml(product.description ?? '');

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    sku: product.sku ?? '',
    type: normalizeType(product.type),
    permalink: product.permalink ?? '',
    externalUrl: product.external_url ?? '',
    shortDescription: htmlToText(product.short_description ?? ''),
    descriptionHtml,
    priceAmount: prices.priceAmount,
    regularPriceAmount: prices.regularPriceAmount,
    currency,
    onSale: prices.regularPriceAmount != null,
    purchasable: product.purchasable ?? false,
    inStock: product.stock_status !== 'outofstock',
    images: mapImages(product.images),
    categories: mapCategories(product.categories),
    variations,
  };
}

export function mapStoreProduct(input: unknown): CatalogProduct | null {
  const parsed = storeProductSchema.safeParse(input);
  if (!parsed.success) return null;
  const product = parsed.data;
  const prices = product.prices;
  const currency = prices?.currency_code?.trim() || 'USD';
  const minorUnit = prices?.currency_minor_unit ?? 2;
  const priceAmount = parseMinorAmount(prices?.price ?? '', minorUnit);
  const regularAmount = parseMinorAmount(
    prices?.regular_price ?? '',
    minorUnit,
  );
  const sale = salePrices(product.on_sale ?? false, priceAmount, regularAmount);

  const variations = (product.variations ?? []).map((variation) => {
    const variationPrices = variation.prices;
    const variationCurrency =
      variationPrices?.currency_code?.trim() || currency;
    const variationMinor = variationPrices?.currency_minor_unit ?? minorUnit;
    const variationPrice = variationPrices
      ? parseMinorAmount(variationPrices.price ?? '', variationMinor)
      : parseDecimalAmount(variation.price ?? '');
    const variationRegular = variationPrices
      ? parseMinorAmount(variationPrices.regular_price ?? '', variationMinor)
      : parseDecimalAmount(variation.regular_price ?? '');
    return {
      id: variation.id,
      attributes: (variation.attributes ?? [])
        .filter((attribute) => attribute.value)
        .map((attribute) => ({
          name: attribute.name,
          value: attribute.value ?? '',
        })),
      priceAmount: variationPrice,
      regularPriceAmount:
        variationRegular != null &&
        variationPrice != null &&
        variationRegular > variationPrice
          ? variationRegular
          : null,
      currency: variationCurrency,
      inStock: variation.is_in_stock ?? true,
      purchasable: variation.is_purchasable ?? true,
    } satisfies CatalogVariation;
  });

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    sku: product.sku ?? '',
    type: normalizeType(product.type),
    permalink: product.permalink ?? '',
    externalUrl: product.external_url ?? '',
    shortDescription: htmlToText(product.short_description ?? ''),
    descriptionHtml: sanitizeProductHtml(product.description ?? ''),
    priceAmount: sale.priceAmount,
    regularPriceAmount: sale.regularPriceAmount,
    currency,
    onSale: sale.regularPriceAmount != null,
    purchasable: product.is_purchasable ?? false,
    inStock: product.is_in_stock ?? false,
    images: mapImages(product.images),
    categories: mapCategories(product.categories),
    variations,
  };
}

export function mapCategoriesResponse(
  input: unknown,
): CatalogCategory[] | null {
  const parsed = z.array(categorySchema).safeParse(input);
  if (!parsed.success) return null;
  return parsed.data.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    count: category.count ?? 0,
  }));
}

export function mapRestCurrency(input: unknown): string | null {
  const parsed = z.object({ value: z.string() }).safeParse(input);
  if (!parsed.success) return null;
  const currency = parsed.data.value.trim();
  return currency || null;
}
