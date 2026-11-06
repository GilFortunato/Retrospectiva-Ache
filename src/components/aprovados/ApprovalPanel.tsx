"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type ChangeEvent } from "react";
import { ArrowLeft, Award, ChartNoAxesCombined, ClipboardList, FileSpreadsheet, Flag, MessageCircle, ShieldCheck, Star, Upload, UsersRound, type LucideIcon } from "lucide-react";
import type { ClassDiary, ClassId, ClassPerformance, PerformanceField } from "@/lib/classDiary";
import dashboard from "@/components/bi/DemographicDashboard.module.css";
import styles from "./ApprovalPanel.module.css";

const classIds: ClassId[] = ["A", "B", "C"];
const emptyPerformance: ClassPerformance = {
  finalGrade: { sum: 0, count: 0 },
  attendance: { sum: 0, count: 0 },
  highlightWeeks: { sum: 0, count: 0 },
  communication: { sum: 0, count: 0 },
  initiative: { sum: 0, count: 0 },
  collaboration: { sum: 0, count: 0 },
};

// Aggregate values from the supplied diaries. Individual records are read in the browser.
const initialDiaries: Record<ClassId, ClassDiary> = {
  A: { total: 33, pending: 33, performance: { ...emptyPerformance, attendance: { sum: 2772, count: 33 } }, participants: [], approved: [] },
  B: { total: 32, pending: 32, performance: { ...emptyPerformance, attendance: { sum: 2522, count: 32 } }, participants: [], approved: [] },
  C: {
    total: 29,
    pending: 29,
    performance: {
      finalGrade: { sum: 251.3, count: 29 },
      attendance: { sum: 2418, count: 29 },
      highlightWeeks: { sum: 56, count: 29 },
      communication: { sum: 72.2, count: 29 },
      initiative: { sum: 68.6, count: 29 },
      collaboration: { sum: 73.8, count: 29 },
    },
    participants: [],
    approved: [],
  },
};

const metrics: { field: PerformanceField; label: string; caption: string; icon: LucideIcon; showSum?: boolean }[] = [
  { field: "finalGrade", label: "Média final", caption: "Média das notas da turma", icon: Award },
  { field: "highlightWeeks", label: "Semanas em destaque", caption: "Soma dos destaques individuais", icon: Star },
  { field: "communication", label: "Comunicação", caption: "Média da competência", icon: MessageCircle, showSum: true },
  { field: "initiative", label: "Protagonismo", caption: "Média da competência", icon: Flag, showSum: true },
  { field: "collaboration", label: "Colaboração", caption: "Média da competência", icon: UsersRound, showSum: true },
];

const numberFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

function formatMetric(value: number | null) {
  return value === null ? "—" : numberFormat.format(value);
}

type LoadedDiary = { filename: string; results: ClassDiary };
type Feedback = { classId: ClassId; message: string; error: boolean };

