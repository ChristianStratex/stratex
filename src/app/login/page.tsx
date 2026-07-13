import { redirect } from "next/navigation";
import { getI18n } from "@/i18n";
import { getSession } from "@/lib/session";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage({ searchParams }: { searchParams: { from?: string } }) {
  if (getSession()) redirect("/");
  const { locale, t } = getI18n();
  const nl = locale === "nl";
  const from = typeof searchParams.from === "string" ? searchParams.from : undefined;

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-base font-bold text-white">
            Sx
          </span>
          <div className="leading-tight">
            <div className="text-lg font-bold text-slate-900">{t.appName}</div>
            <div className="text-xs text-slate-400">{t.tagline}</div>
          </div>
        </div>
        <div className="card p-6">
          <LoginForm locale={locale} from={from} />
        </div>
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
          <div className="mb-1 font-semibold text-slate-600">{nl ? "Demo-accounts" : "Demo accounts"} (wachtwoord: demo2026)</div>
          <ul className="space-y-0.5">
            <li>owner@example.nl — {nl ? "Eigenaar (alles)" : "Owner (everything)"}</li>
            <li>manager@example.nl — {nl ? "Beheerder" : "Manager"}</li>
            <li>boekhouding@example.nl — Accountant</li>
            <li>viewer@example.nl — {nl ? "Alleen-lezen" : "View-only"}</li>
            <li>huurder@example.nl — {nl ? "Huurdersportaal" : "Tenant portal"}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
