import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const options = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };

function derive(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, options, (error, digest) => error ? reject(error) : resolve(digest));
  });
}

export async function hashPortalPassword(password: string) {
  const salt = randomBytes(16);
  const digest = await derive(password, salt);
  return `scrypt$${salt.toString("base64url")}$${digest.toString("base64url")}`;
}

export async function verifyPortalPassword(password: string, hash: string) {
  const [algorithm, salt, digest, extra] = hash.split("$");
  if (algorithm !== "scrypt" || !salt || !digest || extra !== undefined) return false;
  const expected = Buffer.from(digest, "base64url");
  if (expected.length !== 64) return false;
  return timingSafeEqual(await derive(password, Buffer.from(salt, "base64url")), expected);
}
