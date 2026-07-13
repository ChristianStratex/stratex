"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./db";
import { getRole, can, ALL_ROLES, type Role } from "./rbac";
import { hashPassword } from "./password";
import { ENTITY_TYPES } from "./enums";
import { getSession } from "./session";

function assertAdmin() {
  if (!can("admin", getRole())) throw new Error("Not permitted: admin");
}

// --- Users ---

export async function createUser(formData: FormData): Promise<{ error?: string }> {
  assertAdmin();
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const roleRaw = String(formData.get("role") ?? "VIEWER");
  const role = (ALL_ROLES as string[]).includes(roleRaw) ? (roleRaw as Role) : "VIEWER";
  const password = String(formData.get("password") ?? "");
  const tenantId = String(formData.get("tenantId") ?? "") || null;
  if (!name || !email || password.length < 6) return { error: "invalid" };
  if (role === "TENANT" && !tenantId) return { error: "tenant_required" };
  if (await prisma.user.findUnique({ where: { email } })) return { error: "exists" };

  await prisma.user.create({
    data: {
      name,
      email,
      role,
      passwordHash: hashPassword(password),
      tenantId: role === "TENANT" ? tenantId : null,
    },
  });
  revalidatePath("/settings");
  return {};
}

export async function resetPassword(formData: FormData): Promise<{ error?: string }> {
  assertAdmin();
  const id = String(formData.get("id") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!id || password.length < 6) return { error: "invalid" };
  await prisma.user.update({ where: { id }, data: { passwordHash: hashPassword(password) } });
  revalidatePath("/settings");
  return {};
}

export async function deleteUser(formData: FormData) {
  assertAdmin();
  const id = String(formData.get("id") ?? "");
  // An owner may not delete their own account (avoid locking out admin).
  if (id === getSession()?.uid) return;
  await prisma.user.delete({ where: { id } }).catch(() => {});
  revalidatePath("/settings");
}

// --- Legal entities ---

export async function upsertEntity(formData: FormData): Promise<{ error?: string }> {
  assertAdmin();
  const id = String(formData.get("id") ?? "") || null;
  const name = String(formData.get("name") ?? "").trim().slice(0, 160);
  const typeRaw = String(formData.get("type") ?? "BV");
  const type = (ENTITY_TYPES as readonly string[]).includes(typeRaw) ? typeRaw : "BV";
  const kvkNumber = String(formData.get("kvkNumber") ?? "").trim().slice(0, 20) || null;
  const taxRegime = type === "PERSONAL" ? "BOX3" : "VPB";
  if (!name) return { error: "invalid" };

  if (id) {
    await prisma.legalEntity.update({ where: { id }, data: { name, type, kvkNumber, taxRegime } });
  } else {
    await prisma.legalEntity.create({ data: { name, type, kvkNumber, taxRegime } });
  }
  revalidatePath("/settings");
  revalidatePath("/reports");
  return {};
}

export async function deleteEntity(formData: FormData): Promise<{ error?: string }> {
  assertAdmin();
  const id = String(formData.get("id") ?? "");
  const count = await prisma.property.count({ where: { ownerEntityId: id } });
  if (count > 0) return { error: "has_properties" }; // don't orphan properties
  await prisma.legalEntity.delete({ where: { id } }).catch(() => {});
  revalidatePath("/settings");
  return {};
}
