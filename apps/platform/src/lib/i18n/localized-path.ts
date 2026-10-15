import { defaultLocale, locales, type Locale } from '@template/i18n';

function isKnownLocale(locale: string): locale is Locale {
  return (locales as readonly string[]).includes(locale);
}

/**
 * Locale-prefixed path for routes whose slugs are the same in every language.
 * Hebrew (the default) stays unprefixed. Other locales use `/{locale}{path}`.
 */
export function localizedPath(
  locale: string,
  path: string,
  query?: Record<string, string | undefined>,
): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const prefixed =
    isKnownLocale(locale) && locale !== defaultLocale
      ? `/${locale}${normalized === '/' ? '' : normalized}`
      : normalized;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value) params.set(key, value);
  }
  const search = params.toString();
  return search ? `${prefixed}?${search}` : prefixed;
}
