import { NextResponse, type NextRequest } from "next/server";
import { portalCookie, readPortalSession } from "@/lib/portalAuth";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/login" || path.startsWith("/api/acesso/")
    || /^\/(?:brand|potencia)\/[^/]+\.(?:png|webp)$/.test(path)) return NextResponse.next();

  const isApi = path.startsWith("/api/") || path === "/candidatos/notas";
  let session;
  try {
    session = await readPortalSession(request.cookies.get(portalCookie)?.value);
  } catch {
    return new NextResponse("Acesso temporariamente indisponível.", { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  const mustChange = session?.must_change_password;
  if (!session || (mustChange && path !== "/trocar-senha")) {
    const headers = { "Cache-Control": "no-store" };
    if (isApi) return NextResponse.json({ message: "Acesso restrito." }, { status: session ? 403 : 401, headers });
    return NextResponse.redirect(new URL(session ? "/trocar-senha" : "/login", request.url), { headers });
  }

  return NextResponse.next({ headers: { "Cache-Control": "private, no-store" } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
