"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import styles from "./PortalAccessForm.module.css";

export default function PortalAccessForm({ change = false, firstAccess = false }: {
  change?: boolean;
  firstAccess?: boolean;
}) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(`/api/acesso/${change ? "senha" : "entrar"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message ?? "Não foi possível concluir. Tente novamente.");
        return;
      }
      window.location.replace(data.next === "/trocar-senha" ? "/trocar-senha" : "/home");
    } catch {
      setMessage("Não foi possível concluir. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="loginPage">
      <div className="organic organicOne" aria-hidden="true" />
      <div className="organic organicTwo" aria-hidden="true" />
      <div className="loginBrand">
        <Image className="acheLogoLogin" src="/brand/ache-logo-tagline.webp" alt="Aché" width={128} height={77} priority />
        <p className="eyebrow">Programa de Inclusão PcD</p>
        <h1>Retrospectiva Aché</h1>
        <p className="programSlogan brandSlogan">Mais que contratar, queremos incluir.</p>
      </div>
      <section className="loginCard" aria-labelledby="titulo-acesso">
        <h2 id="titulo-acesso">{change ? (firstAccess ? "Crie sua senha" : "Trocar senha") : "Acesse o painel"}</h2>
        <p>{change ? (firstAccess ? "Escolha sua senha pessoal para concluir o primeiro acesso." : "Informe sua senha atual e escolha uma nova.") : "Entre com o e-mail cadastrado e sua senha."}</p>
        <form className={styles.form} onSubmit={submit} method="post" action={change ? "/api/acesso/senha" : "/api/acesso/entrar"}>
          {!change ? <>
            <label>E-mail<input name="email" type="email" autoComplete="username" required maxLength={254} /></label>
            <label>Senha<input name="password" type="password" autoComplete="current-password" required maxLength={128} /></label>
          </> : <>
            {!firstAccess ? <label>Senha atual<input name="current" type="password" autoComplete="current-password" required maxLength={128} /></label> : null}
            <label>Nova senha<input name="next" type="password" autoComplete="new-password" required minLength={12} maxLength={128} aria-describedby="senha-requisito" /></label>
            <small id="senha-requisito">Use pelo menos 12 caracteres.</small>
            <label>Confirmar nova senha<input name="confirmation" type="password" autoComplete="new-password" required minLength={12} maxLength={128} /></label>
          </>}
          {message ? <p className={styles.error} role="alert">{message}</p> : null}
          <button type="submit" disabled={pending}>{pending ? "Aguarde…" : change ? "Salvar nova senha" : "Entrar"}</button>
        </form>
        {change ? <div className={styles.actions}>
          {!firstAccess ? <Link href="/home">Voltar ao painel</Link> : null}
          <form action="/api/acesso/sair" method="post"><button type="submit">Sair</button></form>
        </div> : null}
      </section>
    </main>
  );
}
