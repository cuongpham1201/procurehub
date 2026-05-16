"use client";

import type { InputHTMLAttributes } from "react";

interface NumberInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "inputMode"> {
  /** Raw digit string — no commas, no currency symbols. Matches existing form state pattern. */
  value: string;
  /** Called with raw digits only (e.g. "150000000"). Commas are stripped before calling. */
  onChange: (raw: string) => void;
}

function addCommas(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Controlled text input that displays comma thousand-separators while the user
 * types (e.g. the user types "150000000" and sees "150,000,000").
 *
 * - `value`    — pass the raw numeric string from your form state (no commas)
 * - `onChange` — receives raw digits string; store it directly in form state
 * - Cursor position is restored after re-format so mid-field edits work correctly
 */
export function NumberInput({ value, onChange, className, ...props }: NumberInputProps) {
  const formatted = addCommas(String(value ?? ""));

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/,/g, "").replace(/[^\d]/g, "");
    onChange(raw);

    // Restore caret position: count its distance from the RIGHT so that the
    // re-inserted commas don't shift it unexpectedly.
    const el = e.currentTarget;
    const selEnd = el.selectionEnd ?? el.value.length;
    const charsFromEnd = el.value.length - selEnd;

    requestAnimationFrame(() => {
      if (!el || !el.isConnected) return;
      const newFormatted = addCommas(raw);
      const newPos = Math.max(0, newFormatted.length - charsFromEnd);
      el.setSelectionRange(newPos, newPos);
    });
  }

  return (
    <input
      {...props}
      type="text"
      inputMode="numeric"
      value={formatted}
      onChange={handleChange}
      className={className}
    />
  );
}
