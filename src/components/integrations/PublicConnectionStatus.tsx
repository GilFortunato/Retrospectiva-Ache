"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, CircleHelp, RefreshCcw } from "lucide-react";

type Provider = "manus" | "gemini";
type Connection = {
  status: "connected" | "disconnected" | "not_configured";
  message: string;
  checkedAt: string;
};
type HealthResponse = { providers: Record<Provider, Connection> };

const services: { id: Provider; name: string }[] = [
  { id: "manus", name: "Pesquisa (Manus)" },
  { id: "gemini", name: "Inteligência artificial (Gemini)" },
];

function ConnectionBadge({ status }: { status: Connection["status"] | "checking" | "unknown" }) {
  const label = status === "connected" ? "Online"
    : status === "disconnected" ? "Offline"
    : status === "not_configured" ? "Não configurada"
    : status === "checking" ? "Verificando..." : "Aguardando";
  const Icon = status === "connected" ? CheckCircle2 : status === "disconnected" ? AlertCircle : CircleHelp;

  return (
    <span className={"achePublicConnectionBadge achePublicConnection-" + status} role="status">
      <Icon size={15} aria-hidden="true" />
      {label}
    </span>
  );
}

export function PublicConnectionStatus({ compact = false, showReconnect = true }: { compact?: boolean; showReconnect?: boolean }) {
  const [health, setHealth] = useState<Record<Provider, Connection | null>>({ manus: null, gemini: null });
  const [loading, setLoading] = useState<Record<Provider, boolean>>({ manus: false, gemini: false });
  const [error, setError] = useState("");

  async function reconnect(provider?: Provider) {
    setError("");
    const providers: Provider[] = provider ? [provider] : ["manus", "gemini"];
    setLoading((previous) => ({ ...previous, ...Object.fromEntries(providers.map((id) => [id, true])) }));

    try {
      // Provider health is checked server-side and cached for 30 seconds.
      // Users never receive API credentials or gain access to their management.
      const response = await fetch("/api/integrations/health", { cache: "no-store" });
      const result = await response.json() as HealthResponse & { error?: string };
      if (!response.ok || !result.providers?.manus || !result.providers?.gemini) {
        throw new Error(result.error || "Não foi possível verificar as conexões.");
      }
      setHealth((previous) => provider
        ? { ...previous, [provider]: result.providers[provider] }
        : result.providers);
    } catch {
      setError("Não foi possível verificar as conexões agora. Tente novamente mais tarde.");
      setHealth((previous) => ({
        ...previous,
        ...Object.fromEntries(providers.map((id) => [id, {
          status: "disconnected",
          message: "Status temporariamente indisponível.",
          checkedAt: new Date().toISOString(),
        }])),
      }));
    } finally {
      setLoading((previous) => ({ ...previous, ...Object.fromEntries(providers.map((id) => [id, false])) }));
    }
  }

  useEffect(() => {
    void reconnect();
    // Check automatically only on first display.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isBusy = loading.manus || loading.gemini;

  return (
    <section className={"achePublicConnections achePublicConnectionsSlim" + (compact ? " achePublicConnectionsCompact" : "")} aria-label="Status das conexões do programa">
      <div className="achePublicConnectionsHeader">
        <h2>Conexões do programa</h2>
        {showReconnect && (
          <button type="button" className="achePublicReconnectAll" disabled={isBusy} onClick={() => void reconnect()}>
            <RefreshCcw size={15} className={isBusy ? "achePublicSpin" : undefined} aria-hidden="true" />
            {isBusy ? "Verificando..." : "Reconectar todos"}
          </button>
        )}
      </div>

      <div className="achePublicConnectionsGrid">
        {services.map((service) => {
          const current = health[service.id];
          const pending = loading[service.id];
          return (
            <article className="achePublicConnectionCard achePublicConnectionCardSimple" key={service.id}>
              <h3>{service.name}</h3>
              <div className="achePublicConnectionControls">
                <ConnectionBadge status={pending ? "checking" : (current?.status || "unknown")} />
                {showReconnect && (
                  <button
                    type="button"
                    className="achePublicReconnectButton"
                    disabled={isBusy}
                    onClick={() => void reconnect(service.id)}
                    aria-label={"Reconectar " + service.name}
                  >
                    <RefreshCcw size={14} className={pending ? "achePublicSpin" : undefined} aria-hidden="true" />
                    Reconectar
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {error && <p className="achePublicConnectionError" role="alert">{error}</p>}
    </section>
  );
}
