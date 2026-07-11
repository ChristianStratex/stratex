import type { Locale } from "./enums";

const localeTag: Record<Locale, string> = { nl: "nl-NL", en: "en-GB" };

/** Format a number as EUR currency. Dutch owner → default nl-NL formatting. */
export function euro(value: number | null | undefined, locale: Locale = "nl", opts?: { compact?: boolean }): string {
  if (value == null) return "—";
  return new Intl.NumberFormat(localeTag[locale], {
    style: "currency",
    currency: "EUR",
    notation: opts?.compact ? "compact" : "standard",
    maximumFractionDigits: opts?.compact ? 1 : 0,
  }).format(value);
}

export function percent(value: number | null | undefined, locale: Locale = "nl", digits = 1): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat(localeTag[locale], {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value / 100);
}

export function formatDate(date: Date | string | null | undefined, locale: Locale = "nl"): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(localeTag[locale], {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

/** Aging bucket for an overdue amount, in days. */
export function agingBucket(days: number): "0-30" | "31-60" | "61-90" | "90+" {
  if (days <= 30) return "0-30";
  if (days <= 60) return "31-60";
  if (days <= 90) return "61-90";
  return "90+";
}
