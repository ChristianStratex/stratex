import path from "node:path";

// Local dev storage for uploaded documents (gitignored). Production target is
// EU object storage — swap this adapter, keep the Document rows.
export const UPLOAD_DIR = path.join(process.cwd(), "var", "uploads");
