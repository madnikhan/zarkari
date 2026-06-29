import type { SessionUser } from "./session";

function getSecret(): string {
  return process.env.SESSION_SECRET?.trim() || "zarkari-dev-session-secret-change-in-production";
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(b64: string): Uint8Array {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = b64.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function stringToBase64Url(str: string): string {
  return bytesToBase64Url(new TextEncoder().encode(str));
}

function base64UrlToString(b64: string): string {
  return new TextDecoder().decode(base64UrlToBytes(b64));
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function hmacSign(secret: string, message: string): Promise<string> {
  const key = await getHmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return bytesToBase64Url(new Uint8Array(sig));
}

async function hmacVerify(secret: string, message: string, signatureB64: string): Promise<boolean> {
  const key = await getHmacKey(secret);
  return crypto.subtle.verify(
    "HMAC",
    key,
    new Uint8Array(base64UrlToBytes(signatureB64)),
    new TextEncoder().encode(message)
  );
}

export async function signSession(user: SessionUser): Promise<string> {
  const payload = stringToBase64Url(JSON.stringify(user));
  const sig = await hmacSign(getSecret(), payload);
  return `${payload}.${sig}`;
}

export async function verifySignedSession(token: string): Promise<SessionUser | null> {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  try {
    const valid = await hmacVerify(getSecret(), payload, sig);
    if (!valid) return null;
    return JSON.parse(base64UrlToString(payload)) as SessionUser;
  } catch {
    return null;
  }
}

export function parseLegacySession(token: string): SessionUser | null {
  try {
    return JSON.parse(token) as SessionUser;
  } catch {
    return null;
  }
}

export async function parseSessionCookie(raw: string): Promise<SessionUser | null> {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) return parseLegacySession(trimmed);
  return verifySignedSession(trimmed);
}
