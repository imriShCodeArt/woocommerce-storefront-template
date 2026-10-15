import { locales } from '@template/i18n';
import { getLocalizedUrl } from '@template/config';
import { getStaticPageLastModified } from '@/config/sitemap-last-modified';
import { listCategories, listProducts } from '@/lib/woocommerce/catalog';
import { indexableRoutes } from '@/lib/seo/routes';

export type SitemapEntry = {
  url: string;
  lastModified: Date;
  alternates: Record<string, string>;
};

function buildSitemapEntry(path: string, lastModified: Date): SitemapEntry[] {
  const localizedAlternates = Object.fromEntries(
    locales.map((altLocale) => [altLocale, getLocalizedUrl(altLocale, path)]),
  );
  return locales.map((locale) => ({
    url: getLocalizedUrl(locale, path),
    lastModified,
    alternates: {
      ...localizedAlternates,
      'x-default': getLocalizedUrl('he', path),
    },
  }));
}

export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  const staticEntries = indexableRoutes.flatMap((path) =>
    buildSitemapEntry(path, getStaticPageLastModified(path)),
  );
  const catalogUpdated = new Date();
  const [products, categories] = await Promise.all([
    listProducts({ page: 1, perPage: 100 }),
    listCategories(),
  ]);
  const categoryEntries =
    categories.status === 'ready'
      ? categories.categories.flatMap((category) =>
          buildSitemapEntry(`/category/${category.slug}`, catalogUpdated),
        )
      : [];
  const productEntries =
    products.status === 'ready'
      ? products.products.flatMap((product) =>
          buildSitemapEntry(`/product/${product.slug}`, catalogUpdated),
        )
      : [];

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
