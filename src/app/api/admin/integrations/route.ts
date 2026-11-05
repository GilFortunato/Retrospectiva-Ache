import { NextResponse } from "next/server";
import { adminSession, validOrigin } from "@/lib/acheAdminAuth";
import { integrationStatus, reconnectAllProviders, removeProviderKey, saveProviderKey, testProviderKey, type Provider, vaultConfigured } from "@/lib/acheVercelSecrets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };

function provider(value: unknown): value is Provider {
  return value === "manus" || value === "gemini";
}

export async function GET() {
  if (!await adminSession()) return NextResponse.json({ error: "Acesso ADM necessário." }, { status: 401, headers });
  try {
    return NextResponse.json(await integrationStatus(), { headers });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao consultar integrações." }, { status: 503, headers });
  }
}

export async function POST(request: Request) {
  if (!await adminSession()) return NextResponse.json({ error: "Acesso ADM necessário." }, { status: 401, headers });
  if (!validOrigin(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403, headers });

  const body = await request.json().catch(() => null);
  const action = body?.action;

  // Reconnect only checks the existing credentials. It does not create
  // tokens, rewrite keys, or depend on enabling Vercel key management.
  if (action === "reconnect_all") {
    return NextResponse.json({ providers: await reconnectAllProviders() }, { headers });
  }

  if (!provider(body?.provider)) return NextResponse.json({ error: "Provedor inválido." }, { status: 400, headers });

  if (action === "reconnect") {
    return NextResponse.json(await testProviderKey(body.provider), { headers });
  }

  const key = typeof body?.key === "string" ? body.key.trim() : "";
  if (action === "test") {
    if (key.length > 1000) return NextResponse.json({ error: "Chave muito longa." }, { status: 400, headers });
    return NextResponse.json(await testProviderKey(body.provider, key || undefined), { headers });
  }

  if (action !== "save" && action !== "remove") {
    return NextResponse.json({ error: "Ação inválida." }, { status: 400, headers });
  }

  if (!vaultConfigured()) return NextResponse.json({
    error: "Para salvar ou remover chaves neste painel, configure ACHE_VERCEL_API_TOKEN nas variáveis de produção da Vercel e faça um redeploy.",
  }, { status: 503, headers });

  try {
    if (action === "save") {
      await saveProviderKey(body.provider, key);
      return NextResponse.json({ message: "Chave atualizada. Use Reconectar para validar a conexão." }, { headers });
    }
    await removeProviderKey(body.provider);
    return NextResponse.json({ message: "Chave removida do projeto." }, { headers });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível alterar a integração." }, { status: 503, headers });
  }
}
