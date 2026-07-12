import { getSiteUrl } from "@/lib/whatsapp";

export type InvoiceKind = "retail" | "bridal";

type TokenPayload = {
  kind: InvoiceKind;
  id: string;
  exp: number;
};

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

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export async function signInvoiceToken(kind: InvoiceKind, id: string): Promise<string> {
  const payload: TokenPayload = {
    kind,
    id,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const body = stringToBase64Url(JSON.stringify(payload));
  const sig = await hmacSign(getSecret(), body);
  return `${body}.${sig}`;
}

export async function verifyInvoiceToken(
  token: string,
  kind: InvoiceKind,
  id: string
): Promise<boolean> {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  try {
    const valid = await hmacVerify(getSecret(), body, sig);
    if (!valid) return false;
    const payload = JSON.parse(base64UrlToString(body)) as TokenPayload;
    if (payload.kind !== kind || payload.id !== id) return false;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

export async function buildInvoiceShareUrl(kind: InvoiceKind, id: string): Promise<string> {
  const token = await signInvoiceToken(kind, id);
  const base = getSiteUrl().replace(/\/$/, "");
  return `${base}/api/invoices/${kind}/${id}?t=${encodeURIComponent(token)}`;
}
