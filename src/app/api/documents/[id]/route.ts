import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { UPLOAD_DIR } from "@/lib/uploads";

// Streams a stored document. Auth: any logged-in user (middleware also gates).
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!getSession()) return new Response("Unauthorized", { status: 401 });
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
