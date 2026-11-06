"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type ChangeEvent } from "react";
import { ArrowLeft, Award, ChartNoAxesCombined, ClipboardList, Clock, FileSpreadsheet, ShieldCheck, Upload, UsersRound } from "lucide-react";
import type { ClassDiary, ClassId } from "@/lib/classDiary";
import dashboard from "@/components/bi/DemographicDashboard.module.css";
import styles from "./ApprovalPanel.module.css";

const classIds: ClassId[] = ["A", "B", "C"];
const initialDiaries: Record<ClassId, ClassDiary> = {
  A: { total: 33, pending: 33, averageAttendance: 84, approved: [] },
  B: { total: 32, pending: 32, averageAttendance: 78.8125, approved: [] },
  C: { total: 29, pending: 29, averageAttendance: 83.3793, approved: [] },
};

const numberFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const gradeFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

function formatAttendance(value: number | null) {
  return value === null ? "—" : `${numberFormat.format(value)}%`;
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
            <p>Resultados da formação de Propagandista Trainee.</p>
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

        <section className={dashboard.kpis} aria-label={`Indicadores da Turma ${selectedClass}`} aria-live="polite">
          <article className={dashboard.kpiPrimary}>
            <div><span>Registros ativos</span><UsersRound size={20} aria-hidden="true" /></div>
            <strong>{diary.total}</strong><p>Participantes no diário</p>
          </article>
          <article>
            <div><span>Frequência média</span><ClipboardList size={20} aria-hidden="true" /></div>
            <strong>{formatAttendance(diary.averageAttendance)}</strong><p>Registros com frequência preenchida</p>
          </article>
          <article>
            <div><span>Aprovados confirmados</span><Award size={20} aria-hidden="true" /></div>
            <strong>{hasResults ? diary.approved.length : "—"}</strong><p>{hasResults ? "Aprovações registradas no diário" : "Aguardando confirmação"}</p>
          </article>
          <article>
            <div><span>Resultados pendentes</span><Clock size={20} aria-hidden="true" /></div>
            <strong>{diary.pending}</strong><p>Registros em consolidação</p>
          </article>
        </section>

        <section className={`${dashboard.card} ${styles.results}`} aria-labelledby="lista-aprovados">
          <div className={styles.resultsHeader}>
            <div>
              <span className={dashboard.eyebrow}>TURMA {selectedClass}</span>
              <h2 id="lista-aprovados">Lista de aprovados</h2>
              <p className={styles.source}>{current ? current.filename : "Resumo do diário recebido"}</p>
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

          {diary.approved.length ? (
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead><tr><th scope="col">Participante</th><th scope="col">Frequência</th><th scope="col">Média final</th><th scope="col">Resultado</th></tr></thead>
                <tbody>{diary.approved.map((participant, index) => (
                  <tr key={`${participant.name}-${index}`}>
                    <th scope="row">{participant.name}</th>
                    <td>{formatAttendance(participant.attendance)}</td>
                    <td>{participant.finalGrade === null ? "—" : gradeFormat.format(participant.finalGrade)}</td>
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
          <p className={styles.note}>O mesmo formato atende às três turmas. Selecione a turma e carregue a versão atualizada do seu diário.</p>
        </section>

        <footer className={dashboard.footer}>
          <span>ACHÉ + PROSPER · PROGRAMA DE INCLUSÃO PcD</span>
          <Link href="/bi">Voltar ao BI demográfico<ArrowLeft size={14} aria-hidden="true" /></Link>
        </footer>
      </main>
    </div>
  );
}
