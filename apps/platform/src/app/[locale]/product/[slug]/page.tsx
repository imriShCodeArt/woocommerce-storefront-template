import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { CatalogStatus } from '@/components/shop/CatalogStatus';
import { ProductDetails } from '@/components/shop/ProductDetails';
import { LocalePageView } from '@/components/page/LocalePageView';
import { Container } from '@/components/ui/Container';
import { getLocalizedUrl } from '@template/config';
import { getProductBySlug } from '@/lib/woocommerce/catalog';
import { buildHomeBreadcrumbJsonLd } from '@/lib/page';
import { createPageMetadata } from '@/lib/seo/metadata';
import { resolvePageLocale } from '@/lib/seo/resolve-locale';
import type { LocaleDynamicPageProps } from '@/lib/page';

type ProductPageProps = LocaleDynamicPageProps<'slug'>;

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = resolvePageLocale(rawLocale);
  const result = await getProductBySlug(slug);
  const t = await getTranslations({ locale, namespace: 'pages.product' });
  const name = result.status === 'found' ? result.product.name : t('metaTitle');
  const description =
    result.status === 'found' && result.product.shortDescription
      ? result.product.shortDescription
      : t('metaDescription');

  return createPageMetadata({
    locale,
    path: `/product/${slug}`,
    title: name,
    description,
  });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale: rawLocale, slug } = await params;
  const locale = resolvePageLocale(rawLocale);
  const [navT, shopT, commerceT, result] = await Promise.all([
    getTranslations({ locale, namespace: 'navigation' }),
    getTranslations({ locale, namespace: 'pages.shop' }),
    getTranslations({ locale, namespace: 'commerce' }),
    getProductBySlug(slug),
  ]);

  if (result.status === 'missing') notFound();

  if (result.status === 'unavailable') {
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

  const { product } = result;
  const productUrl = getLocalizedUrl(locale, `/product/${product.slug}`);

  return (
    <LocalePageView
      jsonLd={[
        buildHomeBreadcrumbJsonLd(locale, navT('home'), [
          { name: shopT('heading'), path: '/shop' },
          { name: product.name, path: `/product/${product.slug}` },
        ]),
        {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: product.shortDescription || undefined,
          sku: product.sku || undefined,
          image: product.images.length
            ? product.images.map((image) => image.src)
            : undefined,
          offers:
            product.priceAmount == null
              ? undefined
              : {
                  '@type': 'Offer',
                  url: productUrl,
                  priceCurrency: product.currency,
                  price: product.priceAmount.toFixed(2),
                  availability: product.inStock
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
                },
        },
      ]}
    >
      <Container layout="wide">
        {result.source === 'sample' ? (
          <CatalogStatus
            source="sample"
            sampleMessage={commerceT('sampleNotice')}
            unavailableMessage={commerceT('unavailable')}
          />
        ) : null}
        <ProductDetails product={product} skuLabel={commerceT('sku')} />
      </Container>
    </LocalePageView>
  );
}
