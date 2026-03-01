/**
 * SEPA validation utilities.
 */

import { formatEur } from "@/lib/format";

const IBAN_LENGTHS: Record<string, number> = {
  AT: 20, DE: 22, CH: 21, FR: 27, IT: 27, ES: 24, NL: 18, BE: 16, LU: 20,
  PT: 25, IE: 22, FI: 18, DK: 18, SE: 24, NO: 15, PL: 28, CZ: 24, SK: 24,
  HU: 28, HR: 21, SI: 19, BG: 22, RO: 24, LT: 20, LV: 21, EE: 20, CY: 28,
  MT: 31, GR: 27,
};

export function validateIBAN(iban: string): { valid: boolean; error?: string } {
  if (!iban) return { valid: false, error: "IBAN is required" };

  // Remove spaces and uppercase
  const cleaned = iban.replace(/\s/g, "").toUpperCase();

  // Check country code
  const countryCode = cleaned.substring(0, 2);
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return { valid: false, error: "Invalid country code" };
  }

  // Check length
  const expectedLength = IBAN_LENGTHS[countryCode];
  if (expectedLength && cleaned.length !== expectedLength) {
    return { valid: false, error: `IBAN for ${countryCode} must be ${expectedLength} characters` };
  }

  // Check digits
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(cleaned)) {
    return { valid: false, error: "Invalid IBAN format" };
  }

  // Mod 97 check
  const rearranged = cleaned.substring(4) + cleaned.substring(0, 4);
  const numeric = rearranged
    .split("")
    .map((c) => {
      const code = c.charCodeAt(0);
      return code >= 65 && code <= 90 ? (code - 55).toString() : c;
    })
    .join("");

  let remainder = 0;
  for (let i = 0; i < numeric.length; i += 7) {
    const block = remainder.toString() + numeric.substring(i, i + 7);
    remainder = parseInt(block, 10) % 97;
  }

  if (remainder !== 1) {
    return { valid: false, error: "IBAN checksum invalid" };
  }

  return { valid: true };
}

export interface SepaValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateSepaExport({
  partnerIban,
  partnerName,
  settlements,
}: {
  partnerIban: string | null;
  partnerName: string;
  settlements: {
    id: string;
    driverName: string;
    driverIban: string | null;
    payoutAmount: number;
    status: string;
  }[];
}): SepaValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate partner (debtor)
  if (!partnerIban) {
    errors.push("Partner IBAN is not configured. Set it in Settings.");
  } else {
    const ibanCheck = validateIBAN(partnerIban);
    if (!ibanCheck.valid) {
      errors.push(`Partner IBAN invalid: ${ibanCheck.error}`);
    }
  }

  if (!partnerName) {
    errors.push("Partner company name is required.");
  }

  // Validate each settlement
  for (const s of settlements) {
    if (s.status !== "APPROVED") {
      errors.push(`${s.driverName}: Settlement must be APPROVED (currently ${s.status})`);
    }

    if (!s.driverIban) {
      errors.push(`${s.driverName}: Missing IBAN`);
    } else {
      const ibanCheck = validateIBAN(s.driverIban);
      if (!ibanCheck.valid) {
        errors.push(`${s.driverName}: ${ibanCheck.error}`);
      }
    }

    if (s.payoutAmount <= 0) {
      warnings.push(`${s.driverName}: Payout amount is ${formatEur(s.payoutAmount)} (zero or negative)`);
    }
  }

  if (settlements.length === 0) {
    errors.push("No settlements selected.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
