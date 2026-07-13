// WebCrypto twin of session.ts verification for the edge-runtime middleware.
// Same token format: base64url(payload).base64url(hmac-sha256).

function b64urlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function verifySessionTokenEdge(
  token: string | undefined,
  secret: string,
): Promise<boolean> {
  if (!token) return false;
  const [body, mac] = token.split(".");
  if (!body || !mac) return false;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      b64urlToBytes(mac) as unknown as BufferSource,
      new TextEncoder().encode(body) as unknown as BufferSource,
    );
    if (!ok) return false;
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(body)));
    return !!payload.uid && payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}
