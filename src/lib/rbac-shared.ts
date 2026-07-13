// Client-safe RBAC definitions (no next/headers import, so this can be used in
// client components). Server-only getRole() lives in rbac.ts.

export type Role = "OWNER" | "MANAGER" | "ACCOUNTANT" | "ASSISTANT" | "VIEWER" | "TENANT";
export const ROLE_COOKIE = "stratex_role";
export const DEFAULT_ROLE: Role = "VIEWER";
export const ALL_ROLES: Role[] = ["OWNER", "MANAGER", "ACCOUNTANT", "ASSISTANT", "VIEWER", "TENANT"];

export type Capability =
  | "recordPayments"
  | "editIssues"
  | "viewTax"
  | "exportData"
  | "importData"
  | "manageLeases"
  | "admin";

// Permission matrix — which roles hold which capability.
const MATRIX: Record<Capability, Role[]> = {
  recordPayments: ["OWNER", "MANAGER", "ACCOUNTANT"],
  editIssues: ["OWNER", "MANAGER", "ASSISTANT"],
  viewTax: ["OWNER", "ACCOUNTANT"],
  exportData: ["OWNER", "MANAGER", "ACCOUNTANT"],
  importData: ["OWNER", "MANAGER"],
  manageLeases: ["OWNER", "MANAGER"],
  admin: ["OWNER"],
};

export function can(capability: Capability, role: Role): boolean {
  return MATRIX[capability].includes(role);
}

export const ROLE_LABELS: Record<Role, { nl: string; en: string }> = {
  OWNER: { nl: "Eigenaar", en: "Owner" },
  MANAGER: { nl: "Beheerder", en: "Manager" },
  ACCOUNTANT: { nl: "Accountant", en: "Accountant" },
  ASSISTANT: { nl: "Assistent", en: "Assistant" },
  VIEWER: { nl: "Alleen-lezen", en: "Viewer" },
  TENANT: { nl: "Huurder", en: "Tenant" },
};
