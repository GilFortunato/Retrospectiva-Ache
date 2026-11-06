import { NextResponse } from "next/server";
import { validOrigin } from "@/lib/acheAdminAuth";
import { candidateCookie, candidateSessionSeconds, issueCandidateSession } from "@/lib/candidateAccess";

export async function POST(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  if (!validOrigin(request)) return NextResponse.json({ ok: false }, { status: 403, headers });
  const body = await request.json().catch(() => null);
  const session = issueCandidateSession(body?.key);
  if (!session) return NextResponse.json({ ok: false }, { status: 401, headers });

  const response = NextResponse.json({ ok: true }, { headers });
  response.cookies.set(candidateCookie, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/candidatos",
    maxAge: candidateSessionSeconds,
  });
  return response;
}
