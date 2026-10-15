import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { ProductCard } from '@/components/shop/ProductCard';
import type { CatalogProduct } from '@/lib/woocommerce/types';

type ProductGridProps = {
  products: CatalogProduct[];
  emptyLabel: string;
};

export function ProductGrid({ products, emptyLabel }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 4 }}>
        {emptyLabel}
      </Typography>
    );
  }

  return (
    <Grid container spacing={2}>
      {products.map((product) => (
        <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4 }}>
          <ProductCard product={product} />
        </Grid>
      ))}
    </Grid>
  );
}
