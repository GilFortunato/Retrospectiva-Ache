"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDownToLine, ArrowLeft, ArrowUpRight, Award, CalendarDays, ChartNoAxesCombined, ChevronDown, CircleHelp, Filter, GraduationCap, Layers3, Link2, MapPin, MapPinned, MessageCircle, Printer, RefreshCw, RotateCcw, ShieldCheck, UsersRound } from "lucide-react";
import { biData, csvSummary, disabilityGroups, emptyFilters, filterLabel, getDisabilitySummary, getSummary, isDisabilityGroup, normalizeFilters, percent, protectedBucket, type BiApprovals, type BiDataset, type BiFilters, type DisabilityGroup, type Distribution } from "@/lib/biDemografico";
import styles from "./DemographicDashboard.module.css";

const palette = ["#aa185d", "#ed8553", "#96b3a1", "#9d88b3", "#d7b86b", "#bdc3ce"];
const formatDate = (date: string) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(date + "T12:00:00Z"));
const number = (value: number | null) => value === null ? "—" : new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value);
type Population = "geral" | "aprovados";
const groupKeys = Object.keys(disabilityGroups).filter(isDisabilityGroup);

function Bars({ items, total, color = "#aa185d", onSelect }: { items: Distribution; total: number; color?: string; onSelect?: (label: string) => void }) {
  if (!items.length) return <p className={styles.empty}>Não há registros neste recorte.</p>;
  return <ul className={styles.bars}>{items.map(item => {
    const content = <>
      <span className={styles.barTop}><span>{item.label}</span><span><strong>{item.count}</strong><small>{percent(item.count, total)}</small></span></span>
      <span className={styles.track} aria-hidden="true"><span style={{ width: `${total ? item.count / total * 100 : 0}%`, backgroundColor: color }} /></span>
    </>;
    return <li key={item.label}>{onSelect && !["Não informado", protectedBucket].includes(item.label) ? <button type="button" className={styles.barButton} onClick={() => onSelect(item.label)} aria-label={`Filtrar por ${item.label}, ${item.count} participantes`}>{content}</button> : <div className={styles.barItem}>{content}</div>}</li>;
  })}</ul>;
}

function GenderChart({ items, total }: { items: Distribution; total: number }) {
  let cursor = 0;
  const gradient = items.map((item, index) => {
    const start = cursor;
    cursor += item.count / total * 100;
    return `${palette[index % palette.length]} ${start}% ${cursor}%`;
  }).join(", ");
  return <div className={styles.genderLayout}>
    <div className={styles.donut} style={{ background: `conic-gradient(${gradient})` }} role="img" aria-label={items.map(item => `${item.label}: ${item.count}`).join("; ")}>
      <div><strong>{total}</strong><span>participantes</span></div>
    </div>
    <ul className={styles.legend}>{items.map((item, index) => <li key={item.label}>
      <span className={styles.legendName}><i style={{ background: palette[index % palette.length] }} aria-hidden="true" />{item.label}</span>
      <span><strong>{item.count}</strong><small>{percent(item.count, total)}</small></span>
    </li>)}</ul>
  </div>;
}

function AgeChart({ items }: { items: Distribution }) {
  const maximum = Math.max(1, ...items.map(item => item.count));
  return <div className={styles.ageChart} role="img" aria-label={items.map(item => `${item.label}: ${item.count} participantes`).join("; ")}>
    {items.map(item => <div className={styles.ageColumn} key={item.label}>
      <div className={styles.agePlot}><span className={item.label === "Não informada" ? styles.ageUnknown : styles.ageBar} style={{ height: `${Math.max(4, item.count / maximum * 140)}px` }}><strong>{item.count}</strong></span></div>
      <span className={styles.ageLabel}>{item.label === "Não informada" ? <>Não<br />informada</> : item.label}</span>
    </div>)}
  </div>;
}

function ChartHeading({ eyebrow, title, note }: { eyebrow: string; title: string; note?: string }) {
  return <div className={styles.chartHeading}><div><span className={styles.eyebrow}>{eyebrow}</span><h3>{title}</h3></div>{note ? <span className={styles.chartNote}>{note}</span> : null}</div>;
}

