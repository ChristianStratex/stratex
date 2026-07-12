import { getI18n } from "@/i18n";
import { getRole, can } from "@/lib/rbac";
import { ReconcilePanel } from "@/components/ReconcilePanel";

export const dynamic = "force-dynamic";

export default function BankPage() {
  const { locale, t } = getI18n();
  const role = getRole();
  if (!can("recordPayments", role)) {
    return (
      <div className="card p-8 text-center">
        <div className="text-3xl">🔒</div>
        <h1 className="mt-2 text-lg font-semibold text-slate-800">
          {locale === "nl" ? "Geen toegang" : "No access"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {locale === "nl"
            ? "Deze rol mag geen betalingen registreren."
            : "This role cannot record payments."}
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">{t.bank.title}</h1>
        <p className="text-sm text-slate-500">{t.bank.subtitle}</p>
      </header>
      <ReconcilePanel locale={locale} />
    </div>
  );
}
