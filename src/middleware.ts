import { NextResponse, type NextRequest } from "next/server";
import { verifySessionTokenEdge } from "@/lib/session-edge";

const PUBLIC_PATHS = ["/login", "/api/locale"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const token = request.cookies.get("stratex_session")?.value;
  const secret = process.env.AUTH_SECRET || "stratex-dev-secret-change-me";
  if (await verifySessionTokenEdge(token, secret)) return NextResponse.next();

  const login = new URL("/login", request.url);
  if (pathname !== "/") login.searchParams.set("from", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  // Everything except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
