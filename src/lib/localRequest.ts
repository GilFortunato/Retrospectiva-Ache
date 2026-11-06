import { headers } from "next/headers";

export async function isLocalDevelopmentRequest() {
  if (process.env.NODE_ENV !== "development") return false;
  const request = await headers();
  const host = request.get("host") ?? "";
  const addresses = request.get("x-forwarded-for")?.split(",") ?? [];
  const loopback = /^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i;
  return loopback.test(host) && addresses.every(address => ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(address.trim()));
}
