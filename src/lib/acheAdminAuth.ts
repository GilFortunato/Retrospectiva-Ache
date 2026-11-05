import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const ADMIN_COOKIE = "ache_admin_session";
const SESSION_MS = 8 * 60 * 60 * 1000;
const attempts = new Map<string, { count: number; until: number }>();

export function adminReady() {
  return Boolean(
    process.env.ACHE_ADMIN_PASSWORD_HASH?.startsWith("scrypt$")
    && (process.env.ACHE_ADMIN_SESSION_SECRET?.length ?? 0) >= 32,
  );
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifyPassword(password: unknown) {
  if (!adminReady() || typeof password !== "string" || password.length > 256) return false;
  const parts = process.env.ACHE_ADMIN_PASSWORD_HASH!.split("$");
  if (parts.length !== 3) return false;
  try {
    const salt = Buffer.from(parts[1], "base64url");
    const digest = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
    return safeEqual(digest.toString("base64url"), parts[2]);
  } catch {
    return false;
  }
}

function signature(payload: string) {
  const secret = process.env.ACHE_ADMIN_SESSION_SECRET;
  if (!secret || !adminReady()) return "";
  return createHmac("sha256", secret)
    .update(payload + ":" + process.env.ACHE_ADMIN_PASSWORD_HASH)
    .digest("base64url");
}

export function issueSession() {
  const expires = Date.now() + SESSION_MS;
  const payload = expires + "." + randomBytes(20).toString("base64url");
  return { value: payload + "." + signature(payload), maxAge: SESSION_MS / 1000 };
}

export function isSessionValid(value: string | undefined) {
  if (!value || !adminReady()) return false;
  const [expiry, nonce, mac, extra] = value.split(".");
  if (!expiry || !nonce || !mac || extra) return false;
  const expires = Number(expiry);
  if (!Number.isSafeInteger(expires) || expires < Date.now() || expires > Date.now() + SESSION_MS) return false;
  return safeEqual(mac, signature(expiry + "." + nonce));
}

export async function adminSession() {
  const store = await cookies();
  return isSessionValid(store.get(ADMIN_COOKIE)?.value);
}

export function validOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const incoming = new URL(request.url);
    const submitted = new URL(origin);
    return submitted.protocol === "https:" || submitted.hostname === "localhost"
      ? submitted.origin === incoming.origin : false;
  } catch {
    return false;
  }
}

export function allowLogin(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  // Best-effort per-instance backoff; deployments should also enable WAF rate limiting.
  const key = createHmac("sha256", process.env.ACHE_ADMIN_SESSION_SECRET || "no-secret").update(ip).digest("hex");
  const now = Date.now();
  const entry = attempts.get(key);
  if (entry && entry.until > now && entry.count >= 6) return false;
  if (!entry || entry.until <= now) attempts.set(key, { count: 1, until: now + 15 * 60 * 1000 });
  else attempts.set(key, { count: entry.count + 1, until: entry.until });
  if (attempts.size > 4000) attempts.clear();
  return true;
}
