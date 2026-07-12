import { buildDigestHtml } from "@/lib/digest";

// Preview of the weekly email digest. A scheduled job (Vercel Cron / Inngest)
// will later POST this HTML to Resend/Postmark once an API key is configured.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") === "en" ? "en" : "nl";
  const html = await buildDigestHtml(locale);
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
