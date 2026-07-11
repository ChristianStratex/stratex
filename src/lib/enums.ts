// Allowed values for the string-based "enum" fields (SQLite has no native enums).
// Labels are keyed by locale for the bilingual UI.

export const ENTITY_TYPES = ["PERSONAL", "BV", "HOLDING", "SPV"] as const;
export const PROPERTY_TYPES = [
  "OFFICE",
  "RETAIL",
  "LOGISTICS",
  "RESIDENTIAL",
  "MIXED",
  "LAND",
  "MONUMENT",
] as const;
export const PROPERTY_STATUS = ["ACTIVE", "IN_DEVELOPMENT", "FOR_SALE", "SOLD"] as const;
export const CHARGE_STATUS = ["OPEN", "PAID", "PARTIAL", "LATE", "MISSING"] as const;
export const ISSUE_RAISED_BY = ["TENANT", "MANAGER", "OWNER"] as const;
export const ISSUE_CATEGORY = ["MAINTENANCE", "LEGAL", "PAYMENT", "DAMAGE", "OTHER"] as const;
export const ISSUE_PRIORITY = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const ISSUE_STATUS = ["OPEN", "IN_PROGRESS", "RESOLVED"] as const;
export const PROJECT_STATUS = ["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED"] as const;
export const USER_ROLES = ["OWNER", "MANAGER", "ACCOUNTANT", "ASSISTANT", "VIEWER"] as const;

export type Locale = "nl" | "en";

type LabelMap = Record<string, { nl: string; en: string }>;

export const PROPERTY_TYPE_LABELS: LabelMap = {
  OFFICE: { nl: "Kantoor", en: "Office" },
  RETAIL: { nl: "Winkel", en: "Retail" },
  LOGISTICS: { nl: "Logistiek", en: "Logistics" },
  RESIDENTIAL: { nl: "Woning", en: "Residential" },
  MIXED: { nl: "Gemengd", en: "Mixed-use" },
  LAND: { nl: "Grond", en: "Land" },
  MONUMENT: { nl: "Monument", en: "Monument" },
};

export const PROPERTY_STATUS_LABELS: LabelMap = {
  ACTIVE: { nl: "Actief", en: "Active" },
  IN_DEVELOPMENT: { nl: "In ontwikkeling", en: "In development" },
  FOR_SALE: { nl: "Te koop", en: "For sale" },
  SOLD: { nl: "Verkocht", en: "Sold" },
};

export const CHARGE_STATUS_LABELS: LabelMap = {
  OPEN: { nl: "Openstaand", en: "Open" },
  PAID: { nl: "Betaald", en: "Paid" },
  PARTIAL: { nl: "Deels betaald", en: "Partial" },
  LATE: { nl: "Te laat", en: "Late" },
  MISSING: { nl: "Niet betaald", en: "Missing" },
};

export const ISSUE_STATUS_LABELS: LabelMap = {
  OPEN: { nl: "Open", en: "Open" },
  IN_PROGRESS: { nl: "In behandeling", en: "In progress" },
  RESOLVED: { nl: "Opgelost", en: "Resolved" },
};

export const ISSUE_PRIORITY_LABELS: LabelMap = {
  LOW: { nl: "Laag", en: "Low" },
  MEDIUM: { nl: "Middel", en: "Medium" },
  HIGH: { nl: "Hoog", en: "High" },
  URGENT: { nl: "Urgent", en: "Urgent" },
};

export const ISSUE_RAISED_BY_LABELS: LabelMap = {
  TENANT: { nl: "Huurder", en: "Tenant" },
  MANAGER: { nl: "Beheerder", en: "Manager" },
  OWNER: { nl: "Eigenaar", en: "Owner" },
};

export const ISSUE_CATEGORY_LABELS: LabelMap = {
  MAINTENANCE: { nl: "Onderhoud", en: "Maintenance" },
  LEGAL: { nl: "Juridisch", en: "Legal" },
  PAYMENT: { nl: "Betaling", en: "Payment" },
  DAMAGE: { nl: "Schade", en: "Damage" },
  OTHER: { nl: "Overig", en: "Other" },
};

export const PROJECT_STATUS_LABELS: LabelMap = {
  PLANNING: { nl: "Planning", en: "Planning" },
  IN_PROGRESS: { nl: "In uitvoering", en: "In progress" },
  ON_HOLD: { nl: "On hold", en: "On hold" },
  COMPLETED: { nl: "Afgerond", en: "Completed" },
};

export const ENTITY_TYPE_LABELS: LabelMap = {
  PERSONAL: { nl: "Privé", en: "Personal" },
  BV: { nl: "B.V.", en: "BV (company)" },
  HOLDING: { nl: "Holding", en: "Holding" },
  SPV: { nl: "SPV (project)", en: "SPV (project)" },
};

export function label(map: LabelMap, key: string, locale: Locale): string {
  return map[key]?.[locale] ?? key;
}
