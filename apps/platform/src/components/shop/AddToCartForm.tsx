'use client';

import { useMemo, useState } from 'react';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useLocale, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/Button';
import { wooAddToCartUrl } from '@/lib/woocommerce/hosted-urls';
import { formatCatalogPrice } from '@/lib/woocommerce/money';
import { getPublicWooCommerceStoreUrl } from '@/lib/woocommerce/public-config';
import type { CatalogProduct, CatalogVariation } from '@/lib/woocommerce/types';

type AddToCartFormProps = {
  product: CatalogProduct;
};

function attributeNames(variations: CatalogVariation[]): string[] {
  const names: string[] = [];
  for (const variation of variations) {
    for (const attribute of variation.attributes) {
      if (!names.includes(attribute.name)) names.push(attribute.name);
    }
  }
  return names;
}

function initialSelection(product: CatalogProduct): Record<string, string> {
  if (product.variations.length !== 1) return {};
  return Object.fromEntries(
    product.variations[0]?.attributes.map((attribute) => [
      attribute.name,
      attribute.value,
    ]) ?? [],
  );
}

export function AddToCartForm({ product }: AddToCartFormProps) {
  const t = useTranslations('commerce');
  const locale = useLocale();
  const storeUrl = getPublicWooCommerceStoreUrl();
  const names = useMemo(
    () => attributeNames(product.variations),
    [product.variations],
  );
  const [selection, setSelection] = useState(() => initialSelection(product));
  const [quantity, setQuantity] = useState(1);

  const exactVariation = product.variations.find((variation) =>
    names.every((name) =>
      variation.attributes.some(
        (attribute) =>
          attribute.name === name && attribute.value === selection[name],
      ),
    ),
  );

  const priceAmount = exactVariation?.priceAmount ?? product.priceAmount;
  const regularAmount =
    exactVariation?.regularPriceAmount ?? product.regularPriceAmount;
  const currency = exactVariation?.currency ?? product.currency;
  const price = formatCatalogPrice(priceAmount, currency, locale);
  const regularPrice = formatCatalogPrice(regularAmount, currency, locale);
  const showFromPrice = product.type === 'variable' && !exactVariation && price;

  const hostedProductUrl = product.externalUrl || product.permalink;
  const needsHostedProductPage =
    product.type === 'external' ||
    product.type === 'grouped' ||
    product.type === 'unknown' ||
    (product.type === 'variable' && product.variations.length === 0);

  const canAddSelection = product.type !== 'variable' || exactVariation != null;
  const canPurchase = exactVariation
    ? exactVariation.purchasable && exactVariation.inStock
    : product.purchasable && product.inStock;
  const addToCartHref =
    storeUrl && canPurchase && canAddSelection && !needsHostedProductPage
      ? wooAddToCartUrl(storeUrl, exactVariation?.id ?? product.id, quantity)
      : '';

  return (
    <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
      {price ? (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
          <Typography variant="h5" component="p">
            {showFromPrice ? t('fromPrice', { price }) : price}
          </Typography>
          {regularPrice ? (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ textDecoration: 'line-through' }}
            >
              {regularPrice}
            </Typography>
          ) : null}
        </Stack>
      ) : null}

      {product.type === 'variable' && product.variations.length > 0
        ? names.map((name) => {
            const values = [
              ...new Set(
                product.variations
                  .filter((variation) =>
                    names.every((other) => {
                      if (other === name || !selection[other]) return true;
                      return variation.attributes.some(
                        (attribute) =>
                          attribute.name === other &&
                          attribute.value === selection[other],
                      );
                    }),
                  )
                  .flatMap((variation) =>
                    variation.attributes
                      .filter((attribute) => attribute.name === name)
                      .map((attribute) => attribute.value),
                  ),
              ),
            ];

            return (
              <TextField
                key={name}
                select
                label={name}
                value={selection[name] ?? ''}
                onChange={(event) =>
                  setSelection((current) => ({
                    ...current,
                    [name]: event.target.value,
                  }))
                }
                sx={{ minWidth: 220 }}
              >
                <MenuItem value="">{t('selectOption')}</MenuItem>
                {values.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </TextField>
            );
          })
        : null}

      {!needsHostedProductPage && product.inStock ? (
        <TextField
          label={t('quantity')}
          type="number"
          value={quantity}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (!Number.isFinite(next)) return;
            setQuantity(Math.min(99, Math.max(1, Math.trunc(next))));
          }}
          slotProps={{ htmlInput: { min: 1, max: 99 } }}
          sx={{ width: 120 }}
        />
      ) : null}

      {needsHostedProductPage && storeUrl && hostedProductUrl ? (
        <Button href={hostedProductUrl} external target="_self">
          {product.type === 'external' ? t('viewOnStore') : t('chooseOptions')}
        </Button>
      ) : null}

      {!needsHostedProductPage && addToCartHref ? (
        <Button href={addToCartHref} external target="_self">
          {t('addToCart')}
        </Button>
      ) : null}

      {!needsHostedProductPage && !addToCartHref ? (
        <Button disabled>
          {!product.inStock || (exactVariation && !exactVariation.inStock)
            ? t('outOfStock')
            : t('addToCart')}
        </Button>
      ) : null}

      <Typography variant="body2" color="text.secondary">
        {t('hostedCheckoutNote')}
      </Typography>
    </Stack>
  );
}
