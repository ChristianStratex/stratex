import { NextResponse } from "next/server";
import { LOCALE_COOKIE } from "@/i18n";

// Sets the locale cookie then redirects back. Used by the language toggle.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const locale = searchParams.get("locale") === "en" ? "en" : "nl";
  const back = searchParams.get("from") || "/";
  const res = NextResponse.redirect(new URL(back, origin));
  res.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}