export default function DemographicDashboard() {
  const [generalDataset, setGeneralDataset] = useState<BiDataset>(biData);
  const [approvals, setApprovals] = useState<BiApprovals | null>(null);
  const [population, setPopulation] = useState<Population>("geral");
  const [filters, setFilters] = useState<BiFilters>(emptyFilters);
  const [disability, setDisability] = useState<DisabilityGroup | "">("");
  const [showEducation, setShowEducation] = useState(false);
  const [status, setStatus] = useState("");
  const [activeSection, setActiveSection] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const [lastFetched, setLastFetched] = useState<string | null>(null);
  const refreshInProgress = useRef(false);
  const approvedSelected = population === "aprovados";
  const selectedDataset = approvedSelected ? approvals?.data : generalDataset;
  const dataset = selectedDataset ?? generalDataset;
  const geographicSummary = getSummary(filters, dataset);
  const summary = disability ? getDisabilitySummary(filters, dataset, disability) : geographicSummary;
  const overview = dataset.slices.all;
  const disabilityCounts = selectedDataset?.disabilityCounts;
  const visibleGroups = disability ? [disability] : groupKeys;
  const countFor = (group: DisabilityGroup) => {
    const breakdown = getDisabilitySummary(filters, dataset, group);
    return breakdown === null ? null : breakdown?.total;
  };
  const disabilityBars = visibleGroups.flatMap(group => {
    const count = countFor(group);
    return typeof count === "number" ? [{ label: disabilityGroups[group], count }] : [];
  });
  const hiddenGroups = visibleGroups.filter(group => countFor(group) === null);
  const distributions = summary?.distributions;
  const geographicFilter = Boolean(filters.region || filters.state || filters.spRegion);
  const geography = filterLabel(filters, dataset);
  const selection = [approvedSelected ? "Aprovados" : "Geral", geographicFilter ? geography : "Brasil", disability && disabilityGroups[disability]].filter(Boolean).join(" · ");
  const stateOptions = dataset.filters.states.filter(state => !filters.region || state.region === filters.region);
  const canSelectSp = (!filters.state || filters.state === "SP") && (!filters.region || filters.region === "Sudeste");
  const topState = distributions?.states.find(item => item.label !== protectedBucket);
  const middleAge = distributions?.ageBands.some(item => item.label === protectedBucket) ? null
    : distributions?.ageBands.filter(item => ["35–44", "45–54"].includes(item.label)).reduce((sum, item) => sum + item.count, 0) ?? 0;
  const topEducation = distributions?.education.find(item => item.label !== protectedBucket);
  const dateLabel = formatDate(dataset.source.referenceDate);

  const refreshData = useCallback(async () => {
    if (refreshInProgress.current) return;
    refreshInProgress.current = true;
    setRefreshing(true);
    setRefreshError("");
    try {
      const response = await fetch("/api/bi", { cache: "no-store", signal: AbortSignal.timeout(50000) });
      const payload = await response.json() as { data?: BiDataset; approvals?: BiApprovals; fetchedAt?: string; error?: string };
      if (!response.ok || !payload.data?.slices?.all || !payload.fetchedAt) throw new Error(payload.error || "Não foi possível ler os dados atualizados das planilhas.");
      const next = payload.data;
      setGeneralDataset(next);
      setApprovals(payload.approvals ?? null);
      setFilters(current => normalizeFilters(current, next));
      setLastFetched(payload.fetchedAt);
    } catch (error) {
      setRefreshError(error instanceof Error && error.name !== "TimeoutError" ? error.message : "A consulta às planilhas demorou mais que o esperado. Tente novamente.");
    } finally {
      refreshInProgress.current = false;
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setPopulation(query.get("publico") === "aprovados" ? "aprovados" : "geral");
    const group = query.get("tipo") || "";
    if (isDisabilityGroup(group)) setDisability(group);
    setFilters({ region: query.get("regiao") || "", state: query.get("uf") || "", spRegion: query.get("sp") || "" });
    void refreshData();
    const interval = setInterval(() => { if (document.visibilityState === "visible") void refreshData(); }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshData]);

  function updateFilters(next: BiFilters, nextPopulation = population, nextDisability = disability) {
    const clean = normalizeFilters(next, generalDataset);
    setFilters(clean);
    setPopulation(nextPopulation);
    setDisability(nextDisability);
    setStatus("");
    const url = new URL(window.location.href);
    for (const name of ["publico", "regiao", "uf", "sp", "tipo"]) url.searchParams.delete(name);
    if (nextPopulation === "aprovados") url.searchParams.set("publico", nextPopulation);
    if (clean.region) url.searchParams.set("regiao", clean.region);
    if (clean.state) url.searchParams.set("uf", clean.state);
    if (clean.spRegion) url.searchParams.set("sp", clean.spRegion);
    if (nextDisability) url.searchParams.set("tipo", nextDisability);
    window.history.replaceState(null, "", url);
  }

  function selectState(state: string) {
    const entry = dataset.filters.states.find(item => item.value === state);
    updateFilters({ region: entry?.region || "", state, spRegion: "" });
  }

  function downloadCsv() {
    if (!selectedDataset || !summary) return;
    const contents = csvSummary(summary, selection, dataset);
    const blob = new Blob([contents], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    const scope = [disability, filters.spRegion || filters.state || filters.region || "Brasil"].filter(Boolean).join("_");
    anchor.download = "BI_Ache_" + (approvedSelected ? "Aprovados_" : "") + scope.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "_") + ".csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("Resumo do recorte exportado em CSV.");
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(window.location.href); setStatus("Link do recorte copiado."); }
    catch { setStatus("Copie o endereço da barra do navegador para compartilhar este recorte."); }
  }

  const navigation = [
    { id: "overview", label: "Visão geral", icon: ChartNoAxesCombined },
    ...(disability || disabilityCounts ? [{ id: "disability", label: "Deficiência e neurodivergência", icon: UsersRound }] : []),
    ...(summary?.distributions ? [
    { id: "profile", label: "Perfil demográfico", icon: UsersRound },
    { id: "geography", label: "Geografia", icon: MapPinned },
    { id: "education", label: "Formação", icon: GraduationCap },
    ] : []),
  ];

  return <div className={styles.dashboard}>
    <a className={styles.skipLink} href="#bi-main">Pular para os indicadores</a>
    <aside className={styles.sidebar} aria-label="Navegação do BI">
      <Link href="/home" className={styles.logoLink} aria-label="Aché - voltar ao Nexus"><Image src="/brand/ache-logo-tagline.webp" alt="Aché" width={115} height={69} priority /></Link>
      <div className={styles.sidebarProgram}><span>PROGRAMA DE INCLUSÃO PcD</span><strong>Propagandista<br />Trainee</strong><span className={styles.edition}>RETROSPECTIVA 2026</span></div>
      <span className={styles.navTitle}>EXPLORAR O PAINEL</span>
      <nav>
        {navigation.map(({ id, label, icon: Icon }) => <a key={id} href={`#${id}`} className={activeSection === id ? styles.navActive : ""} onClick={() => setActiveSection(id)} aria-current={activeSection === id ? "location" : undefined}><Icon size={18} aria-hidden="true" />{label}{activeSection === id ? <span className={styles.navDot} /> : null}</a>)}
        <Link href="/aprovados"><Award size={18} aria-hidden="true" />Aprovados</Link>
        <Link href="/candidatos"><UsersRound size={18} aria-hidden="true" />Candidatos</Link>
        <Link href="/satisfacao"><MessageCircle size={18} aria-hidden="true" />Satisfação</Link>
      </nav>
      <div className={styles.sidebarBottom}><ShieldCheck size={20} aria-hidden="true" /><strong>Uma visão sobre pessoas.</strong><p>Indicadores consolidados, sem identificação individual.</p><Link href="/home"><ArrowLeft size={16} aria-hidden="true" />Voltar ao Nexus</Link></div>
    </aside>

    <main className={styles.main} id="bi-main">
      <div className={styles.topbar}><span><Link href="/home">Retrospectiva</Link><span>/</span><strong>BI demográfico</strong></span><span className={styles.topbarRight}><i aria-hidden="true" />{refreshError ? "ÚLTIMA CARGA" : lastFetched ? "DADOS ATUALIZADOS" : "BASE CONSOLIDADA"}</span></div>
      <header className={styles.pageHeader} id="overview">
        <div><span className={styles.kicker}>PROGRAMA DE INCLUSÃO PcD ACHÉ</span><h1>A inclusão em números<span>.</span></h1><p>Quem são as pessoas que fazem parte desta jornada.</p></div>
        <div className={styles.headerActions}><span className={styles.reference}><CalendarDays size={15} aria-hidden="true" />Referência: {dateLabel}</span><div><button type="button" className={styles.iconButton} onClick={() => void copyLink()} aria-label="Copiar link deste recorte" title="Copiar link do recorte"><Link2 size={17} aria-hidden="true" /></button><button type="button" className={styles.iconButton} onClick={() => window.print()} disabled={!selectedDataset} aria-label="Imprimir painel" title="Imprimir painel"><Printer size={17} aria-hidden="true" /></button><button type="button" className={styles.exportButton} onClick={downloadCsv} disabled={!selectedDataset || !summary}><ArrowDownToLine size={16} aria-hidden="true" />Exportar resumo</button></div></div>
      </header>

      <section className={styles.filterPanel} aria-label="Filtros do painel">
        <div className={styles.filterIntro}><span><Filter size={17} aria-hidden="true" />Seu recorte</span><small>Explore a base do programa</small></div>
        <label>Público<select value={population} onChange={event => updateFilters(filters, event.target.value === "aprovados" ? "aprovados" : "geral")}><option value="geral">Geral</option><option value="aprovados">Aprovados</option></select></label>
        <label>Deficiência ou neurodivergência<select value={disability} disabled={!disability && !disabilityCounts} onChange={event => {
          const group = event.target.value;
          updateFilters(filters, population, isDisabilityGroup(group) ? group : "");
        }}><option value="">Todas as categorias</option>{groupKeys.map(group => <option key={group} value={group}>{disabilityGroups[group]}</option>)}</select></label>
        <label>Região do Brasil<select value={filters.region} onChange={event => updateFilters({ region: event.target.value, state: "", spRegion: "" })}><option value="">Todas as regiões</option>{dataset.filters.regions.map(region => <option key={region}>{region}</option>)}</select></label>
        <label>Unidade federativa<select value={filters.state} onChange={event => updateFilters({ ...filters, state: event.target.value, spRegion: "" })}><option value="">Todas as UFs</option>{stateOptions.map(state => <option key={state.value} value={state.value}>{state.value}</option>)}</select></label>
        <label>Região de São Paulo<select value={filters.spRegion} disabled={!canSelectSp} onChange={event => updateFilters({ ...filters, spRegion: event.target.value })}><option value="">Todas as regiões de SP</option>{dataset.filters.spRegions.map(region => <option key={region}>{region}</option>)}</select></label>
        <button type="button" className={styles.resetButton} disabled={!geographicFilter && !approvedSelected && !disability} onClick={() => updateFilters(emptyFilters, "geral", "")} title="Limpar filtros" aria-label="Limpar filtros"><RotateCcw size={17} aria-hidden="true" /></button>
      </section>

      <div className={styles.liveToolbar}>
        <span role="status">{refreshing ? "Consultando as planilhas..." : lastFetched ? `Última consulta: ${new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(lastFetched))} · atualização automática a cada 5 min` : refreshError ? "Carga inicial · consulta indisponível" : "Carregando dados das planilhas"}</span>
        <button type="button" onClick={() => void refreshData()} disabled={refreshing}><RefreshCw size={14} className={refreshing ? styles.refreshSpin : undefined} aria-hidden="true" />{refreshing ? "Atualizando..." : "Atualizar dados"}</button>
      </div>
      {refreshError ? <p className={styles.refreshError} role="alert">{refreshError} {lastFetched ? "Mantivemos a última consulta carregada." : "O painel está exibindo a carga inicial, que pode estar desatualizada."}</p> : null}

      <p className={styles.status} role="status">{status}</p>

      {selectedDataset ? <>
      {approvedSelected && approvals ? <p className={styles.approvalNote}>
        Listas das turmas {approvals.classes.join(", ")}.
        {approvals.partial ? " Há listas de turma pendentes." : ""}
        {approvals.unmatched > 0 ? ` ${approvals.unmatched} ${approvals.unmatched === 1 ? "pessoa incluída" : "pessoas incluídas"} no total com dados demográficos não informados.` : ""}
      </p> : null}
      {disability || disabilityCounts ? <section id="disability" className={styles.section} aria-label="Deficiência e neurodivergência" aria-live="polite">
        <article className={styles.card}>
          <ChartHeading eyebrow={`${approvedSelected ? "Aprovados" : "Base geral"} · ${geographicFilter ? geography : "Brasil"}`} title={disability ? disabilityGroups[disability] : "Deficiência e neurodivergência"} />
          {disabilityCounts ? <>
            {disabilityBars.length ? <Bars items={disabilityBars} total={geographicSummary.total} /> : null}
            {hiddenGroups.length ? <p className={styles.dataNote}>Totais protegidos {disability ? "nesta categoria" : `em ${hiddenGroups.map(group => disabilityGroups[group]).join(", ")}`}.</p> : null}
          </> : <p className={styles.dataNote}>{refreshing ? "Carregando as categorias." : "O recorte por deficiência está indisponível neste momento."}</p>}
          <p className={styles.dataNote}>Fontes: Squad Aché e fichas de candidatos. As categorias acompanham o público e o território selecionados. Recortes pequenos têm dados protegidos.</p>
        </article>
      </section> : null}
      {summary ? <>
      <div className={styles.selectionLine}><span><i aria-hidden="true" />{selection}</span><span aria-live="polite" aria-atomic="true">{summary.total} de {overview.total} {approvedSelected ? "aprovados" : "participantes"} · {percent(summary.total, overview.total)} {approvedSelected ? "do grupo" : "da base"}</span></div>

      <section className={styles.kpis} aria-label="Indicadores do recorte">
        <article className={styles.kpiPrimary}><div><span>{approvedSelected ? "Aprovados" : "Participantes"}</span><UsersRound size={20} aria-hidden="true" /></div><strong data-testid="kpi-total">{summary.total}</strong><p>Pessoas representadas no recorte</p><span className={styles.kpiPill}>{percent(summary.total, overview.total)} {approvedSelected ? "do total de aprovados" : "da base completa"}</span></article>
        <article><div><span>Cidades / localidades</span><MapPin size={20} aria-hidden="true" /></div><strong>{number(summary.cityCount)}</strong><p>Entradas únicas de localidade</p><span className={styles.kpiFootnote}>Conforme tratamento da planilha</span></article>
        <article><div><span>UFs representadas</span><MapPinned size={20} aria-hidden="true" /></div><strong>{number(summary.stateCount)}</strong><p>Presença em {summary.regionCount === null ? "—" : summary.regionCount} {summary.regionCount === 1 ? "região" : "regiões"} do Brasil</p><span className={styles.kpiFootnote}>Alcance geográfico do programa</span></article>
        <article><div><span>Idade média</span><CalendarDays size={20} aria-hidden="true" /></div><strong data-testid="kpi-age">{number(summary.age?.mean ?? null)}<small>anos</small></strong><p>{summary.age ? `${summary.age.valid} idades válidas no cálculo` : "Detalhamento consolidado"}</p><span className={styles.kpiFootnote}>Referência: {dateLabel}</span></article>
      </section>

      {summary.restricted ? <section className={styles.restricted} data-testid="restricted"><ShieldCheck size={30} aria-hidden="true" /><h2>{summary.total ? "Um recorte pequeno pede uma visão mais ampla." : "Nenhum participante neste recorte."}</h2><p>Para proteger grupos com menos de {dataset.source.minimumCohort} pessoas, exibimos apenas o total. Amplie o recorte para consultar o perfil consolidado.</p>{geographicFilter ? <button type="button" className={styles.exportButton} onClick={() => updateFilters(emptyFilters)}>Limpar recorte geográfico<ArrowUpRight size={17} aria-hidden="true" /></button> : null}</section> : distributions ? <>
        {topState || middleAge !== null || topEducation ? <section className={styles.highlights} aria-label="Destaques do recorte"><div><span className={styles.highlightIcon}><Layers3 size={19} aria-hidden="true" /></span><div><strong>O que os dados mostram</strong><span>Leituras do recorte atual</span></div></div>{topState ? <p><strong>{percent(topState.count, summary.total)}</strong> estão em <b>{topState.label}</b></p> : null}{middleAge !== null ? <p><strong>{percent(middleAge, summary.total)}</strong> têm entre <b>35 e 54 anos</b></p> : null}{topEducation ? <p><strong>{percent(topEducation.count, summary.total)}</strong> em <b>{topEducation.label}</b></p> : null}</section> : null}

        <section id="profile" className={styles.section} aria-labelledby="profile-heading"><div className={styles.sectionTitle}><h2 id="profile-heading">Perfil demográfico</h2><span>Diferentes trajetórias, uma jornada em comum</span></div>
          <div className={styles.twoColumns}>
            <article className={styles.card}><ChartHeading eyebrow="DIVERSIDADE" title="Identidade de gênero" /><GenderChart items={distributions.gender} total={summary.total} /></article>
            <article className={styles.card}><ChartHeading eyebrow="GERAÇÕES" title="Faixa etária" note="Participantes por faixa" /><AgeChart items={distributions.ageBands} />{summary.age?.invalid ? <p className={styles.dataNote}>{summary.age.invalid} {summary.age.invalid === 1 ? "idade não informada ou inconsistente foi excluída" : "idades não informadas ou inconsistentes foram excluídas"} da média.</p> : <p className={styles.dataNote}>Idades na data de referência da base.</p>}</article>
          </div>
          <article className={`${styles.card} ${styles.raceCard}`}><div><ChartHeading eyebrow="DIVERSIDADE RACIAL" title="Raça / cor" /><p className={styles.cardDescription}>Distribuição conforme as informações declaradas na base.</p>{distributions.race.some(item => item.label === protectedBucket) ? null : <span className={styles.softBadge}>{percent(distributions.race.filter(item => ["Preta", "Parda"].includes(item.label)).reduce((sum, item) => sum + item.count, 0), summary.total)} pessoas pretas e pardas</span>}</div><Bars items={distributions.race} total={summary.total} color="#89719f" /></article>
        </section>

        <section id="geography" className={styles.section} aria-labelledby="geography-heading"><div className={styles.sectionTitle}><h2 id="geography-heading">Onde a inclusão chega</h2><span>{summary.regionCount} {summary.regionCount === 1 ? "região" : "regiões"} · {summary.stateCount} UFs · {summary.cityCount} localidades</span></div>
          <div className={styles.twoColumns}>
            <article className={styles.card}><ChartHeading eyebrow="BRASIL" title="Por região" note="Clique para explorar" /><Bars items={distributions.regions} total={summary.total} color="#759985" onSelect={region => updateFilters({ region, state: "", spRegion: "" })} /><div className={styles.chartFooter}><MapPinned size={16} aria-hidden="true" /><span>Os percentuais consideram o recorte selecionado.</span></div></article>
            <article className={styles.card}><ChartHeading eyebrow="PRESENÇA NACIONAL" title="Por unidade federativa" note="Clique para filtrar" /><div className={styles.stateGrid}>{distributions.states.map(item => <button type="button" key={item.label} disabled={["Não informado", protectedBucket].includes(item.label)} onClick={() => selectState(item.label)} aria-label={`${item.label}, ${item.count} participantes`}><span>{item.label}</span><strong>{item.count}</strong><small>{percent(item.count, summary.total)}</small></button>)}</div></article>
            <article className={styles.card}><ChartHeading eyebrow="CAPILARIDADE" title="Principais localidades" note={disability ? `A partir de ${dataset.source.minimumCohort} participantes` : "A partir de 3 participantes"} /><div className={styles.tableWrapper}><table className={styles.cityTable}><thead><tr><th scope="col">Localidade</th><th scope="col">Pessoas</th><th scope="col">% do recorte</th></tr></thead><tbody>{distributions.cities.map(item => <tr key={item.label}><td>{item.label}</td><td>{item.count}</td><td>{percent(item.count, summary.total)}</td></tr>)}</tbody></table></div><p className={styles.dataNote}>Entradas de localidade preservadas da planilha. As demais foram consolidadas para esta leitura.</p></article>
            <article className={styles.card}><ChartHeading eyebrow="SÃO PAULO" title="Regiões do estado" note={distributions.spRegions.length ? `${distributions.spRegions.reduce((sum, item) => sum + item.count, 0)} participantes em SP` : undefined} /><Bars items={distributions.spRegions} total={summary.total} color="#dd875c" onSelect={spRegion => updateFilters({ region: "Sudeste", state: "SP", spRegion })} />{distributions.spRegions.length ? <p className={styles.dataNote}>Macrorregiões analíticas da planilha. Clique em uma região para explorar.</p> : <p className={styles.dataNote}>Selecione Brasil, Sudeste ou SP para explorar esta distribuição.</p>}</article>
          </div>
        </section>

        <section id="education" className={styles.section} aria-labelledby="education-heading"><div className={styles.sectionTitle}><h2 id="education-heading">Repertórios que se encontram</h2><span>Formação e trajetórias acadêmicas</span></div>
          <div className={`${styles.twoColumns} ${styles.educationColumns}`}>
            <article className={styles.card}><ChartHeading eyebrow="FORMAÇÃO" title="Áreas de conhecimento" note={`${distributions.education.length} agrupamentos`} /><Bars items={showEducation ? distributions.education : distributions.education.slice(0, 6)} total={summary.total} />{distributions.education.length > 6 ? <button type="button" className={styles.expandButton} onClick={() => setShowEducation(!showEducation)} aria-expanded={showEducation}>{showEducation ? "Mostrar principais áreas" : "Ver todas as áreas"}<ChevronDown size={16} aria-hidden="true" style={showEducation ? { transform: "rotate(180deg)" } : undefined} /></button> : null}</article>
            <article className={styles.card}><ChartHeading eyebrow="TRAJETÓRIA ACADÊMICA" title="Situação da formação" /><Bars items={distributions.educationStatus} total={summary.total} color="#759985" /><div className={styles.educationNote}><GraduationCap size={24} aria-hidden="true" /><strong>Diferentes saberes, novas possibilidades.</strong><p>Os agrupamentos reproduzem a classificação da base. “Superior informada” não confirma a conclusão do curso.</p></div></article>
          </div>
        </section>
      </> : null}

      <details className={styles.methodology}><summary><CircleHelp size={17} aria-hidden="true" />Como ler estes indicadores<ChevronDown size={16} aria-hidden="true" /></summary><div>
        <p><strong>Fonte.</strong> Planilha demográfica do Programa de Inclusão PcD Aché, aba Base Tratada, com referência em {dateLabel}. O painel consulta as planilhas ao abrir, a cada 5 minutos enquanto a página está visível e ao clicar em Atualizar dados. Em caso de falha na consulta à base demográfica, a última carga permanece visível com um aviso.</p>
        <p><strong>Público.</strong> Geral inclui toda a base demográfica. Aprovados inclui todos os nomes das listas das turmas A, B e C. Quando falta uma correspondência única, a pessoa entra no total com os dados demográficos como não informados.</p>
        <p><strong>Cálculos.</strong> Quantidades e percentuais seguem o público, o território e a categoria de deficiência selecionados. O público selecionado tem {overview.total} participantes. A idade média considera idades válidas entre 18 e 100 anos. Gênero, raça/cor e formação seguem as categorias da planilha.</p>
        <p><strong>Localidades.</strong> O painel conta entradas únicas com informação de cidade ou localidade. As macrorregiões de SP seguem o agrupamento analítico do arquivo.</p>
        <p><strong>Dados consolidados.</strong> A página e a exportação usam resumos estatísticos. No cruzamento por deficiência, totais pequenos ficam protegidos e algumas categorias demográficas são agrupadas.</p>
      </div></details>
      </> : null}
      </> : <section className={styles.restricted} aria-live="polite">
        <Award size={30} aria-hidden="true" />
        <h2>Resultados das turmas A, B e C</h2>
        <p>{refreshing ? "Consultando as listas das turmas." : approvals?.error || "Aguardando as listas das turmas A, B e C."}</p>
      </section>}
      <footer className={styles.footer}><span>ACHÉ + PROSPER · PROGRAMA DE INCLUSÃO PcD</span><span>Mais que contratar, queremos incluir.</span><Link href="/home">Voltar ao Nexus<ArrowUpRight size={14} aria-hidden="true" /></Link></footer>
    </main>
  </div>;
}
