import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { UPLOAD_DIR } from "@/lib/uploads";

// Streams a stored document. Staff only — documents are never exposed to the
// tenant portal, so a TENANT session must not be able to fetch them by id.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (session.role === "TENANT") return new Response("Forbidden", { status: 403 });
  const doc = await prisma.document.findUnique({ where: { id: params.id } });
  if (!doc) return new Response("Not found", { status: 404 });

  try {
    const data = await readFile(path.join(UPLOAD_DIR, path.basename(doc.storedAs)));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.name)}"`,
        "Content-Length": String(doc.size),
      },
    });
  } catch {
    return new Response("File missing", { status: 410 });
  }
}
