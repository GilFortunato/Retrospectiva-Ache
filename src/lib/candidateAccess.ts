import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const candidateCookie = "ache_candidate_session";
export const candidateSessionSeconds = 8 * 60 * 60;

function sign(expires: string, key: string) {
  return createHmac("sha256", key).update(`candidatos:${expires}`).digest("base64url");
}

export function issueCandidateSession(submitted: unknown) {
  const key = process.env.CANDIDATOS_ACCESS_KEY;
  if (!key || typeof submitted !== "string" || submitted.length !== key.length) return null;
  const hash = (value: string) => createHash("sha256").update(value).digest();
  if (!timingSafeEqual(hash(submitted), hash(key))) return null;
  const expires = String(Date.now() + candidateSessionSeconds * 1000);
  return `${expires}.${sign(expires, key)}`;
}

export async function hasCandidateSession() {
  const key = process.env.CANDIDATOS_ACCESS_KEY;
  const value = (await cookies()).get(candidateCookie)?.value;
  if (!key || !value) return false;
  const [expires, signature, extra] = value.split(".");
  if (!/^\d{13}$/.test(expires) || Number(expires) <= Date.now() || !signature || extra !== undefined) return false;
  const actual = Buffer.from(signature);
  const expected = Buffer.from(sign(expires, key));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
