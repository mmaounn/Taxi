/**
 * Format a number as EUR in Austrian locale.
 * Uses "." as thousands separator and "," as decimal separator.
 * Examples: €1.234,56 | €0,00 | -€50,00
 */
export function formatEur(val: number | null | undefined): string {
  if (val == null) return "€0,00";
  const num = Number(val);
  const abs = Math.abs(num);
  const formatted = abs.toLocaleString("de-AT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return num < 0 ? `-€${formatted}` : `€${formatted}`;
}

/**
 * Format EUR without the € sign (for use in contexts where the sign is added separately).
 */
export function formatEurValue(val: number | null | undefined): string {
  if (val == null) return "0,00";
  return Number(val).toLocaleString("de-AT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format EUR for chart axis labels (shorter, no decimals for large values).
 * Examples: €1.234 | €500
 */
export function formatEurShort(val: number): string {
  return `€${Math.round(val).toLocaleString("de-AT")}`;
}

/**
 * Null-safe formatEur that returns em-dash for null values.
 */
export function formatEurOrDash(val: number | null | undefined): string {
  if (val == null) return "\u2014";
  return formatEur(val);
}

/**
 * Format number with comma decimal for CSV export (European convention).
 */
export function formatEurCsv(val: number): string {
  return val.toFixed(2).replace(".", ",");
}
