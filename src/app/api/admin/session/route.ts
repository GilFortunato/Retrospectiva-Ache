import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, adminReady, adminSession, allowLogin, issueSession, validOrigin, verifyPassword } from "@/lib/acheAdminAuth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  const authenticated = await adminSession();
  return NextResponse.json({ authenticated, configured: adminReady() }, { headers: noStore });
}

export async function POST(request: NextRequest) {
  if (!validOrigin(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  if (!adminReady()) return NextResponse.json({ error: "Credenciais ADM ainda não configuradas." }, { status: 503 });
  if (!allowLogin(request)) return NextResponse.json({ error: "Muitas tentativas. Tente novamente em 15 minutos." }, { status: 429 });
  const data = await request.json().catch(() => null);
  if (!verifyPassword(data?.password)) {
    return NextResponse.json({ error: "Senha administrativa incorreta." }, { status: 401, headers: noStore });
  }
  const session = issueSession();
  const response = NextResponse.json({ authenticated: true }, { headers: noStore });
  response.cookies.set(ADMIN_COOKIE, session.value, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: session.maxAge,
  });
  return response;
}

export async function DELETE(request: NextRequest) {
  if (!validOrigin(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  const response = NextResponse.json({ authenticated: false }, { headers: noStore });
  response.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
  return response;
}
