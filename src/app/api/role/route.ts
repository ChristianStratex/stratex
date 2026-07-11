import { NextResponse } from "next/server";
import { ROLE_COOKIE, type Role } from "@/lib/rbac";

const VALID: Role[] = ["OWNER", "MANAGER", "ACCOUNTANT", "ASSISTANT", "VIEWER"];

// Demo role switcher — sets the active role cookie then redirects back.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const role = searchParams.get("role") as Role;
  const back = searchParams.get("from") || "/";
  const res = NextResponse.redirect(new URL(back, origin));
  if (VALID.includes(role)) {
    res.cookies.set(ROLE_COOKIE, role, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  return res;
}
