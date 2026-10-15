'use client';

import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/Button';
import { wooAccountUrl, wooCartUrl } from '@/lib/woocommerce/hosted-urls';
import { getPublicWooCommerceStoreUrl } from '@/lib/woocommerce/public-config';

type HostedCommerceLinksProps = {
  layout?: 'icons' | 'menu';
  onNavigate?: () => void;
};

export function HostedCommerceLinks({
  layout = 'icons',
  onNavigate,
}: HostedCommerceLinksProps) {
  const t = useTranslations('navigation');
  const storeUrl = getPublicWooCommerceStoreUrl();
  if (!storeUrl) return null;

  const cartHref = wooCartUrl(storeUrl);
  const accountHref = wooAccountUrl(storeUrl);

  if (layout === 'menu') {
    return (
      <Stack spacing={1}>
        <Button
          href={cartHref}
          external
          target="_self"
          variant="outlined"
          color="inherit"
          fullWidth
          onClick={onNavigate}
        >
          {t('cart')}
        </Button>
        <Button
          href={accountHref}
          external
          target="_self"
          variant="text"
          color="inherit"
          fullWidth
          onClick={onNavigate}
        >
          {t('account')}
        </Button>
      </Stack>
    );
  }

  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
      <IconButton
        component="a"
        href={accountHref}
        color="inherit"
        aria-label={t('account')}
      >
        <PersonOutlinedIcon />
      </IconButton>
      <IconButton
        component="a"
        href={cartHref}
        color="inherit"
        aria-label={t('cart')}
      >
        <ShoppingCartOutlinedIcon />
      </IconButton>
    </Stack>
  );
}