export default function ApprovalPanel() {
  const [selectedClass, setSelectedClass] = useState<ClassId>("C");
  const [loaded, setLoaded] = useState<Partial<Record<ClassId, LoadedDiary>>>({});
  const [reading, setReading] = useState<ClassId | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const current = loaded[selectedClass];
  const diary = current?.results ?? initialDiaries[selectedClass];
  const hasResults = diary.pending < diary.total;

  async function loadDiary(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file || reading) return;

    const classId = selectedClass;
    if (!/\.xls[xm]$/i.test(file.name) || file.size > 8 * 1024 * 1024) {
      setFeedback({ classId, message: "Selecione um arquivo XLSX ou XLSM de até 8 MB.", error: true });
      return;
    }

    setReading(classId);
    setFeedback(null);
    try {
      const { parseClassDiary } = await import("@/lib/classDiary");
      const results = parseClassDiary(new Uint8Array(await file.arrayBuffer()), classId);
      setLoaded(previous => ({ ...previous, [classId]: { filename: file.name, results } }));
      setFeedback({ classId, message: `Diário da Turma ${classId} atualizado.`, error: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível abrir o diário de classe.";
      setFeedback({ classId, message, error: true });
    } finally {
      setReading(null);
    }
  }

  return (
    <div className={dashboard.dashboard}>
      <a className={dashboard.skipLink} href="#resultados">Pular para os resultados</a>
      <aside className={dashboard.sidebar} aria-label="Navegação da retrospectiva">
        <Link href="/home" className={dashboard.logoLink} aria-label="Aché - voltar ao Nexus">
          <Image src="/brand/ache-logo-tagline.webp" alt="Aché" width={115} height={69} priority />
        </Link>
        <div className={dashboard.sidebarProgram}>
          <span>PROGRAMA DE INCLUSÃO PcD</span>
          <strong>Propagandista<br />Trainee</strong>
          <span className={dashboard.edition}>RETROSPECTIVA 2026</span>
        </div>
        <span className={dashboard.navTitle}>EXPLORAR O PAINEL</span>
        <nav>
          <Link href="/bi"><ChartNoAxesCombined size={18} aria-hidden="true" />BI demográfico</Link>
          <Link href="/aprovados" className={dashboard.navActive} aria-current="page">
            <Award size={18} aria-hidden="true" />Aprovados<span className={dashboard.navDot} />
          </Link>
        </nav>
        <div className={dashboard.sidebarBottom}>
          <ShieldCheck size={20} aria-hidden="true" />
          <strong>Consulta dos diários</strong>
          <p>Os arquivos selecionados são lidos no seu navegador.</p>
          <Link href="/home"><ArrowLeft size={16} aria-hidden="true" />Voltar ao Nexus</Link>
        </div>
      </aside>

      <main className={dashboard.main} id="resultados">
        <div className={dashboard.topbar}>
          <span><Link href="/home">Retrospectiva</Link><span>/</span><strong>Aprovados</strong></span>
          <span className={dashboard.topbarRight}><FileSpreadsheet size={15} aria-hidden="true" />DIÁRIOS DE CLASSE</span>
        </div>
        <header className={dashboard.pageHeader}>
          <div>
            <span className={dashboard.kicker}>PROGRAMA DE INCLUSÃO PcD ACHÉ</span>
            <h1>Aprovados por turma<span>.</span></h1>
            <p>Desempenho e resultados da formação de Propagandista Trainee.</p>
          </div>
        </header>

        <div className={styles.classes} role="group" aria-label="Selecionar turma">
          {classIds.map(classId => (
            <button key={classId} type="button" aria-pressed={classId === selectedClass} onClick={() => setSelectedClass(classId)}>
              <span>Turma {classId}</span>
              <small>{loaded[classId]?.results.total ?? initialDiaries[classId].total} registros</small>
              {classId === "C" ? <span className={styles.reference}>Referência</span> : null}
            </button>
          ))}
        </div>

        <section aria-labelledby="desempenho-turma">
          <div className={styles.resultsHeader}>
            <div>
              <span className={dashboard.eyebrow}>DESEMPENHO DA TURMA</span>
              <h2 id="desempenho-turma">Destaques da Turma {selectedClass}</h2>
              <p className={styles.source}>{current ? current.filename : `Consolidado de ${diary.total} registros do diário`}</p>
            </div>
            <input ref={input} hidden type="file" accept=".xlsx,.xlsm" onChange={loadDiary} aria-label={`Diário da Turma ${selectedClass}`} />
            <button className={styles.uploadButton} type="button" disabled={reading !== null} onClick={() => input.current?.click()}>
              <Upload size={16} aria-hidden="true" />
              {reading === selectedClass ? "Lendo diário…" : current ? "Substituir diário" : "Carregar diário"}
            </button>
          </div>

          {feedback?.classId === selectedClass ? (
            <p className={feedback.error ? styles.error : styles.feedback} role={feedback.error ? "alert" : "status"}>{feedback.message}</p>
          ) : null}

          <div className={`${dashboard.kpis} ${styles.performanceGrid}`} aria-live="polite">
            {metrics.map(({ field, label, caption, icon: Icon, showSum }) => {
              const { sum, count } = diary.performance[field];
              const value = count ? (field === "highlightWeeks" ? sum : sum / count) : null;
              return (
                <article key={field} className={field === "finalGrade" && count ? dashboard.kpiPrimary : undefined}>
                  <div><span>{label}</span><Icon size={20} aria-hidden="true" /></div>
                  <strong>{formatMetric(value)}</strong>
                  <p>{showSum && count ? `Média por participante · soma ${numberFormat.format(sum)}` : caption}</p>
                </article>
              );
            })}
          </div>

          {diary.participants.length ? (
            <details key={selectedClass} className={styles.participantDetails}>
              <summary>Ver indicadores por participante</summary>
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead><tr><th scope="col">Participante</th>{metrics.map(({ field, label }) => <th key={field} scope="col">{label}</th>)}</tr></thead>
                  <tbody>{diary.participants.map((participant, index) => (
                    <tr key={`${participant.name}-${index}`}>
                      <th scope="row">{participant.name}</th>
                      {metrics.map(({ field }) => <td key={field}>{formatMetric(participant[field])}</td>)}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </details>
          ) : (
            <p className={styles.note}>Carregue o diário da turma para consultar os indicadores por participante.</p>
          )}
        </section>

        <section className={`${dashboard.card} ${styles.results}`} aria-labelledby="lista-aprovados">
          <div className={styles.resultsHeader}>
            <div>
              <span className={dashboard.eyebrow}>TURMA {selectedClass}</span>
              <h2 id="lista-aprovados">Lista de aprovados</h2>
            </div>
          </div>
          <dl className={styles.approvalStats} aria-live="polite">
            <div><dt>Registros ativos</dt><dd>{diary.total}</dd></div>
            <div><dt>Aprovados confirmados</dt><dd>{hasResults ? diary.approved.length : "—"}</dd></div>
            <div><dt>Resultados pendentes</dt><dd>{diary.pending}</dd></div>
          </dl>

          {diary.approved.length ? (
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead><tr><th scope="col">Participante</th><th scope="col">Média final</th><th scope="col">Resultado</th></tr></thead>
                <tbody>{diary.approved.map((participant, index) => (
                  <tr key={`${participant.name}-${index}`}>
                    <th scope="row">{participant.name}</th>
                    <td>{formatMetric(participant.finalGrade)}</td>
                    <td><span className={styles.approved}>Aprovação confirmada</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : (
            <div className={styles.empty}>
              <ClipboardList size={26} aria-hidden="true" />
              <h3>{hasResults ? "0 aprovações registradas" : "Resultados aguardando confirmação"}</h3>
              <p>Carregue o diário atualizado com o resultado final ou a emissão do certificado registrada para consultar a lista.</p>
            </div>
          )}
        </section>

        <footer className={dashboard.footer}>
          <span>ACHÉ + PROSPER · PROGRAMA DE INCLUSÃO PcD</span>
          <Link href="/bi">Voltar ao BI demográfico<ArrowLeft size={14} aria-hidden="true" /></Link>
        </footer>
      </main>
    </div>
  );
}
