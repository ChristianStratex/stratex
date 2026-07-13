import { buildDigestHtml } from "@/lib/digest";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

// Preview of the weekly email digest. A scheduled job (Vercel Cron / Inngest)
// will later POST this HTML to Resend/Postmark once an API key is configured.
// Auth: a scheduler via CRON_SECRET, or a logged-in staff (non-tenant) session.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = process.env.CRON_SECRET;
  const viaCron = secret && request.headers.get("authorization") === `Bearer ${secret}`;
  const session = getSession();
  const viaStaff = session && session.role !== "TENANT";
  if (!viaCron && !viaStaff) return new Response("Unauthorized", { status: 401 });

  const locale = searchParams.get("locale") === "en" ? "en" : "nl";
  const html = await buildDigestHtml(locale);
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
