'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

import { localizedPath } from '@/lib/i18n/localized-path';
import { formatCatalogPrice } from '@/lib/woocommerce/money';
import type { CatalogProduct } from '@/lib/woocommerce/types';

type ProductCardProps = {
  product: CatalogProduct;
};

export function ProductCard({ product }: ProductCardProps) {
  const t = useTranslations('commerce');
  const locale = useLocale();
  const href = localizedPath(locale, `/product/${product.slug}`);
  const image = product.images[0];
  const price = formatCatalogPrice(
    product.priceAmount,
    product.currency,
    locale,
  );
  const regularPrice = formatCatalogPrice(
    product.regularPriceAmount,
    product.currency,
    locale,
  );
  const priceLabel =
    product.type === 'variable' && price ? t('fromPrice', { price }) : price;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <NextLink
        href={href}
        style={{
          color: 'inherit',
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
        }}
      >
        <Box
          sx={{
            aspectRatio: '1',
            bgcolor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {image ? (
            <Box
              component="img"
              src={image.src}
              alt={image.alt || product.name}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Typography variant="h4" component="span" color="text.secondary">
              {product.name.slice(0, 1)}
            </Typography>
          )}
        </Box>
        <CardContent sx={{ flexGrow: 1 }}>
          <Stack spacing={1}>
            <Typography variant="h6" component="h2">
              {product.name}
            </Typography>
            {product.shortDescription ? (
              <Typography variant="body2" color="text.secondary">
                {product.shortDescription}
              </Typography>
            ) : null}
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'baseline', flexWrap: 'wrap' }}
            >
              {priceLabel ? (
                <Typography variant="subtitle1">{priceLabel}</Typography>
              ) : null}
              {regularPrice ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textDecoration: 'line-through' }}
                >
                  {regularPrice}
                </Typography>
              ) : null}
              {product.onSale ? (
                <Chip size="small" label={t('sale')} color="secondary" />
              ) : null}
              {!product.inStock ? (
                <Chip size="small" label={t('outOfStock')} />
              ) : null}
            </Stack>
          </Stack>
        </CardContent>
      </NextLink>
    </Card>
  );
}
