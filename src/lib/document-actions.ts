"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "./db";
import { getRole, can } from "./rbac";
import { getSession } from "./session";
import { UPLOAD_DIR } from "./uploads";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const DOC_KINDS = ["LEASE", "DEED", "PERMIT", "INVOICE", "OTHER"] as const;

function assertDocs() {
  if (!can("editIssues", getRole())) throw new Error("Not permitted: documents");
}

export async function uploadDocument(formData: FormData): Promise<{ error?: string }> {
  assertDocs();
  const propertyId = String(formData.get("propertyId") ?? "");
  const kindRaw = String(formData.get("kind") ?? "OTHER");
  const kind = (DOC_KINDS as readonly string[]).includes(kindRaw) ? kindRaw : "OTHER";
  const file = formData.get("file");
  if (!propertyId || !(file instanceof File) || file.size === 0) return { error: "missing" };
  if (file.size > MAX_SIZE) return { error: "too_large" };

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return { error: "missing" };

  const storedAs = `${randomBytes(16).toString("hex")}${path.extname(file.name).slice(0, 10)}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, storedAs), Buffer.from(await file.arrayBuffer()));

  await prisma.document.create({
    data: {
      propertyId,
      name: file.name.slice(0, 200),
      kind,
      storedAs,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
      uploadedBy: getSession()?.name ?? null,
    },
  });
  revalidatePath(`/properties/${propertyId}`);
  return {};
}

export async function deleteDocument(formData: FormData) {
  assertDocs();
  const id = String(formData.get("id") ?? "");
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return;
  await prisma.document.delete({ where: { id } });
  await unlink(path.join(UPLOAD_DIR, doc.storedAs)).catch(() => {});
  revalidatePath(`/properties/${doc.propertyId}`);
}
