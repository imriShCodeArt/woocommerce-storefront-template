export function parseDecimalAmount(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const amount = Number(trimmed);
  return Number.isFinite(amount) ? amount : null;
}

/** Store API prices are integers in minor currency units (cents, agorot, …). */
export function parseMinorAmount(
  value: string,
  minorUnit: number,
): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const raw = Number(trimmed);
  if (!Number.isFinite(raw)) return null;
  const unit = Number.isInteger(minorUnit) && minorUnit >= 0 ? minorUnit : 2;
  return raw / 10 ** unit;
}

export function formatCatalogPrice(
  amount: number | null,
  currency: string,
  locale: string,
): string {
  if (amount == null || !Number.isFinite(amount)) return '';
  const code = currency.trim();
  if (!code) return amount.toFixed(2);
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${code}`;
  }
}
