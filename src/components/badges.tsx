import { clsx } from "clsx";
import type { Locale } from "@/lib/enums";
import {
  CHARGE_STATUS_LABELS,
  ISSUE_STATUS_LABELS,
  ISSUE_PRIORITY_LABELS,
  PROPERTY_TYPE_LABELS,
  PROPERTY_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
  ENTITY_TYPE_LABELS,
  label,
} from "@/lib/enums";

const CHARGE_COLORS: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-700",
  OPEN: "bg-slate-100 text-slate-600",
  PARTIAL: "bg-amber-100 text-amber-700",
  LATE: "bg-orange-100 text-orange-700",
  MISSING: "bg-red-100 text-red-700",
};

const ISSUE_STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-red-100 text-red-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-sky-100 text-sky-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

const PROJECT_COLORS: Record<string, string> = {
  PLANNING: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-brand-100 text-brand-700",
  ON_HOLD: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
};

export function ChargeBadge({ status, locale }: { status: string; locale: Locale }) {
  return (
    <span className={clsx("badge", CHARGE_COLORS[status] ?? "bg-slate-100 text-slate-600")}>
      {label(CHARGE_STATUS_LABELS, status, locale)}
    </span>
  );
}

export function IssueStatusBadge({ status, locale }: { status: string; locale: Locale }) {
  return (
    <span className={clsx("badge", ISSUE_STATUS_COLORS[status] ?? "bg-slate-100 text-slate-600")}>
      {label(ISSUE_STATUS_LABELS, status, locale)}
    </span>
  );
}

export function PriorityBadge({ priority, locale }: { priority: string; locale: Locale }) {
  return (
    <span className={clsx("badge", PRIORITY_COLORS[priority] ?? "bg-slate-100 text-slate-600")}>
      {label(ISSUE_PRIORITY_LABELS, priority, locale)}
    </span>
  );
}

export function ProjectStatusBadge({ status, locale }: { status: string; locale: Locale }) {
  return (
    <span className={clsx("badge", PROJECT_COLORS[status] ?? "bg-slate-100 text-slate-600")}>
      {label(PROJECT_STATUS_LABELS, status, locale)}
    </span>
  );
}

export function TypeBadge({ type, locale }: { type: string; locale: Locale }) {
  return (
    <span className="badge bg-slate-100 text-slate-600">{label(PROPERTY_TYPE_LABELS, type, locale)}</span>
  );
}

export function PropertyStatusBadge({ status, locale }: { status: string; locale: Locale }) {
  const colors: Record<string, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-700",
    IN_DEVELOPMENT: "bg-brand-100 text-brand-700",
    FOR_SALE: "bg-amber-100 text-amber-700",
    SOLD: "bg-slate-100 text-slate-500",
  };
  return (
    <span className={clsx("badge", colors[status] ?? "bg-slate-100 text-slate-600")}>
      {label(PROPERTY_STATUS_LABELS, status, locale)}
    </span>
  );
}

export function EntityBadge({ type, locale }: { type: string; locale: Locale }) {
  const colors: Record<string, string> = {
    PERSONAL: "bg-purple-100 text-purple-700",
    BV: "bg-brand-100 text-brand-700",
    HOLDING: "bg-indigo-100 text-indigo-700",
    SPV: "bg-teal-100 text-teal-700",
  };
  return (
    <span className={clsx("badge", colors[type] ?? "bg-slate-100 text-slate-600")}>
      {label(ENTITY_TYPE_LABELS, type, locale)}
    </span>
  );
}

const HEALTH_COLORS: Record<string, string> = {
  good: "bg-emerald-500",
  warning: "bg-amber-500",
  critical: "bg-red-500",
};

export function HealthDot({ health }: { health: "good" | "warning" | "critical" }) {
  return <span className={clsx("inline-block h-2.5 w-2.5 rounded-full", HEALTH_COLORS[health])} />;
}
