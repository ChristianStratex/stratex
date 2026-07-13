import { generateChargesForPeriod } from "@/lib/charge-gen";
import { getSession } from "@/lib/session";

// Monthly charge generation endpoint. Intended for a scheduler (Vercel Cron
// with CRON_SECRET) — also callable by a logged-in staff session.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const viaCron = secret && auth === `Bearer ${secret}`;
  const session = getSession();
  const viaStaff = session && session.role !== "TENANT" && session.role !== "VIEWER";
  if (!viaCron && !viaStaff) return new Response("Unauthorized", { status: 401 });

  const result = await generateChargesForPeriod();
  return Response.json(result);
}
