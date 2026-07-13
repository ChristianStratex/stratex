import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { getI18n } from "@/i18n";
import { getRole, can, ROLE_LABELS } from "@/lib/rbac";
import { getSession } from "@/lib/session";
import { logout } from "@/lib/auth-actions";
import { Nav } from "@/components/Nav";
import { LocaleToggle } from "@/components/LocaleToggle";
import { DemoBanner } from "@/components/DemoBanner";

export const metadata: Metadata = {
  title: "StrateX — Vastgoed dashboard",
  description: "Commercial real estate portfolio dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, t } = getI18n();
  const session = getSession();

  // Unauthenticated (i.e. the /login page): bare shell without the app chrome.
  if (!session) {
    return (
      <html lang={locale}>
        <body>
          <DemoBanner locale={locale} />
          {children}
        </body>
      </html>
    );
  }

  const role = getRole();
  const canViewTax = can("viewTax", role);
  const canBank = can("recordPayments", role);

  return (
    <html lang={locale}>
      <body>
        <DemoBanner locale={locale} />
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-5 md:flex">
            <Link href="/" className="mb-6 flex items-center gap-2 px-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                Sx
              </span>
              <div className="leading-tight">
                <div className="text-sm font-bold text-slate-900">{t.appName}</div>
                <div className="text-[10px] text-slate-400">{t.tagline}</div>
              </div>
            </Link>
            <Nav t={t} canViewTax={canViewTax} canBank={canBank} />
            <div className="mt-auto space-y-3 pt-4">
              {/* Logged-in user */}
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
                  {session.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate text-xs font-semibold text-slate-700">{session.name}</div>
                  <div className="text-[10px] text-slate-400">{ROLE_LABELS[role][locale]}</div>
                </div>
                <form action={logout}>
                  <button
                    type="submit"
                    title={locale === "nl" ? "Uitloggen" : "Sign out"}
                    className="text-xs text-slate-400 transition hover:text-red-600"
                  >
                    ⎋
                  </button>
                </form>
              </div>
              <div>
                <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {t.common.language}
                </div>
                <div className="px-2">
                  <LocaleToggle locale={locale} />
                </div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="min-w-0 flex-1">
            {/* Mobile top bar */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
              <Link href="/" className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
                  Sx
                </span>
                <span className="text-sm font-bold">{t.appName}</span>
              </Link>
              <LocaleToggle locale={locale} />
            </div>
            <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
