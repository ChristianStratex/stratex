import { getEntityReport } from "@/lib/queries";
import { getRole, can } from "@/lib/rbac";

// Streams the per-entity P&L report as CSV (for the accountant).
export async function GET() {
  if (!can("exportData", getRole())) return new Response("Forbidden", { status: 403 });
  const rows = await getEntityReport();
  const headers = [
    "Entity", "Type", "TaxRegime", "KvK", "Properties", "TotalWOZ", "TotalPurchase",
    "MonthlyIncome", "MonthlyCost", "NetMonthly", "NetAnnual", "GrossYieldPct",
    "OccupancyPct", "Arrears", "OpenIssues",
  ];
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.name, r.type, r.taxRegime, r.kvkNumber ?? "", r.propertyCount,
        Math.round(r.totalWoz), Math.round(r.totalPurchase), Math.round(r.monthlyIncome),
        Math.round(r.monthlyCost), Math.round(r.netCashflow), Math.round(r.annualNet),
        r.grossYield != null ? r.grossYield.toFixed(1) : "", Math.round(r.occupancy),
        Math.round(r.arrears), r.openIssues,
      ].map(esc).join(","),
    );
  }
  return new Response("﻿" + lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="stratex-entities.csv"`,
    },
  });
}
