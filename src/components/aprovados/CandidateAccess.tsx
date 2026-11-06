"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import dashboard from "@/components/bi/DemographicDashboard.module.css";
import styles from "./ApprovalPanel.module.css";

export default function CandidateAccess() {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function openPanel(key: string) {
    setStatus("loading");
    try {
      const response = await fetch("/api/candidatos/acesso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (response.ok) {
        window.location.reload();
        return;
      }
    } catch {
      // The same access form can retry a failed request.
    }
    setStatus("error");
  }

  useEffect(() => {
    const key = new URLSearchParams(window.location.hash.slice(1)).get("acesso");
    if (key) {
      window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
      void openPanel(key);
    }
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const key = String(new FormData(event.currentTarget).get("key") ?? "").trim();
    void openPanel(key);
  }

  return (
    <div className={dashboard.dashboard}>
      <main className={dashboard.main}>
        <header className={dashboard.pageHeader}>
          <div>
            <span className={dashboard.kicker}>PROGRAMA DE INCLUSÃO PcD ACHÉ</span>
            <h1>Candidatos<span>.</span></h1>
            <p>Use o link privado da equipe ou informe a chave de acesso às fichas.</p>
          </div>
        </header>
        <section className={dashboard.card}>
          <form onSubmit={submit} className={styles.candidateActions}>
            <label className={styles.classFilter}>Chave de acesso
              <input name="key" type="password" autoComplete="off" maxLength={128} required />
            </label>
            <button className={styles.uploadButton} disabled={status === "loading"} type="submit">
              {status === "loading" ? "Abrindo painel…" : "Abrir painel"}
            </button>
          </form>
          {status === "error" ? <p role="alert">Não foi possível abrir o painel. Confira a chave e tente novamente.</p> : null}
        </section>
        <Link href="/home">Voltar ao Nexus</Link>
      </main>
    </div>
  );
}
