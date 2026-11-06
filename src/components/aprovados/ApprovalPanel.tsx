"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ArrowLeft, Award, ChartNoAxesCombined, ChevronDown, ClipboardList, FileSpreadsheet, Flag, MessageCircle, ShieldCheck, Star, Upload, UsersRound, type LucideIcon } from "lucide-react";
import { rankApprovals, rankByGrade, type TeacherHighlights } from "@/lib/approvalRanking";
import type { ClassDiary, ClassId, ClassPerformance, DiaryParticipant, PerformanceField } from "@/lib/classDiary";
import { participantKey } from "@/lib/participantName";
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

// Aggregate values used before a diary is loaded.
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

export type LoadedDiaries = Partial<Record<ClassId, { filename: string; results: ClassDiary }>>;
type GradeStorageKeys = Partial<Record<ClassId, string>>;

async function restoreGrades(diary: NonNullable<LoadedDiaries[ClassId]>, key: string) {
  const raw = window.localStorage.getItem(key);
  if (!raw) return diary;
  const grades: unknown = JSON.parse(raw);
  if (!Array.isArray(grades) || grades.length !== diary.results.approved.length
    || !grades.every(grade => grade === null || typeof grade === "number")) {
    throw new Error("As notas salvas estão em um formato incompatível.");
  }

  const { updateFinalGrades } = await import("@/lib/classDiary");
  const participants = diary.results.approved.map(({ name }, index) => ({ name, finalGrade: grades[index] as number | null }));
  return participants.some(person => person.finalGrade !== null)
    ? { ...diary, results: updateFinalGrades(diary.results, { participants }) }
    : diary;
}

type Feedback = { classId: ClassId; message: string; error: boolean };

