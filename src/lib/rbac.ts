import { getSession } from "./session";
import type { Role } from "./rbac-shared";

// Re-export the client-safe pieces so server code can import everything from here.
export * from "./rbac-shared";

/**
 * Active role comes from the verified login session.
 * No session → least privilege (middleware redirects to /login anyway).
 */
export function getRole(): Role {
  return getSession()?.role ?? "VIEWER";
}
