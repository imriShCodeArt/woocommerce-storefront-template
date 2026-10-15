import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Button } from '@/components/ui/Button';
import { localizedPath } from '@/lib/i18n/localized-path';
import type { Locale } from '@template/i18n';

type ShopPaginationProps = {
  locale: Locale;
  page: number;
  totalPages: number;
  search: string;
  categorySlug?: string;
  previousLabel: string;
  nextLabel: string;
  statusLabel: string;
};

function pageHref(
  locale: Locale,
  page: number,
  search: string,
  categorySlug?: string,
): string {
  const path = categorySlug ? `/category/${categorySlug}` : '/shop';
  return localizedPath(locale, path, {
    page: page > 1 ? String(page) : undefined,
    q: search || undefined,
  });
}

export function ShopPagination({
  locale,
  page,
  totalPages,
  search,
  categorySlug,
  previousLabel,
  nextLabel,
  statusLabel,
}: ShopPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{ alignItems: 'center', justifyContent: 'center', mt: 4 }}
    >
      {page > 1 ? (
        <Button
          href={pageHref(locale, page - 1, search, categorySlug)}
          native
          variant="outlined"
        >
          {previousLabel}
        </Button>
      ) : null}
      <Typography>{statusLabel}</Typography>
      {page < totalPages ? (
        <Button
          href={pageHref(locale, page + 1, search, categorySlug)}
          native
          variant="outlined"
        >
          {nextLabel}
        </Button>
      ) : null}
    </Stack>
  );
}
