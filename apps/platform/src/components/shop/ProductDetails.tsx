import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { AddToCartForm } from '@/components/shop/AddToCartForm';
import type { CatalogProduct } from '@/lib/woocommerce/types';

type ProductDetailsProps = {
  product: CatalogProduct;
  skuLabel: string;
};

export function ProductDetails({ product, skuLabel }: ProductDetailsProps) {
  const image = product.images[0];

  return (
    <Grid container spacing={{ xs: 3, md: 6 }}>
      <Grid size={{ xs: 12, md: 6 }}>
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
            <Typography variant="h3" component="span" color="text.secondary">
              {product.name.slice(0, 1)}
            </Typography>
          )}
        </Box>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Stack spacing={2}>
          <Typography variant="h3" component="h1">
            {product.name}
          </Typography>
          {product.sku ? (
            <Typography variant="body2" color="text.secondary">
              {skuLabel}: {product.sku}
            </Typography>
          ) : null}
          {product.shortDescription ? (
            <Typography variant="body1">{product.shortDescription}</Typography>
          ) : null}
          <AddToCartForm product={product} />
        </Stack>
      </Grid>
      {product.descriptionHtml ? (
        <Grid size={12}>
          <Box
            sx={{
              '& p': { mt: 0, mb: 2 },
              '& ul, & ol': { pl: 3 },
            }}
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          />
        </Grid>
      ) : null}
    </Grid>
  );
}
