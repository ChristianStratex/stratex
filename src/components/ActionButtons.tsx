import { recordPayment, updateIssueStatus } from "@/lib/actions";
import type { Locale } from "@/lib/enums";

export function MarkPaidButton({ chargeId, locale }: { chargeId: string; locale: Locale }) {
  return (
    <form action={recordPayment}>
      <input type="hidden" name="rentChargeId" value={chargeId} />
      <button
        type="submit"
        className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
      >
        {locale === "nl" ? "Markeer betaald" : "Mark paid"}
      </button>
    </form>
  );
}

export function IssueStatusButtons({ id, status, locale }: { id: string; status: string; locale: Locale }) {
  const next: Record<string, { to: string; label: { nl: string; en: string } } | undefined> = {
    OPEN: { to: "IN_PROGRESS", label: { nl: "Start", en: "Start" } },
    IN_PROGRESS: { to: "RESOLVED", label: { nl: "Oplossen", en: "Resolve" } },
    RESOLVED: undefined,
  };
  const action = next[status];
  if (!action) {
    return (
      <form action={updateIssueStatus}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="status" value="OPEN" />
        <button type="submit" className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50">
          {locale === "nl" ? "Heropenen" : "Reopen"}
        </button>
      </form>
    );
  }
  return (
    <form action={updateIssueStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={action.to} />
      <button type="submit" className="rounded-md border border-brand-200 bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100">
        {action.label[locale]}
      </button>
    </form>
  );
}
