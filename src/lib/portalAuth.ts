import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";
import { hashPortalPassword, verifyPortalPassword } from "@/lib/portalPassword";

export const portalCookie = "ache_portal_session";
export const portalSessionSeconds = 8 * 60 * 60;
const temporarySessionSeconds = 15 * 60;
let pool: Pool | undefined;

function database() {
  const connectionString = process.env.PORTAL_DATABASE_URL;
  if (!connectionString) throw new Error("Banco de acesso indisponível.");
  if (!pool) {
    pool = new Pool({ connectionString, max: 4, connectionTimeoutMillis: 5000 });
    attachDatabasePool(pool);
  }
  return pool;
}

type PortalSession = { email: string; must_change_password: boolean; credential_version: number };

function tokenHash(token: string | undefined) {
  return token && /^[A-Za-z0-9_-]{43}$/.test(token)
    ? createHash("sha256").update(token).digest("hex")
    : null;
}

export async function readPortalSession(token: string | undefined) {
  const hash = tokenHash(token);
  if (!hash) return null;
  const { rows } = await database().query<PortalSession>(
    `SELECT u.email, u.must_change_password, u.credential_version
     FROM portal_sessions s JOIN portal_users u USING (email)
     WHERE s.token_hash = $1 AND s.credential_version = u.credential_version AND s.expires_at > now()`,
    [hash],
  );
  return rows[0] ?? null;
}

export async function currentPortalSession() {
  return readPortalSession((await cookies()).get(portalCookie)?.value);
}

async function reserveAttempt(email: string) {
  const { rows } = await database().query<{ password_hash: string; credential_version: number }>(
    `UPDATE portal_users
     SET attempts = CASE WHEN attempts_until <= now() THEN 1 ELSE attempts + 1 END,
         attempts_until = CASE WHEN attempts_until <= now() THEN now() + interval '15 minutes' ELSE attempts_until END
     WHERE email = $1 AND (attempts_until <= now() OR attempts < 6)
     RETURNING password_hash, credential_version`,
    [email],
  );
  return rows[0];
}

export async function signInPortal(email: string, password: string) {
  const account = await reserveAttempt(email);
  if (!account || !await verifyPortalPassword(password, account.password_hash)) return null;

  const token = randomBytes(32).toString("base64url");
  const { rows } = await database().query<{ must_change_password: boolean }>(
    `WITH account AS (
      UPDATE portal_users SET attempts = 0, attempts_until = '-infinity'
      WHERE email = $1 AND credential_version = $2
      RETURNING email, credential_version, must_change_password
    ), cleanup AS (
      DELETE FROM portal_sessions WHERE email = $1 AND expires_at <= now()
    ), created AS (
      INSERT INTO portal_sessions (token_hash, email, credential_version, expires_at)
      SELECT $3, email, credential_version, now() + make_interval(secs =>
        CASE WHEN must_change_password THEN $4::int ELSE $5::int END)
      FROM account RETURNING email
    )
    SELECT must_change_password FROM account JOIN created USING (email)`,
    [email, account.credential_version, tokenHash(token), temporarySessionSeconds, portalSessionSeconds],
  );

  if (!rows[0]) return null;
  return { token, mustChange: rows[0].must_change_password };
}

export async function changePortalPassword(session: PortalSession, current: string, next: string) {
  const account = await reserveAttempt(session.email);
  if (!account || account.credential_version !== session.credential_version) return "unauthorized";
  if (!session.must_change_password && !await verifyPortalPassword(current, account.password_hash)) return "incorrect";
  if (await verifyPortalPassword(next, account.password_hash)) return "reuse";

  const nextHash = await hashPortalPassword(next);
  const token = randomBytes(32).toString("base64url");
  const result = await database().query(
    `WITH changed AS (
       UPDATE portal_users
       SET password_hash = $3, must_change_password = false, credential_version = credential_version + 1,
           attempts = 0, attempts_until = '-infinity'
       WHERE email = $1 AND credential_version = $2
       RETURNING email, credential_version
     ), revoked AS (
       DELETE FROM portal_sessions WHERE email = $1
       AND EXISTS (SELECT 1 FROM changed)
     )
     INSERT INTO portal_sessions (token_hash, email, credential_version, expires_at)
     SELECT $4, email, credential_version, now() + make_interval(secs => $5::int)
     FROM changed`,
    [session.email, session.credential_version, nextHash, tokenHash(token), portalSessionSeconds],
  );
  return result.rowCount === 1 ? { token } : "unauthorized";
}

export async function signOutPortal(token: string | undefined) {
  const hash = tokenHash(token);
  if (hash) await database().query("DELETE FROM portal_sessions WHERE token_hash = $1", [hash]);
}
