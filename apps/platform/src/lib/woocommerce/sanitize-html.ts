const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'strong',
  'em',
  'b',
  'i',
  'ul',
  'ol',
  'li',
  'a',
  'h2',
  'h3',
  'h4',
  'blockquote',
  'span',
]);

function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function decodeBasicEntities(value: string): string {
  return value
    .replaceAll(/&#(\d+);/g, (_, code: string) => {
      const point = Number(code);
      return Number.isFinite(point) ? String.fromCodePoint(point) : '';
    })
    .replaceAll(/&#x([0-9a-f]+);/gi, (_, code: string) => {
      const point = Number.parseInt(code, 16);
      return Number.isFinite(point) ? String.fromCodePoint(point) : '';
    })
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#039;', "'")
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

/** Plain text for cards and metadata. Product HTML from WooCommerce is not trusted as-is. */
export function htmlToText(html: string): string {
  const withoutTags = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  return decodeBasicEntities(withoutTags).replace(/\s+/g, ' ').trim();
}

/**
 * Keeps a small set of formatting tags from store-authored product HTML
 * and drops scripts, event handlers, and non-http(s) links.
 */
export function sanitizeProductHtml(html: string): string {
  const withoutDangerousBlocks = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  return withoutDangerousBlocks.replace(
    /<\/?([a-z0-9]+)([^>]*)>/gi,
    (match, rawTag: string, rawAttrs: string) => {
      const tag = rawTag.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return '';
      if (tag === 'br') return '<br />';
      if (match.startsWith('</')) return `</${tag}>`;
      if (tag !== 'a') return `<${tag}>`;

      const hrefMatch = /href\s*=\s*(['"])(https?:\/\/[^'"]+)\1/i.exec(
        rawAttrs,
      );
      if (!hrefMatch) return '<a>';
      return `<a href="${escapeAttribute(hrefMatch[2])}" rel="noopener noreferrer">`;
    },
  );
}