function RankingByGrade({ participants, highlights }: {
  participants: DiaryParticipant[];
  highlights?: TeacherHighlights[ClassId];
}) {
  const { usesFinalGrade, weeks, rows } = rankApprovals(participants);
  const indications = new Map(Object.entries(highlights ?? {}));
  const gradeLabel = usesFinalGrade ? "Média final" : "Nota de referência";
  const method = usesFinalGrade ? "Classificação pela média final registrada."
    : weeks.length === 1 ? `Classificação provisória pela nota da semana ${weeks[0]}.`
    : weeks.length > 1 ? `Classificação provisória pela média das semanas ${new Intl.ListFormat("pt-BR").format(weeks.map(String))}.`
    : "Posições pendentes de notas comparáveis.";
  const pending = rows.filter(row => row.position === null).length;

  return (
    <details className={`${styles.participantDetails} ${styles.rankingDetails}`}>
      <summary><span>Ranking por nota</span><ChevronDown size={18} aria-hidden="true" /></summary>
      <div className={styles.participantBody}>
        <p className={styles.source}>
          {method} Empates compartilham a posição.
          {pending ? ` ${pending} ${pending === 1 ? "pessoa sem posição" : "pessoas sem posição"}.` : ""}
        </p>
        <div className={styles.rankingScroll} tabIndex={0} role="region" aria-label="Tabela de ranking por nota">
          <table className={styles.rankingTable}>
            <thead><tr>
              <th scope="col">Posição</th><th scope="col">Participante</th><th scope="col">{gradeLabel}</th><th scope="col">Destaque do professor</th>
            </tr></thead>
            <tbody>
              {rows.map(({ name, grade, position }, index) => {
                const labels = indications.get(participantKey(name)) ?? [];
                return <tr key={`${name}-${index}`}>
                  <td>{position === null ? "—" : `${position}º`}</td>
                  <th scope="row">{name}</th>
                  <td>{grade === null ? "Pendente" : formatMetric(grade)}</td>
                  <td>{labels.length ? <ul className={styles.teacherTags}>
                    {labels.map(label => <li key={label} className={label === "Top 15 do professor" ? styles.teacherTop : undefined}>{label}</li>)}
                  </ul> : "—"}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}

function ParticipantDetails({ participant, group, subtitle, labels = [] }: {
  participant: DiaryParticipant;
  group: string;
  subtitle?: string;
  labels?: readonly string[];
}) {
  return (
    <details className={styles.participantDetails} name={group}>
      <summary>
        <span>{participant.name}{subtitle ? <small className={styles.candidateSubtitle}>{subtitle}</small> : null}</span>
        <ChevronDown size={18} aria-hidden="true" />
      </summary>
      <div className={styles.participantBody}>
        {labels.length ? <div>
          <h3>Destaques do professor</h3>
          <ul className={styles.teacherTags}>{labels.map(label => <li key={label}>{label}</li>)}</ul>
        </div> : null}
        <dl className={styles.personMetrics}>
          {metrics.filter(({ field }) => field === "finalGrade" || participant[field] !== null).map(({ field, label }) => (
            <div key={field}><dt>{label}</dt><dd>{participant[field] === null ? "Pendente" : formatMetric(participant[field])}</dd></div>
          ))}
        </dl>
        <div className={styles.teacherComment}>
          <h3>Avaliação do professor</h3>
          <p>{participant.teacherComment ?? "Avaliação final pendente no diário."}</p>
        </div>
        {participant.additionalObservation ? <div className={styles.teacherComment}>
          <h3>Observações complementares do diário</h3>
          <p>{participant.additionalObservation}</p>
        </div> : null}
        {participant.weeklyGrades.length ? <div>
          <h3>Notas semanais</h3>
          <dl className={styles.weeklyGrades}>
            {participant.weeklyGrades.map(({ week, grade }, index) => (
              <div key={`${week}-${index}`}><dt>Semana {week}</dt><dd>{formatMetric(grade)}</dd></div>
            ))}
          </dl>
        </div> : null}
      </div>
    </details>
  );
}

function Candidates({ loaded, teacherHighlights }: { loaded: LoadedDiaries; teacherHighlights: TeacherHighlights }) {
  const [filter, setFilter] = useState<ClassId | "all">("all");
  const candidates = rankByGrade(classIds.flatMap(classId => (loaded[classId]?.results.approved ?? []).map((participant, index) => ({
    id: `${classId}-${participant.name}-${index}`,
    classId,
    participant,
    name: participant.name,
    grade: participant.finalGrade,
  }))));
  const visible = candidates.filter(row => filter === "all" || row.classId === filter);
  const pending = candidates.filter(row => row.position === null).length;

  return (
    <section className={`${dashboard.card} ${styles.results}`} aria-labelledby="ranking-geral">
      <div className={styles.resultsHeader}>
        <div>
          <h2 id="ranking-geral">Ranking geral</h2>
          <p className={styles.source}>Posição pela média final nas três turmas. Empates compartilham a posição.</p>
        </div>
        <label className={styles.classFilter}>Filtrar por turma
          <select value={filter} onChange={event => setFilter(event.target.value as ClassId | "all")}>
            <option value="all">Todas as turmas</option>
            {classIds.map(classId => <option key={classId} value={classId}>Turma {classId}</option>)}
          </select>
        </label>
      </div>
      <p className={styles.candidateCount} aria-live="polite">
        {visible.length} de {candidates.length} candidatos{pending ? ` · ${pending} com média final pendente no total` : ""}.
      </p>
      <div className={styles.participantList}>
        {visible.map(({ id, participant, classId, position, grade }) => {
          const labels = teacherHighlights[classId];
          const key = participantKey(participant.name);
          return <ParticipantDetails
            key={id}
            participant={participant}
            group="fichas-candidatos"
            subtitle={`Turma ${classId} · ${position === null ? "Média final pendente" : `${position}º geral · Média ${formatMetric(grade)}`}`}
            labels={labels && Object.hasOwn(labels, key) ? labels[key] : []}
          />;
        })}
        {!visible.length ? <p className={styles.empty}>Carregue o diário da turma para consultar os candidatos.</p> : null}
      </div>
    </section>
  );
}

export default function ApprovalPanel({ initialLoaded = {}, teacherHighlights = {}, mode = "approvals", gradeStorageKeys }: {
  initialLoaded?: LoadedDiaries;
  teacherHighlights?: TeacherHighlights;
  mode?: "approvals" | "candidates";
  gradeStorageKeys?: GradeStorageKeys;
}) {
  const candidateMode = mode === "candidates";
  const [selectedClass, setSelectedClass] = useState<ClassId>("C");
  const [loaded, setLoaded] = useState(initialLoaded);
  const [reading, setReading] = useState<ClassId | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const uploadClass = useRef<ClassId>("C");
  const current = loaded[selectedClass];
  const diary = current?.results ?? initialDiaries[selectedClass];

  useEffect(() => {
    if (!gradeStorageKeys) return;
    let active = true;

    async function restoreClass(classId: ClassId, key: string) {
      const base = initialLoaded[classId];
      if (!base) return;
      try {
        const restored = await restoreGrades(base, key);
        if (active) setLoaded(previous => ({ ...previous, [classId]: restored }));
      } catch {
        if (active) setFeedback({ classId, message: "Não foi possível ler as notas salvas neste navegador.", error: true });
      }
    }

    function restoreStoredGrades(event?: StorageEvent) {
      for (const classId of classIds) {
        const key = gradeStorageKeys?.[classId];
        if (key && (!event?.key || event.key === key)) void restoreClass(classId, key);
      }
    }

    restoreStoredGrades();
    window.addEventListener("storage", restoreStoredGrades);
    return () => {
      active = false;
      window.removeEventListener("storage", restoreStoredGrades);
    };
  }, [gradeStorageKeys, initialLoaded]);

  async function loadDiary(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file || reading) return;

    const classId = uploadClass.current;
    if (!/\.xls[xm]$/i.test(file.name) || file.size > 8 * 1024 * 1024) {
      setFeedback({ classId, message: "Selecione um arquivo XLSX ou XLSM de até 8 MB.", error: true });
      return;
    }

    const filename = file.name;
    setReading(classId);
    setFeedback(null);
    try {
      const { parseClassDiary, updateFinalGrades } = await import("@/lib/classDiary");
      const results = parseClassDiary(new Uint8Array(await file.arrayBuffer()), classId, { asApprovalList: true });
      if (candidateMode && !results.approved.length) throw new Error("O diário precisa ter ao menos um candidato.");
      const base = initialLoaded[classId];
      const key = gradeStorageKeys?.[classId];
      const existing = loaded[classId];

      async function applyUpdate() {
        const current = base && key ? await restoreGrades(base, key) : existing;
        const updated = candidateMode && current
          ? { ...current, results: updateFinalGrades(current.results, results) }
          : { filename, results };
        if (base && key) {
          const overrides = updated.results.approved.map(({ finalGrade }, index) =>
            finalGrade === base.results.approved[index].finalGrade ? null : finalGrade,
          );
          try {
            window.localStorage.setItem(key, JSON.stringify(overrides));
          } catch {
            throw new Error("Não foi possível salvar as notas neste navegador. As notas anteriores foram preservadas.");
          }
        }
        setLoaded(previous => ({ ...previous, [classId]: updated }));
      }

      if (key && navigator.locks) await navigator.locks.request(key, applyUpdate);
      else await applyUpdate();
      setFeedback({ classId, message: candidateMode && existing
        ? `Médias finais da Turma ${classId} atualizadas. Ranking recalculado.`
        : `Diário da Turma ${classId} atualizado.`, error: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível abrir o diário de classe.";
      setFeedback({ classId, message, error: true });
    } finally {
      setReading(null);
    }
  }

  function chooseFile(classId: ClassId) {
    uploadClass.current = classId;
    input.current?.click();
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
          <Link href="/aprovados" className={candidateMode ? undefined : dashboard.navActive} aria-current={candidateMode ? undefined : "page"}>
            <Award size={18} aria-hidden="true" />Aprovados{!candidateMode ? <span className={dashboard.navDot} /> : null}
          </Link>
          <Link href="/candidatos" className={candidateMode ? dashboard.navActive : undefined} aria-current={candidateMode ? "page" : undefined}>
            <UsersRound size={18} aria-hidden="true" />Candidatos{candidateMode ? <span className={dashboard.navDot} /> : null}
          </Link>
          <Link href="/satisfacao"><MessageCircle size={18} aria-hidden="true" />Satisfação</Link>
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
          <span><Link href="/home">Retrospectiva</Link><span>/</span><strong>{candidateMode ? "Candidatos" : "Aprovados"}</strong></span>
          <span className={dashboard.topbarRight}><FileSpreadsheet size={15} aria-hidden="true" />DIÁRIOS DE CLASSE</span>
        </div>
        <header className={dashboard.pageHeader}>
          <div>
            <span className={dashboard.kicker}>PROGRAMA DE INCLUSÃO PcD ACHÉ</span>
            <h1>{candidateMode ? "Candidatos" : "Aprovados por turma"}<span>.</span></h1>
            <p>{candidateMode ? "Ranking e fichas dos participantes da formação." : "Desempenho e resultados da formação de Propagandista Trainee."}</p>
          </div>
        </header>

        <input ref={input} hidden type="file" accept=".xlsx,.xlsm" onChange={loadDiary} aria-label="Selecionar diário de classe" />
        {candidateMode ? <>
          <section aria-labelledby="atualizar-notas">
            <h2 id="atualizar-notas">Notas por turma</h2>
            <p className={styles.source}>Use a coluna Média final. A importação atualiza as notas da turma e recalcula o ranking.
              {gradeStorageKeys ? " As alterações ficam salvas neste navegador." : ""}</p>
            <div className={styles.candidateActions}>
              {classIds.map(classId => (
                <button key={classId} className={styles.uploadButton} type="button" disabled={reading !== null} onClick={() => chooseFile(classId)}>
                  <Upload size={16} aria-hidden="true" />
                  {reading === classId ? `Lendo Turma ${classId}…` : `${loaded[classId] ? "Atualizar notas" : "Carregar diário"} · Turma ${classId}`}
                </button>
              ))}
            </div>
            {feedback ? <p className={feedback.error ? styles.error : styles.feedback} role={feedback.error ? "alert" : "status"}>{feedback.message}</p> : null}
          </section>
          <Candidates loaded={loaded} teacherHighlights={teacherHighlights} />
        </> : <>
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
            <button className={styles.uploadButton} type="button" disabled={reading !== null} onClick={() => chooseFile(selectedClass)}>
              <Upload size={16} aria-hidden="true" />
              {reading === selectedClass ? "Lendo diário…" : current ? "Substituir lista" : "Carregar lista"}
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
        </section>

        <section className={`${dashboard.card} ${styles.results}`} aria-labelledby="lista-aprovados">
          <div className={styles.resultsHeader}>
            <div>
              <span className={dashboard.eyebrow}>TURMA {selectedClass}</span>
              <h2 id="lista-aprovados">Lista de aprovados</h2>
              {diary.approved.length ? <p className={styles.source}>Selecione um nome para consultar as notas e a avaliação do professor.</p> : null}
            </div>
          </div>

          {diary.approved.length ? (
            <>
              <dl className={styles.approvalStats} aria-live="polite">
                <div><dt>Aprovados</dt><dd>{diary.approved.length}</dd></div>
                <div><dt>Notas finais registradas</dt><dd>{diary.performance.finalGrade.count}</dd></div>
                <div><dt>Avaliações do professor</dt><dd>{diary.approved.filter(person => person.teacherComment !== null).length}</dd></div>
              </dl>
              <RankingByGrade participants={diary.approved} highlights={teacherHighlights[selectedClass]} />
              <div className={styles.participantList}>
                {diary.approved.map((participant, index) => (
                  <ParticipantDetails key={`${selectedClass}-${participant.name}-${index}`} participant={participant} group={`aprovados-${selectedClass}`} />
                ))}
              </div>
            </>
          ) : (
            <div className={styles.empty}>
              <ClipboardList size={26} aria-hidden="true" />
              <h3>{current ? "Lista sem participantes" : "Lista da turma aguardando arquivo"}</h3>
              <p>Carregue a lista de aprovados da turma para consultar as fichas.</p>
            </div>
          )}
        </section>

        </>}
        <footer className={dashboard.footer}>
          <span>ACHÉ + PROSPER · PROGRAMA DE INCLUSÃO PcD</span>
          <Link href="/bi">Voltar ao BI demográfico<ArrowLeft size={14} aria-hidden="true" /></Link>
        </footer>
      </main>
    </div>
  );
}
