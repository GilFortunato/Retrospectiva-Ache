"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type ChangeEvent } from "react";
import { ArrowLeft, Award, ChartNoAxesCombined, ChevronDown, ClipboardList, FileSpreadsheet, Flag, MessageCircle, ShieldCheck, Star, Upload, UsersRound, type LucideIcon } from "lucide-react";
import { orderTeacherRecommendations, rankApprovals, rankByGrade, type TeacherHighlights } from "@/lib/approvalRanking";
import type { ClassDiary, ClassId, ClassPerformance, DiaryParticipant, PerformanceField } from "@/lib/classDiary";
import { evaluationTags, type EvaluationTag } from "@/lib/evaluationTags";
import { candidateDisabilityGroup, disabilityGroups, type DisabilityGroup } from "@/lib/biDemografico";
import type { CandidateLocations } from "@/lib/biWorkbook";
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

function ParticipantDetails({ participant, group, subtitle, badge, evaluationTag, disabilityGroup, labels = [] }: {
  participant: DiaryParticipant;
  group: string;
  subtitle?: string;
  badge?: string;
  evaluationTag?: EvaluationTag;
  disabilityGroup?: DisabilityGroup;
  labels?: readonly string[];
}) {
  return (
    <details className={badge ? `${styles.participantDetails} ${styles.priorityCandidate}` : styles.participantDetails} name={group}>
      <summary>
        <span>
          {badge ? <small className={styles.priorityBadge}>{badge}</small> : null}
          {participant.name}{subtitle ? <small className={styles.candidateSubtitle}>{subtitle}</small> : null}
          {disabilityGroup ? <small className={styles.candidateSubtitle}>
            {disabilityGroup === "nao-informado" ? "Deficiência: não informada" : disabilityGroups[disabilityGroup]}
            {participant.accessibility?.adaptation ? " · Acessibilidade registrada" : ""}
          </small> : null}
          {evaluationTag ? <span className={styles.evaluationTag}>{evaluationTag}</span> : null}
        </span>
        <ChevronDown size={18} aria-hidden="true" />
      </summary>
      <div className={styles.participantBody}>
        {disabilityGroup && participant.accessibility?.diagnosis ? <div className={styles.teacherComment}>
          <h3>CID-10 registrado</h3>
          <p><strong>{participant.accessibility.diagnosis.code}</strong> · {participant.accessibility.diagnosis.description}</p>
        </div> : null}
        {disabilityGroup && participant.accessibility?.adaptation ? <div className={styles.teacherComment}>
          <h3>Necessidade de adaptação ou recurso de acessibilidade</h3>
          <p>{participant.accessibility.adaptation}</p>
        </div> : null}
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

function Candidates({ loaded, teacherHighlights, priorities, locations }: {
  loaded: LoadedDiaries;
  teacherHighlights: TeacherHighlights;
  priorities: Readonly<Record<string, number>>;
  locations?: CandidateLocations;
}) {
  const [filter, setFilter] = useState<ClassId | "all">("all");
  const [tagFilter, setTagFilter] = useState<EvaluationTag | "all">("all");
  const [disabilityFilter, setDisabilityFilter] = useState<DisabilityGroup | "all">("all");
  const [nameSearch, setNameSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const candidates = rankByGrade(classIds.flatMap(classId => (loaded[classId]?.results.approved ?? []).map((participant, index) => {
    const nameKey = participantKey(participant.name);
    const location = locations && Object.hasOwn(locations, nameKey) ? locations[nameKey] : undefined;
    return {
      id: `${classId}-${participant.name}-${index}`,
      classId,
      participant,
      name: participant.name,
      grade: participant.finalGrade,
      nameKey,
      cityKey: participantKey(location?.city ?? ""),
      location,
    };
  })));
  const states = [...new Set(candidates.flatMap(({ location }) => location?.state ? [location.state] : []))].sort();
  const cities = [...new Map(candidates.flatMap(({ cityKey, location }) =>
    location?.city && (!stateFilter || location.state === stateFilter) ? [[cityKey, location.city] as const] : [],
  ))].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  const search = participantKey(nameSearch);
  const visible = candidates.filter(row =>
    (filter === "all" || row.classId === filter) &&
    (tagFilter === "all" || row.participant.evaluationTag === tagFilter) &&
    (disabilityFilter === "all" || candidateDisabilityGroup(row.participant.accessibility) === disabilityFilter) &&
    (!stateFilter || row.location?.state === stateFilter) &&
    (!cityFilter || row.cityKey === cityFilter) &&
    row.nameKey.includes(search),
  );
  const pending = candidates.filter(row => row.position === null).length;
  const { featured, others } = orderTeacherRecommendations(candidates, teacherHighlights, priorities);

  function changeState(state: string) {
    setStateFilter(state);
    if (state && cityFilter && !candidates.some(row => row.location?.state === state && row.cityKey === cityFilter)) {
      setCityFilter("");
    }
  }

  function candidateCard({ id, participant, classId, position, grade }: typeof candidates[number], group: string, badge?: string) {
    const labels = teacherHighlights[classId];
    const key = participantKey(participant.name);
    const displayName = participant.name.charAt(0).toLocaleUpperCase("pt-BR") + participant.name.slice(1);
    const rank = position === null ? "Média final pendente" : `${position}º geral · Média ${formatMetric(grade)}`;
    return <ParticipantDetails
      key={id}
      participant={{ ...participant, name: displayName }}
      group={group}
      badge={badge}
      evaluationTag={participant.evaluationTag}
      disabilityGroup={candidateDisabilityGroup(participant.accessibility)}
      subtitle={`Turma ${classId} · ${rank}`}
      labels={labels && Object.hasOwn(labels, key) ? labels[key] : []}
    />;
  }

  return <>
    <section className={`${dashboard.card} ${styles.results}`} aria-labelledby="recomendacoes">
      <div className={styles.resultsHeader}>
        <div>
          <h2 id="recomendacoes">Recomendações</h2>
          <p className={styles.source}>Depois dos destaques prioritários, as indicações dos professores seguem a ordem do ranking geral.</p>
        </div>
      </div>
      {featured.length ? <div className={styles.recommendationHighlights}>
        {featured.map(row => candidateCard(row, "fichas-recomendadas", `${row.priority}º destaque`))}
      </div> : null}
      {others.length ? <details className={`${styles.participantDetails} ${styles.moreRecommendations}`}>
        <summary>
          <span>{featured.length ? "Outras indicações" : "Indicações dos professores"} ({others.length})</span>
          <ChevronDown size={18} aria-hidden="true" />
        </summary>
        <div className={`${styles.participantBody} ${styles.participantList}`}>
          {others.map(row => candidateCard(row, "fichas-recomendadas"))}
        </div>
      </details> : null}
      {!featured.length && !others.length ? <p className={styles.empty}>Ainda não há indicações disponíveis.</p> : null}
    </section>
    <section className={`${dashboard.card} ${styles.results}`} aria-labelledby="ranking-geral">
      <div className={styles.resultsHeader}>
        <div>
          <h2 id="ranking-geral">Ranking geral</h2>
          <p className={styles.source}>Posição pela média final nas três turmas. Empates compartilham a posição.</p>
        </div>
      </div>
      <div className={styles.candidateFilters} role="group" aria-label="Filtros de candidatos">
        <label className={styles.classFilter}>Filtrar por turma
          <select value={filter} onChange={event => setFilter(event.target.value as ClassId | "all")}>
            <option value="all">Todas as turmas</option>
            {classIds.map(classId => <option key={classId} value={classId}>Turma {classId}</option>)}
          </select>
        </label>
        <label className={styles.classFilter}>Pesquisar por nome
          <input
            type="search"
            placeholder="Digite o nome ou sobrenome"
            value={nameSearch}
            onChange={event => setNameSearch(event.target.value)}
          />
        </label>
        <label className={styles.classFilter}>Filtrar por tag
          <select value={tagFilter} onChange={event => setTagFilter(event.target.value as EvaluationTag | "all")}>
            <option value="all">Todas as tags</option>
            {Object.keys(evaluationTags).map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
        </label>
        <label className={styles.classFilter}>Filtrar por deficiência
          <select value={disabilityFilter} onChange={event => setDisabilityFilter(event.target.value as DisabilityGroup | "all")}>
            <option value="all">Todas as categorias</option>
            {Object.entries(disabilityGroups).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <label className={styles.classFilter}>Filtrar por estado (UF)
          <select value={stateFilter} onChange={event => changeState(event.target.value)} disabled={!states.length}>
            <option value="">Todos os estados</option>
            {states.map(state => <option key={state} value={state}>{state}</option>)}
          </select>
        </label>
        <label className={styles.classFilter}>Filtrar por cidade
          <select value={cityFilter} onChange={event => setCityFilter(event.target.value)} disabled={!cities.length}>
            <option value="">Todas as cidades</option>
            {cities.map(([key, city]) => <option key={key} value={key}>{city}</option>)}
          </select>
        </label>
      </div>
      {!locations && candidates.length > 0 ? <p className={styles.source}>Os filtros de cidade e estado estão temporariamente indisponíveis.</p> : null}
      <details className={`${styles.participantDetails} ${styles.tagLegend}`}>
        <summary><span>Legenda das tags</span><ChevronDown size={18} aria-hidden="true" /></summary>
        <dl className={styles.participantBody}>
          {Object.entries(evaluationTags).map(([tag, description]) => (
            <div key={tag}>
              <dt className={styles.evaluationTag}>{tag}</dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
      </details>
      <p className={styles.candidateCount} aria-live="polite">
        {visible.length} de {candidates.length} candidatos{pending ? ` · ${pending} com média final pendente no total` : ""}.
      </p>
      <div className={styles.participantList}>
        {visible.map(row => candidateCard(row, "fichas-candidatos"))}
        {!visible.length ? <p className={styles.empty}>Nenhum candidato encontrado com esses filtros.</p> : null}
      </div>
    </section>
  </>;
}

export default function ApprovalPanel({ initialLoaded = {}, teacherHighlights = {}, mode = "approvals", priorities = {}, locations }: {
  initialLoaded?: LoadedDiaries;
  teacherHighlights?: TeacherHighlights;
  mode?: "approvals" | "candidates";
  priorities?: Readonly<Record<string, number>>;
  locations?: CandidateLocations;
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
      const { parseClassDiary } = await import("@/lib/classDiary");
      const results = parseClassDiary(new Uint8Array(await file.arrayBuffer()), classId, { asApprovalList: true });
      setLoaded(previous => ({ ...previous, [classId]: { filename, results } }));
      setFeedback({ classId, message: `Diário da Turma ${classId} atualizado.`, error: false });
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
          <strong>{candidateMode ? "Consulta das fichas" : "Consulta dos diários"}</strong>
          <p>{candidateMode ? "Consulte as avaliações dos participantes no ranking geral." : "Os arquivos selecionados são lidos no seu navegador."}</p>
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

        {candidateMode ? (
          <Candidates loaded={loaded} teacherHighlights={teacherHighlights} priorities={priorities} locations={locations} />
        ) : <>
        <input ref={input} hidden type="file" accept=".xlsx,.xlsm" onChange={loadDiary} aria-label="Selecionar diário de classe" />
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
