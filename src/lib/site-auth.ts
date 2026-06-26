export const SITE_AUTH_COOKIE = "ma-site-auth";

const encoder = new TextEncoder();

export function isSiteAuthEnabled(): boolean {
  return Boolean(process.env.SITE_PASSWORD?.trim());
}

function authSecret(): string {
  return (
    process.env.SITE_AUTH_SECRET?.trim() ||
    process.env.SITE_PASSWORD?.trim() ||
    ""
  );
}

export async function expectedAuthCookieValue(): Promise<string> {
  const password = process.env.SITE_PASSWORD?.trim() ?? "";
  const secret = authSecret();
  if (!password || !secret) {
    throw new Error("SITE_PASSWORD is not configured");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(password)
  );

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function isAuthenticated(
  cookieValue: string | undefined
): Promise<boolean> {
  if (!isSiteAuthEnabled()) return true;
  if (!cookieValue) return false;

  try {
    const expected = await expectedAuthCookieValue();
    return cookieValue === expected;
  } catch {
    return false;
  }
}

export function verifySitePassword(candidate: string): boolean {
  const password = process.env.SITE_PASSWORD?.trim();
  if (!password) return false;

  const a = encoder.encode(candidate);
  const b = encoder.encode(password);
  if (a.byteLength !== b.byteLength) return false;

  let mismatch = 0;
  for (let i = 0; i < a.byteLength; i++) {
    mismatch |= a[i]! ^ b[i]!;
  }
  return mismatch === 0;
}
