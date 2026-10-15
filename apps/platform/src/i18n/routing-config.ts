import { defaultLocale, locales } from '@template/i18n';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales,
  defaultLocale,

  // Hebrew (default): no prefix — `/`, `/about`, …
  // Other locales: `/en`, `/en/about`, …
  localePrefix: 'as-needed',

  // Cookie / Accept-Language when visiting unprefixed URLs.
  localeDetection: false,

  pathnames: {
    '/': '/',
    '/about': {
      he: '/about',
      en: '/about',
    },
    '/contact': {
      he: '/contact',
      en: '/contact',
    },
    '/shop': {
      he: '/shop',
      en: '/shop',
    },
    '/product/[slug]': {
      he: '/product/[slug]',
      en: '/product/[slug]',
    },
    '/category/[slug]': {
      he: '/category/[slug]',
      en: '/category/[slug]',
    },
    '/privacy': {
      he: '/privacy',
      en: '/privacy',
    },
    '/cookies': {
      he: '/cookies',
      en: '/cookies',
    },
    '/terms': {
      he: '/terms',
      en: '/terms',
    },
    '/accessibility': {
      he: '/accessibility',
      en: '/accessibility',
    },
  },
});
