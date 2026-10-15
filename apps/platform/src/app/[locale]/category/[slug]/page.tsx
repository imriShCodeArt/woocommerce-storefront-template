import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { CatalogStatus } from '@/components/shop/CatalogStatus';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { ShopPagination } from '@/components/shop/ShopPagination';
import { ShopToolbar } from '@/components/shop/ShopToolbar';
import { LocalePageView } from '@/components/page/LocalePageView';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { PageHeroTitle } from '@/components/ui/PageHeroTypography';
import { getPathname } from '@/i18n/navigation-base';
import {
  listCategories,
  listProducts,
  parseCatalogPage,
} from '@/lib/woocommerce/catalog';
import {
  buildHomeBreadcrumbJsonLd,
  type LocaleDynamicPageProps,
} from '@/lib/page';
import { createPageMetadata } from '@/lib/seo/metadata';
import { resolvePageLocale } from '@/lib/seo/resolve-locale';

type CategoryPageProps = LocaleDynamicPageProps<'slug'> & {
  searchParams: Promise<{ page?: string; q?: string }>;
};

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = resolvePageLocale(rawLocale);
  const t = await getTranslations({ locale, namespace: 'pages.category' });
  const categories = await listCategories();
  const category =
    categories.status === 'ready'
      ? categories.categories.find((item) => item.slug === slug)
      : undefined;

  return createPageMetadata({
    locale,
    path: `/category/${slug}`,
    title: category?.name ?? t('metaTitle'),
    description: t('metaDescription'),
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { locale: rawLocale, slug } = await params;
  const locale = resolvePageLocale(rawLocale);
  const [navT, commerceT, pageT] = await Promise.all([
    getTranslations({ locale, namespace: 'navigation' }),
    getTranslations({ locale, namespace: 'commerce' }),
    getTranslations({ locale, namespace: 'pages.shop' }),
  ]);
  const categories = await listCategories();
  if (categories.status === 'unavailable') {
    return (
      <Container layout="wide">
        <CatalogStatus
          unavailable
          sampleMessage={commerceT('sampleNotice')}
          unavailableMessage={commerceT('unavailable')}
        />
      </Container>
    );
  }

  const category = categories.categories.find((item) => item.slug === slug);
  if (!category) notFound();

  const query = await searchParams;
  const currentPage = parseCatalogPage(query.page);
  const search = query.q?.trim() ?? '';
  const catalog = await listProducts({
    page: currentPage,
    search,
    categorySlug: slug,
  });

  return (
    <LocalePageView
      jsonLd={buildHomeBreadcrumbJsonLd(locale, navT('home'), [
        { name: pageT('heading'), path: '/shop' },
        { name: category.name, path: `/category/${slug}` },
      ])}
    >
      <PageHero variant="dense">
        <PageHeroTitle heroVariant="dense">{category.name}</PageHeroTitle>
      </PageHero>
      <Container layout="wide">
        <CatalogStatus
          source={
            catalog.status === 'ready' ? catalog.source : categories.source
          }
          unavailable={catalog.status === 'unavailable'}
          sampleMessage={commerceT('sampleNotice')}
          unavailableMessage={commerceT('unavailable')}
        />
        <ShopToolbar
          locale={locale}
          action={getPathname({ locale, href: '/shop' })}
          search={search}
          searchLabel={commerceT('searchLabel')}
          searchSubmit={commerceT('searchSubmit')}
          categoriesLabel={commerceT('categories')}
          allProductsLabel={commerceT('allProducts')}
          categories={categories.categories}
          activeSlug={slug}
        />
        {catalog.status === 'ready' ? (
          <>
            <ProductGrid
              products={catalog.products}
              emptyLabel={commerceT('empty')}
            />
            <ShopPagination
              locale={locale}
              page={catalog.page}
              totalPages={catalog.totalPages}
              search={search}
              categorySlug={slug}
              previousLabel={commerceT('previous')}
              nextLabel={commerceT('next')}
              statusLabel={commerceT('pageStatus', {
                page: catalog.page,
                totalPages: catalog.totalPages,
              })}
            />
          </>
        ) : null}
      </Container>
    </LocalePageView>
  );
}
