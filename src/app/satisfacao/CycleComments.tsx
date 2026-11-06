"use client";

import { useId, useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
import type { SurveyCommentGroup } from "./localComments";
import styles from "./satisfaction.module.css";

export default function CycleComments({ cycle, count }: { cycle: number; count: number }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<SurveyCommentGroup[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/satisfacao/${cycle}/comentarios`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setGroups(data.groups);
    } catch (error) {
      setError(error instanceof Error && error.message ? error.message : "Não foi possível carregar os comentários.");
    } finally {
      setLoading(false);
    }
  }

  function toggle() {
    setOpen(!open);
    if (!open && !groups && !loading) void load();
  }

  return (
    <div className={styles.allComments}>
      <button className={styles.commentsButton} type="button" onClick={toggle} aria-expanded={open} aria-controls={id}>
        <MessageCircle size={17} aria-hidden="true" />
        {open ? "Fechar comentários" : `Ver todos os comentários (${count})`}
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      <div id={id} hidden={!open}>
        {loading ? <p role="status">Carregando os comentários…</p> : null}
        {error ? <div className={styles.commentError}>
          <p role="alert">{error}</p>
          <button type="button" onClick={() => void load()}>Tentar novamente</button>
        </div> : null}
        {groups ? <div className={styles.commentScroll} role="region" tabIndex={0} aria-label={`Comentários do ciclo ${cycle}`}>
          {groups.filter(group => group.comments.length).map(group => (
            <section key={group.label} className={styles.commentGroup}>
              <h4>{group.label} <small>{group.comments.length}</small></h4>
              <ul>{group.comments.map((comment, index) => <li key={index}>{comment}</li>)}</ul>
            </section>
          ))}
        </div> : null}
      </div>
    </div>
  );
}
