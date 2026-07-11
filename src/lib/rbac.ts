import { cookies } from "next/headers";
import { ROLE_COOKIE, DEFAULT_ROLE, ALL_ROLES, type Role } from "./rbac-shared";

// Re-export the client-safe pieces so server code can import everything from here.
export * from "./rbac-shared";

/** Read the active role from the cookie (server components / actions only). */
export function getRole(): Role {
  const v = cookies().get(ROLE_COOKIE)?.value as Role | undefined;
  return v && ALL_ROLES.includes(v) ? v : DEFAULT_ROLE;
}
