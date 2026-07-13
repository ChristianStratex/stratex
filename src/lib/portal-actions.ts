"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./db";
import { getSession } from "./session";
import { ISSUE_CATEGORY } from "./enums";

/** Tenants may raise an issue only on a property they actively lease. */
export async function createTenantIssue(formData: FormData): Promise<{ error?: string }> {
  const session = getSession();
  if (!session || session.role !== "TENANT") return { error: "forbidden" };

  const propertyId = String(formData.get("propertyId") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 140);
  const description = String(formData.get("description") ?? "").trim().slice(0, 1000) || null;
  const categoryRaw = String(formData.get("category") ?? "MAINTENANCE");
  const category = (ISSUE_CATEGORY as readonly string[]).includes(categoryRaw) ? categoryRaw : "MAINTENANCE";
  if (!propertyId || !title) return { error: "missing" };

  // Verify the property belongs to one of the tenant's active leases.
  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    include: { tenant: { include: { leases: { include: { unit: true } } } } },
  });
  const allowed = user?.tenant?.leases.some(
    (l) => l.status === "ACTIVE" && l.unit.propertyId === propertyId,
  );
  if (!allowed) return { error: "forbidden" };

  await prisma.issue.create({
    data: {
      propertyId,
      title,
      description,
      raisedBy: "TENANT",
      category,
      priority: "MEDIUM",
      status: "OPEN",
    },
  });
  revalidatePath("/portal");
  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/issues");
  return {};
}
