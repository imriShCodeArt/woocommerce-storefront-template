import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

import type { Locale } from '@template/i18n';

import { Button } from '@/components/ui/Button';
import { localizedPath } from '@/lib/i18n/localized-path';
import type { CatalogCategory } from '@/lib/woocommerce/types';

type ShopToolbarProps = {
  locale: Locale;
  action: string;
  search: string;
  searchLabel: string;
  searchSubmit: string;
  categoriesLabel: string;
  allProductsLabel: string;
  categories: CatalogCategory[];
  activeSlug?: string;
};

export function ShopToolbar({
  locale,
  action,
  search,
  searchLabel,
  searchSubmit,
  categoriesLabel,
  allProductsLabel,
  categories,
  activeSlug,
}: ShopToolbarProps) {
  return (
    <Stack spacing={2} sx={{ mb: 3 }}>
      <Stack
        component="form"
        action={action}
        method="get"
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{ alignItems: { sm: 'center' } }}
      >
        <TextField
          name="q"
          defaultValue={search}
          label={searchLabel}
          size="small"
          fullWidth
        />
        <Button type="submit" sx={{ flexShrink: 0 }}>
          {searchSubmit}
        </Button>
      </Stack>

      {categories.length > 0 ? (
        <Stack
          component="nav"
          aria-label={categoriesLabel}
          direction="row"
          spacing={1}
          sx={{ flexWrap: 'wrap', rowGap: 1 }}
        >
          <Button
            href="/shop"
            variant={activeSlug ? 'text' : 'contained'}
            size="small"
          >
            {allProductsLabel}
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              href={localizedPath(locale, `/category/${category.slug}`)}
              native
              variant={activeSlug === category.slug ? 'contained' : 'text'}
              size="small"
            >
              {category.name}
            </Button>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}
