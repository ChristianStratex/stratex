import { getPortfolio } from "@/lib/queries";
import { getRole, can } from "@/lib/rbac";

// Streams the portfolio as a CSV download (for the owner's accountant / records).
export async function GET() {
  if (!can("exportData", getRole())) return new Response("Forbidden", { status: 403 });
  const rows = await getPortfolio();

  const headers = [
    "Name",
    "Street",
    "PostalCode",
    "City",
    "Type",
    "Status",
    "Owner",
    "OwnerType",
    "WOZValue",
    "PurchasePrice",
    "MonthlyIncome",
    "MonthlyCost",
    "NetCashflow",
    "GrossYieldPct",
    "OccupancyPct",
    "ArrearsAmount",
    "OpenIssues",
  ];

  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [headers.join(",")];
  for (const p of rows) {
    lines.push(
      [
        p.name,
        p.street,
        p.postalCode,
        p.city,
        p.type,
        p.status,
        p.ownerName,
        p.ownerType,
        p.wozValue ?? "",
        p.purchasePrice ?? "",
        Math.round(p.monthlyIncome),
        Math.round(p.monthlyCost),
        Math.round(p.netCashflow),
        p.grossYield != null ? p.grossYield.toFixed(1) : "",
        Math.round(p.occupancy),
        Math.round(p.arrearsAmount),
        p.openIssues,
      ]
        .map(esc)
        .join(","),
    );
  }

  const csv = "﻿" + lines.join("\n"); // BOM for Excel UTF-8

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="stratex-portfolio.csv"`,
    },
  });
}
