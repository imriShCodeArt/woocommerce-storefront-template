import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { CatalogStatus } from '@/components/shop/CatalogStatus';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { ShopPagination } from '@/components/shop/ShopPagination';
import { ShopToolbar } from '@/components/shop/ShopToolbar';
import { LocalePageView } from '@/components/page/LocalePageView';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import {
  PageHeroSubtitle,
  PageHeroTitle,
} from '@/components/ui/PageHeroTypography';
import { sitemapLastModifiedByPath } from '@/config/sitemap-last-modified';
import { getPathname } from '@/i18n/navigation-base';
import {
  listCategories,
  listProducts,
  parseCatalogPage,
} from '@/lib/woocommerce/catalog';
import { defineLocalePage, type LocaleSearchPageProps } from '@/lib/page';

type ShopPageProps = LocaleSearchPageProps<{
  page?: string;
  q?: string;
}>;

const page = defineLocalePage({
  path: '/shop',
  namespace: 'pages.shop',
  sitemapLastModified: sitemapLastModifiedByPath['/shop'],
});

export async function generateMetadata({
  params,
}: ShopPageProps): Promise<Metadata> {
  return page.generateMetadata({ params });
}

export default async function ShopPage({
  params,
  searchParams,
}: ShopPageProps) {
  const { locale, t, navT } = await page.getContext(params);
  const commerceT = await getTranslations({ locale, namespace: 'commerce' });
  const query = await searchParams;
  const currentPage = parseCatalogPage(query.page);
  const search = query.q?.trim() ?? '';
  const [catalog, categories] = await Promise.all([
    listProducts({ page: currentPage, search }),
    listCategories(),
  ]);

  return (
    <LocalePageView
      jsonLd={page.breadcrumbJsonLd(locale, navT('home'), [
        { name: t('heading'), path: '/shop' },
      ])}
    >
      <PageHero variant="dense">
        <PageHeroTitle heroVariant="dense">{t('heading')}</PageHeroTitle>
        <PageHeroSubtitle>{t('intro')}</PageHeroSubtitle>
      </PageHero>
      <Container layout="wide">
        <CatalogStatus
          source={catalog.status === 'ready' ? catalog.source : undefined}
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
          categories={
            categories.status === 'ready' ? categories.categories : []
          }
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
