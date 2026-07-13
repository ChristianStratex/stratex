// Signed session cookie: base64url(payload-json) + "." + base64url(hmac-sha256).
// Server-side (node runtime): sync sign/verify via node:crypto.
// The middleware (edge runtime) uses the WebCrypto twin in session-edge.ts.
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { Role } from "./rbac-shared";

export const SESSION_COOKIE = "stratex_session";
export const SESSION_TTL_S = 60 * 60 * 24 * 14; // 14 days

export interface SessionPayload {
  uid: string;
  name: string;
  role: Role;
  exp: number; // unix seconds
}

export function sessionSecret(): string {
  // Demo fallback keeps the app runnable without configuration; production
  // deployments must set AUTH_SECRET.
  return process.env.AUTH_SECRET || "stratex-dev-secret-change-me";
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

export function signSession(payload: SessionPayload, secret = sessionSecret()): string {
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  const mac = createHmac("sha256", secret).update(body).digest();
  return `${body}.${b64url(mac)}`;
}

export function verifySessionToken(token: string | undefined, secret = sessionSecret()): SessionPayload | null {
  if (!token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", secret).update(body).digest();
  let given: Buffer;
  try {
    given = Buffer.from(mac, "base64url");
  } catch {
    return null;
  }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (!payload.uid || !payload.exp || payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Read + verify the session from the request cookies (server components/actions). */
export function getSession(): SessionPayload | null {
  return verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
}
