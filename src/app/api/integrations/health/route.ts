import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { reconnectAllProviders } from "@/lib/acheVercelSecrets";

// This endpoint is public by design. The server tests the Aché project's
// shared integrations, not credentials belonging to individual participants.
// Only safe, generic status is sent to the browser; API tokens never leave the server.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const checkSharedProviders = unstable_cache(
  async () => {
    const checks = await reconnectAllProviders();
    const summarize = (provider: "manus" | "gemini") => ({
      status: checks[provider].status,
      checkedAt: checks[provider].checkedAt,
      message: checks[provider].status === "connected"
        ? "Conexão ativa com o serviço."
        : checks[provider].status === "not_configured"
          ? "Integração ainda não configurada. Entre em contato com a equipe do programa."
          : "Não foi possível confirmar a conexão. Tente novamente ou avise a equipe do programa.",
    });
    return {
      manus: summarize("manus"),
      gemini: summarize("gemini"),
    };
  },
  ["ache-public-provider-health-v1"],
  { revalidate: 30 },
);

export async function GET() {
  try {
    const providers = await checkSharedProviders();
    return NextResponse.json(
      {
        providers,
        shared: true,
        refreshSeconds: 30,
        description: "Verificação das integrações compartilhadas do Aché, não do login pessoal.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Não foi possível consultar o status das integrações neste momento." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
