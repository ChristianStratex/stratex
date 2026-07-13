import { NextResponse, type NextRequest } from "next/server";
import { verifySessionTokenEdge } from "@/lib/session-edge";

// Public paths bypass the session gate. The cron/digest endpoints authenticate
// themselves (CRON_SECRET or an in-handler staff-session check), so they must
// not be redirected to /login by the middleware before their handler runs.
const PUBLIC_PATHS = ["/login", "/api/locale", "/api/cron", "/api/digest"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const token = request.cookies.get("stratex_session")?.value;
  const secret = process.env.AUTH_SECRET || "stratex-dev-secret-change-me";
  const session = await verifySessionTokenEdge(token, secret);

  if (session) {
    // Tenants only get their own portal (plus locale switching, handled above).
    if (session.role === "TENANT" && !pathname.startsWith("/portal")) {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
    // Staff have no business on the tenant portal.
    if (session.role !== "TENANT" && pathname.startsWith("/portal")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  const login = new URL("/login", request.url);
  if (pathname !== "/") login.searchParams.set("from", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  // Everything except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
