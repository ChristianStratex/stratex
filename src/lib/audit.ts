import { prisma } from "./db";
import { getSession } from "./session";

/**
 * Record an audit entry for a mutating action. Best-effort: a logging failure
 * must never break the underlying mutation, so errors are swallowed.
 */
export async function audit(action: string, detail: string): Promise<void> {
  try {
    const session = getSession();
    await prisma.auditLog.create({
      data: {
        actorName: session?.name ?? "system",
        actorRole: session?.role ?? "SYSTEM",
        action,
        detail: detail.slice(0, 400),
      },
    });
  } catch {
    // ignore — auditing is non-critical
  }
}
