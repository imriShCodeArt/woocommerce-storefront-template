import type { Metadata } from 'next';
import Typography from '@mui/material/Typography';
import { getTranslations } from 'next-intl/server';

import { CatalogStatus } from '@/components/shop/CatalogStatus';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { LocalePageView } from '@/components/page/LocalePageView';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import {
  PageHeroSubtitle,
  PageHeroTitle,
} from '@/components/ui/PageHeroTypography';
import { Button } from '@/components/ui/Button';
import { createLocalePageMetadata, type LocalePageProps } from '@/lib/page';
import { buildSiteGraphJsonLd } from '@/lib/seo/json-ld';
import { resolvePageLocale } from '@/lib/seo/resolve-locale';
import { listProducts } from '@/lib/woocommerce/catalog';

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const locale = resolvePageLocale((await params).locale);
  const siteT = await getTranslations({ locale, namespace: 'site' });
  const keywords = siteT('keywords')
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  return createLocalePageMetadata({
    params,
    path: '/',
    namespace: 'pages.home',
    keywords,
  });
}

export default async function Home({ params }: LocalePageProps) {
  const locale = resolvePageLocale((await params).locale);
  const [pageT, navT, commerceT, catalog] = await Promise.all([
    getTranslations({ locale, namespace: 'pages.home' }),
    getTranslations({ locale, namespace: 'navigation' }),
    getTranslations({ locale, namespace: 'commerce' }),
    listProducts({ page: 1, perPage: 4 }),
  ]);

  return (
    <LocalePageView
      jsonLd={buildSiteGraphJsonLd({
        locale,
        path: '/',
        name: pageT('metaTitle'),
        description: pageT('metaDescription'),
      })}
    >
      <PageHero variant="high">
        <PageHeroTitle heroVariant="high">{pageT('heading')}</PageHeroTitle>
        <PageHeroSubtitle>{pageT('intro')}</PageHeroSubtitle>
        <Button href="/shop">{navT('shop')}</Button>
      </PageHero>
      <Container layout="wide">
        <CatalogStatus
          source={catalog.status === 'ready' ? catalog.source : undefined}
          unavailable={catalog.status === 'unavailable'}
          sampleMessage={commerceT('sampleNotice')}
          unavailableMessage={commerceT('unavailable')}
        />
        {catalog.status === 'ready' ? (
          <>
            <Typography variant="h4" component="h2" sx={{ mb: 2 }}>
              {pageT('featured')}
            </Typography>
            <ProductGrid
              products={catalog.products}
              emptyLabel={commerceT('empty')}
            />
          </>
        ) : null}
      </Container>
    </LocalePageView>
  );
}
