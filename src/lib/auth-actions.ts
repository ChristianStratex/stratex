"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { verifyPassword } from "./password";
import { signSession, SESSION_COOKIE, SESSION_TTL_S } from "./session";
import type { Role } from "./rbac-shared";

export interface LoginState {
  error?: string;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "missing" };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return { error: "invalid" };
  }

  const token = signSession({
    uid: user.id,
    name: user.name,
    role: user.role as Role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_S,
  });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_S,
  });
  // Honour the return path the middleware captured for deep links.
  const from = String(formData.get("from") ?? "");
  const safeFrom = from.startsWith("/") && !from.startsWith("//") && !from.startsWith("/login") ? from : null;
  redirect(user.role === "TENANT" ? "/portal" : (safeFrom ?? "/"));
}

export async function logout() {
  cookies().delete(SESSION_COOKIE);
  redirect("/login");
}
