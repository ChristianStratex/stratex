// Alert center: flattens portfolio signals into one severity-ranked list.
// Pure mapping logic is separated for unit testing; getAlerts() does the I/O.

import { getInsights, getIssues, type Insight } from "./queries";

export type AlertSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface Alert {
  severity: AlertSeverity;
  kind: "ARREARS" | "VACANT" | "EXPIRING" | "INDEXATION" | "ISSUE";
  title: string;
  detail: string;
  propertyId: string;
  href: string;
  amount?: number;
  date?: Date;
}

const SEVERITY_ORDER: Record<AlertSeverity, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

/** Arrears severity scales with amount outstanding. */
export function arrearsSeverity(amount: number): AlertSeverity {
  if (amount >= 10_000) return "CRITICAL";
  if (amount >= 2_500) return "HIGH";
  return "MEDIUM";
}

/** Lease-expiry severity scales with proximity. */
export function expirySeverity(endDate: Date, now: Date): AlertSeverity {
  const days = Math.floor((endDate.getTime() - now.getTime()) / 86_400_000);
  if (days <= 60) return "HIGH";
  if (days <= 120) return "MEDIUM";
  return "LOW";
}

/** Issue severity follows its priority. */
export function issueSeverity(priority: string): AlertSeverity {
  if (priority === "URGENT") return "CRITICAL";
  if (priority === "HIGH") return "HIGH";
  if (priority === "MEDIUM") return "MEDIUM";
  return "LOW";
}

export function sortAlerts(alerts: Alert[]): Alert[] {
  return [...alerts].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || (b.amount ?? 0) - (a.amount ?? 0),
  );
}

function fromInsight(i: Insight, now: Date): Alert {
  switch (i.kind) {
    case "ARREARS":
      return {
        severity: arrearsSeverity(i.amount ?? 0),
        kind: "ARREARS",
        title: i.title,
        detail: i.detail,
        propertyId: i.propertyId,
        href: `/properties/${i.propertyId}`,
        amount: i.amount,
      };
    case "VACANT":
      return {
        severity: "MEDIUM",
        kind: "VACANT",
        title: i.title,
        detail: i.detail,
        propertyId: i.propertyId,
        href: `/properties/${i.propertyId}`,
      };
    case "EXPIRING":
      return {
        severity: i.date ? expirySeverity(i.date, now) : "MEDIUM",
        kind: "EXPIRING",
        title: i.title,
        detail: i.detail,
        propertyId: i.propertyId,
        href: `/properties/${i.propertyId}`,
        amount: i.amount,
        date: i.date,
      };
    default:
      return {
        severity: "LOW",
        kind: "INDEXATION",
        title: i.title,
        detail: i.detail,
        propertyId: i.propertyId,
        href: `/properties/${i.propertyId}`,
        amount: i.amount,
        date: i.date,
      };
  }
}

export async function getAlerts(): Promise<Alert[]> {
  const now = new Date();
  const [insights, issues] = await Promise.all([getInsights(), getIssues()]);

  const alerts: Alert[] = [
    ...insights.arrears.map((i) => fromInsight(i, now)),
    ...insights.vacant.map((i) => fromInsight(i, now)),
    ...insights.expiring.map((i) => fromInsight(i, now)),
    ...insights.indexation.map((i) => fromInsight(i, now)),
    ...issues
      .filter((i) => i.status !== "RESOLVED" && (i.priority === "HIGH" || i.priority === "URGENT"))
      .map<Alert>((i) => ({
        severity: issueSeverity(i.priority),
        kind: "ISSUE",
        title: i.property.name,
        detail: i.title,
        propertyId: i.propertyId,
        href: `/properties/${i.propertyId}`,
        amount: i.cost ?? undefined,
      })),
  ];

  return sortAlerts(alerts);
}
