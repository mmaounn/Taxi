"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

/**
 * Format a raw numeric string (digits + optional comma) into Austrian format
 * with "." as thousands separator and "," as decimal separator.
 *
 * Examples:
 *   "1234"    → "1.234"
 *   "1234,5"  → "1.234,5"
 *   "1234,56" → "1.234,56"
 *   ""        → ""
 *   "-1234"   → "-1.234"
 */
function formatAustrian(raw: string): string {
  if (!raw) return "";

  const negative = raw.startsWith("-");
  const withoutSign = negative ? raw.slice(1) : raw;

  const parts = withoutSign.split(",");
  const intPart = parts[0] || "";
  const decPart = parts.length > 1 ? parts[1] : null;

  // Add thousands separators to integer part
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  const sign = negative ? "-" : "";
  return decPart !== null ? `${sign}${formatted},${decPart}` : `${sign}${formatted}`;
}

/**
 * Strip formatting to get raw digits + optional comma + optional decimals.
 * "1.234,56" → "1234,56"
 * "-1.234"   → "-1234"
 */
function stripFormatting(display: string): string {
  return display.replace(/\./g, "");
}

interface CurrencyInputProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  value: string;
  onChange: (value: string) => void;
  /** Max decimal places allowed (default: 2) */
  decimals?: number;
  /** Allow negative values (default: false) */
  allowNegative?: boolean;
}

export function CurrencyInput({
  value,
  onChange,
  decimals = 2,
  allowNegative = false,
  ...props
}: CurrencyInputProps) {
  // Format the initial/external value for display
  const displayValue = React.useMemo(() => formatAustrian(value), [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target.value;

    // Strip thousand separators to get raw value
    const raw = stripFormatting(input);

    // Validate: only allow digits, one comma, optional leading minus
    const pattern = allowNegative
      ? new RegExp(`^-?\\d*,?\\d{0,${decimals}}$`)
      : new RegExp(`^\\d*,?\\d{0,${decimals}}$`);

    if (raw === "" || raw === "-" || pattern.test(raw)) {
      onChange(raw);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const pos = input.selectionStart ?? 0;
    const display = input.value;

    // When backspace would land on a thousands separator, skip over it
    if (e.key === "Backspace" && pos > 0 && display[pos - 1] === ".") {
      e.preventDefault();
      // Remove the digit before the dot
      const raw = stripFormatting(display);
      const rawPos = stripFormatting(display.slice(0, pos - 1)).length;
      const newRaw = raw.slice(0, rawPos - 1) + raw.slice(rawPos);
      onChange(newRaw);

      // Set cursor position after React re-renders
      requestAnimationFrame(() => {
        const newDisplay = formatAustrian(newRaw);
        const newCursorPos = Math.max(0, pos - 2);
        input.setSelectionRange(newCursorPos, newCursorPos);
        // Adjust if we're now on a dot
        if (newDisplay[newCursorPos] === ".") {
          input.setSelectionRange(newCursorPos, newCursorPos);
        }
      });
    }

    // When delete would hit a thousands separator, skip over it
    if (e.key === "Delete" && pos < display.length && display[pos] === ".") {
      e.preventDefault();
      const raw = stripFormatting(display);
      const rawPos = stripFormatting(display.slice(0, pos)).length;
      const newRaw = raw.slice(0, rawPos) + raw.slice(rawPos + 1);
      onChange(newRaw);

      requestAnimationFrame(() => {
        input.setSelectionRange(pos, pos);
      });
    }
  }

  // Preserve cursor position after formatting changes the value
  const inputRef = React.useRef<HTMLInputElement>(null);
  const cursorRef = React.useRef<number | null>(null);

  const handleChangeWithCursor = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const pos = input.selectionStart ?? 0;
      const oldDisplay = input.value;

      // Count how many real chars (non-dot) are before the cursor
      const realCharsBefore = stripFormatting(oldDisplay.slice(0, pos)).length;
      cursorRef.current = realCharsBefore;

      handleChange(e);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onChange, allowNegative, decimals],
  );

  React.useLayoutEffect(() => {
    if (cursorRef.current === null || !inputRef.current) return;

    const realTarget = cursorRef.current;
    const display = inputRef.current.value;

    // Find the position in the formatted string that corresponds to realTarget real chars
    let realCount = 0;
    let newPos = 0;
    for (let i = 0; i < display.length; i++) {
      if (realCount === realTarget) {
        newPos = i;
        break;
      }
      if (display[i] !== ".") {
        realCount++;
      }
      newPos = i + 1;
    }

    inputRef.current.setSelectionRange(newPos, newPos);
    cursorRef.current = null;
  }, [displayValue]);

  return (
    <Input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChangeWithCursor}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}
