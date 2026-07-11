import { clsx } from "clsx";
import Link from "next/link";

export function KpiCard({
  label,
  value,
  sub,
  tone = "default",
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "positive" | "negative" | "warning";
  href?: string;
}) {
  const toneClasses = {
    default: "text-slate-900",
    positive: "text-emerald-600",
    negative: "text-red-600",
    warning: "text-amber-600",
  }[tone];

  const body = (
    <div className="card p-4 transition hover:shadow-md">
      <div className="stat-label">{label}</div>
      <div className={clsx("stat-value mt-1", toneClasses)}>{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
