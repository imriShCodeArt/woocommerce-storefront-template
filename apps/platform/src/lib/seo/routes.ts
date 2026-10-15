/** Public marketing and legal routes that should be indexed. */
export const indexableRoutes = [
  '/',
  '/shop',
  '/about',
  '/contact',
  '/privacy',
  '/cookies',
  '/terms',
  '/accessibility',
] as const;

export type IndexableRoute = (typeof indexableRoutes)[number];

/** Routes that must not appear in search results. */
export const nonIndexableRoutePatterns = [] as const;
