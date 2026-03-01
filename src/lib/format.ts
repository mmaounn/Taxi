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

/**
 * Parse a decimal input string in Austrian/German format to a number.
 * Accepts both comma and dot as decimal separator.
 * Handles thousands separators (dots in Austrian format).
 *
 * Examples:
 *   "1,50"     → 1.5
 *   "1.234,56" → 1234.56
 *   "1234.56"  → 1234.56  (also accepts dot-decimal)
 *   "50"       → 50
 *   ""         → undefined
 */
export function parseDecimalInput(
  value: string | number | null | undefined,
): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "number") return isNaN(value) ? undefined : value;
  const trimmed = value.trim();
  if (trimmed === "") return undefined;

  // If the string contains both dots and commas, determine which is the decimal separator.
  // Austrian format: 1.234,56 (dot = thousands, comma = decimal)
  // US format:       1,234.56 (comma = thousands, dot = decimal)
  // We prioritize Austrian format: if the last separator is a comma, it's the decimal.
  const lastComma = trimmed.lastIndexOf(",");
  const lastDot = trimmed.lastIndexOf(".");

  let cleaned: string;
  if (lastComma > lastDot) {
    // Austrian: dots are thousands, comma is decimal → "1.234,56" → "1234.56"
    cleaned = trimmed.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    // US-style or plain dot decimal → "1,234.56" → "1234.56" or "1.50" → "1.50"
    cleaned = trimmed.replace(/,/g, "");
  } else {
    // No separators or only one type
    cleaned = trimmed.replace(",", ".");
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}
