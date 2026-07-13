import { getI18n } from "@/i18n";
import { getRole, can } from "@/lib/rbac";
import { getIndexationCandidates } from "@/lib/indexation-actions";
import { IndexationPanel } from "@/components/IndexationPanel";

export const dynamic = "force-dynamic";

export default async function IndexationPage() {
  const { locale } = getI18n();
  const nl = locale === "nl";
  const canApply = can("manageLeases", getRole());
  const candidates = await getIndexationCandidates();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">{nl ? "Huurindexatie" : "Rent indexation"}</h1>
        <p className="text-sm text-slate-500">
          {nl
            ? "Jaarlijkse CPI-verhoging per contract — niet indexeren is blijvend huurverlies."
            : "Annual CPI increase per lease — skipping indexation is permanent rent loss."}
        </p>
      </header>
      <IndexationPanel candidates={candidates} canApply={canApply} locale={locale} />
      <p className="text-xs text-slate-400">
        {nl
          ? "CPI-percentage handmatig instelbaar; automatische CBS-koppeling staat op de roadmap."
          : "CPI percentage set manually; automatic CBS feed is on the roadmap."}
      </p>
    </div>
  );
}
