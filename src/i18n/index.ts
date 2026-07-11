import { cookies } from "next/headers";
import type { Locale } from "@/lib/enums";
import { getDictionary } from "./dictionaries";

export const LOCALE_COOKIE = "stratex_locale";
export const DEFAULT_LOCALE: Locale = "nl";

/** Read the active locale from the cookie (server components). */
export function getLocale(): Locale {
  const value = cookies().get(LOCALE_COOKIE)?.value;
  return value === "en" || value === "nl" ? value : DEFAULT_LOCALE;
}

/** Convenience: get both the locale and its dictionary in one call. */
export function getI18n() {
  const locale = getLocale();
  return { locale, t: getDictionary(locale) };
}
