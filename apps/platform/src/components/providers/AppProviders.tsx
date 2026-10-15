'use client';

import type { ReactNode } from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import Box from '@mui/material/Box';
import rtlPlugin from '@mui/stylis-plugin-rtl';
import { prefixer } from 'stylis';
import { NextIntlClientProvider } from 'next-intl';

import { siteConfig } from '@template/config';
import type { Locale } from '@template/i18n';
import { getLocaleDirection } from '@template/i18n';
import { DocumentDirection, ThemeProvider } from '@template/ui';

import { CookieConsentProvider } from '@/components/cookies/CookieConsentContext';

type AppProvidersProps = {
  children: ReactNode;
  locale: Locale;
  messages: Record<string, unknown>;
  initialColorMode?: 'light' | 'dark';
};

export function AppProviders({
  children,
  locale,
  messages,
  initialColorMode,
}: AppProvidersProps) {
  const direction = getLocaleDirection(locale);

  const rtlCacheOptions = {
    key: 'muirtl',
    stylisPlugins: [prefixer, rtlPlugin],
  };

  const ltrCacheOptions = {
    key: 'mui',
    stylisPlugins: [prefixer],
  };

  return (
    <AppRouterCacheProvider
      options={direction === 'rtl' ? rtlCacheOptions : ltrCacheOptions}
    >
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        timeZone={siteConfig.timeZone}
      >
        <ThemeProvider
          direction={direction}
          initialColorMode={initialColorMode}
        >
          <CookieConsentProvider>
            <DocumentDirection locale={locale} />
            <Box dir={direction}>{children}</Box>
          </CookieConsentProvider>
        </ThemeProvider>
      </NextIntlClientProvider>
    </AppRouterCacheProvider>
  );
}
