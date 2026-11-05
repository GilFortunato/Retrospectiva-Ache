"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    void fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (data.authenticated) window.location.replace("/admin");
        setAvailable(Boolean(data.configured));
      }).catch(() => setMessage("Não foi possível verificar o servidor."));
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Não foi possível entrar.");
      setPassword("");
      window.location.replace("/admin");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao entrar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="adminLoginScreen">
      <section className="adminLoginPanel">
        <Link href="/home" className="adminLoginBack">← Voltar ao Nexus</Link>
        <span className="adminLoginEyebrow">Aché · Área administrativa</span>
        <h1>Acesso restrito</h1>
        <p>Gerencie as integrações com Apify e Gemini. As chaves não ficam visíveis para participantes nem são devolvidas ao navegador.</p>
        <form onSubmit={submit}>
          <label htmlFor="ache-admin-password">Senha de administração</label>
          <input id="ache-admin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} maxLength={256} />
          <button type="submit" disabled={pending || !password || !available}>{pending ? "Verificando..." : "Entrar no ADM"}</button>
        </form>
        {!available ? <p className="adminLoginMessage" role="alert">A autenticação administrativa ainda não foi habilitada no servidor.</p> : null}
        {message ? <p className="adminLoginMessage" role="alert">{message}</p> : null}
      </section>
    </main>
  );
}
