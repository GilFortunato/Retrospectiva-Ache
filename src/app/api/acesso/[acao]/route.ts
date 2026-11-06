import { NextResponse, type NextRequest } from "next/server";
import { validOrigin } from "@/lib/acheAdminAuth";
import { changePortalPassword, portalCookie, portalSessionSeconds, readPortalSession, signInPortal, signOutPortal } from "@/lib/portalAuth";

const headers = { "Cache-Control": "private, no-store" };

function fail(message: string, status: number) {
  return NextResponse.json({ message }, { status, headers });
}

function signedIn(token: string, mustChange = false) {
  const response = NextResponse.json({ next: mustChange ? "/trocar-senha" : "/home" }, { headers });
  response.cookies.set(portalCookie, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/",
    maxAge: mustChange ? 15 * 60 : portalSessionSeconds,
  });
  return response;
}

function validPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 1 && value.length <= 128;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ acao: string }> }) {
  if (!validOrigin(request)) return fail("Origem da solicitação inválida.", 403);
  const { acao } = await params;
  const token = request.cookies.get(portalCookie)?.value;
  try {
    if (acao === "sair") {
      await signOutPortal(token);
      const response = NextResponse.redirect(new URL("/login", request.url), { status: 303, headers });
      response.cookies.delete(portalCookie);
      return response;
    }
    if (acao !== "entrar" && acao !== "senha") return fail("Página indisponível.", 404);
    const raw = await request.text();
    if (raw.length > 4096) return fail("Solicitação inválida.", 413);
    const input = JSON.parse(raw);
    if (acao === "entrar") {
      const email = typeof input?.email === "string" ? input.email.trim().toLowerCase() : "";
      if (!email || email.length > 254 || !validPassword(input?.password)) return fail("Informe o e-mail e a senha.", 400);
      const session = await signInPortal(email, input.password);
      if (!session) return fail("E-mail ou senha inválidos. Se excedeu o limite de tentativas, aguarde 15 minutos.", 401);
      return signedIn(session.token, session.mustChange);
    }

    const session = await readPortalSession(token);
    if (!session) return fail("Sua sessão expirou. Entre novamente.", 401);
    const next = input?.next;
    if (!validPassword(next) || next.length < 12 || next !== input?.confirmation) {
      return fail("A nova senha precisa ter pelo menos 12 caracteres e coincidir com a confirmação.", 400);
    }
    const current = input?.current;
    if (!session.must_change_password && !validPassword(current)) return fail("Informe a senha atual.", 400);
    const result = await changePortalPassword(session, current ?? "", next);
    if (result === "incorrect") return fail("Senha atual incorreta.", 400);
    if (result === "reuse") return fail("Escolha uma senha diferente da atual.", 400);
    if (result === "unauthorized") return fail("Entre novamente. Se excedeu o limite de tentativas, aguarde 15 minutos.", 401);
    return signedIn(result.token);
  } catch (error) {
    if (error instanceof SyntaxError) return fail("Solicitação inválida.", 400);
    return fail("O acesso está temporariamente indisponível. Tente novamente.", 503);
  }
}
