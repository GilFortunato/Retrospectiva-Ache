import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUpRight, Quote } from "lucide-react";
import { redirect } from "next/navigation";
import { currentPortalSession } from "@/lib/portalAuth";
import { retrospectiveDatabase } from "@/lib/retrospectiveDatabase";
import CycleComments from "./CycleComments";
import localSurvey from "./survey.json";
import styles from "./satisfaction.module.css";

export const metadata: Metadata = {
  title: "Satisfação | Retrospectiva Aché",
  description: "A jornada do Programa de Inclusão PcD pela voz de quem participou.",
};

type SurveyCycle = typeof localSurvey[number];

const metrics = [
  { label: "Conteúdo", color: "#a0175d" },
  { label: "Recomendação", color: "#a55418" },
  { label: "Facilitação", color: "#19745b" },
];
const chapters = [
  {
    title: "Um novo olhar para a própria trajetória",
    theme: "Autoconhecimento",
    story: "No primeiro ciclo, os participantes já ligavam o conteúdo a situações do próprio trabalho. Reconhecer competências e identificar onde queriam melhorar deu um ponto de partida concreto à formação.",
  },
  {
    title: "O grupo também ensina",
    theme: "Troca de experiências",
    story: "Na rodada com mais respostas, a clareza das explicações apareceu ao lado de outro elogio: aprender com quem estava na mesma jornada. Os relatos mostram o valor de ter espaço para perguntar, contribuir e trocar experiências.",
  },
  {
    title: "Acolhimento que dá confiança",
    theme: "Inclusão na prática",
    story: "Os relatos citaram a estrutura acessível e o acolhimento como parte da experiência de aprender. Um depoimento ligou esse ambiente à motivação para contribuir com a equipe e aplicar o que aprendeu.",
  },
  {
    title: "Quando o aprendizado vira prática",
    theme: "Aplicação no dia a dia",
    story: "Os trabalhos em grupo e a conexão com o dia a dia deram forma ao que vinha sendo discutido desde o início. Foi o ciclo com o maior NPS, com 79 promotores em 81 respostas.",
    process: "Uma sugestão pediu ampliar o encaminhamento dos participantes para vagas após a formação.",
  },
  {
    title: "Mais repertório para atuar no mercado",
    theme: "Prática profissional",
    story: "Cenários, casos e discussões sobre postura profissional aproximaram as aulas da rotina de propagandista. Houve quem enxergasse aplicação também fora do trabalho, em conversas e situações da vida pessoal.",
    process: "Apareceram pedidos por um cronograma mais claro e por informações concretas sobre a abertura de vagas e as próximas etapas.",
  },
  {
    title: "Conhecimento e vínculos que ficam",
    theme: "Continuidade",
    story: "Na última coleta, os participantes destacaram uma nova visão do mercado e a rede de colegas que se formou. A facilitação recebeu nota 9 ou 10 de 65 das 69 respostas, enquanto o NPS da recomendação caiu em relação ao ciclo anterior.",
    process: "Na reta final, alguns participantes ainda aguardavam informações sobre datas, vagas e as etapas do processo seletivo.",
  },
];

const rating = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const npsFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: "exceptZero" });
const day = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
const average = (cycle: SurveyCycle, metric: number) => cycle.sums[metric] / cycle.responses;
const npsOf = (cycle: SurveyCycle) => 100 * (cycle.high[1] - cycle.detractors) / cycle.responses;

async function readCycles() {
  if (!process.env.CANDIDATOS_DATABASE_URL) return localSurvey;
  const { rows } = await retrospectiveDatabase().query<{ summary: SurveyCycle }>(
    "SELECT summary FROM survey_cycles ORDER BY cycle",
  );
  if (rows.length !== chapters.length) throw new Error("Pesquisa de satisfação incompleta.");
  return rows.map(row => row.summary);
}

function EvolutionChart({ cycles }: { cycles: SurveyCycle[] }) {
  const x = (index: number) => 58 + index * 110;
  const y = (value: number) => 22 + (10 - value) * 165;
  return (
    <figure className={styles.chart}>
      <figcaption>
        <h2>Como as notas evoluíram</h2>
        <p>Notas de 0 a 10. O gráfico amplia a faixa de 9 a 10 para mostrar as variações.</p>
      </figcaption>
      <div className={styles.chartScroll} tabIndex={0} role="region" aria-label="Gráfico de evolução das notas">
        <svg viewBox="0 0 650 220" role="img" aria-label="Médias de conteúdo, recomendação e facilitação por ciclo. Os valores também aparecem nos capítulos.">
          {[10, 9.75, 9.5, 9.25, 9].map(value => (
            <g key={value}>
              <line x1="54" y1={y(value)} x2="616" y2={y(value)} stroke="#e6dce2" />
              <text x="43" y={y(value) + 4} textAnchor="end">{value.toLocaleString("pt-BR")}</text>
            </g>
          ))}
          {metrics.map(({ label, color }, metric) => (
            <g key={label}>
              <polyline points={cycles.map((cycle, i) => `${x(i)},${y(average(cycle, metric))}`).join(" ")} fill="none" stroke={color} strokeWidth="3" strokeDasharray={metric === 1 ? "7 4" : undefined} />
              {cycles.map((cycle, i) => <circle key={i} cx={x(i)} cy={y(average(cycle, metric))} r={metric === 1 ? 3 : 4} fill={color}>
                <title>{`Ciclo ${i + 1} · ${label} ${rating.format(average(cycle, metric))}`}</title>
              </circle>)}
            </g>
          ))}
          {cycles.map((_, i) => <text key={i} x={x(i)} y="209" textAnchor="middle">Ciclo {i + 1}</text>)}
        </svg>
      </div>
      <ul className={styles.legend}>
        {metrics.map(({ label, color }) => <li key={label}><span style={{ background: color }} />{label}</li>)}
      </ul>
    </figure>
  );
}

export default async function SatisfactionPage() {
  const session = await currentPortalSession().catch(() => null);
  if (!session) redirect("/login");
  if (session.must_change_password) redirect("/trocar-senha");

  const cycles = await readCycles().catch(() => null);
  if (!cycles) {
    return <main className={styles.page}>
      <Link href="/home">Voltar à retrospectiva</Link>
      <h1>Satisfação</h1>
      <p role="alert">Não foi possível carregar a pesquisa. Recarregue a página para tentar novamente.</p>
    </main>;
  }

  const count = cycles.reduce((sum, cycle) => sum + cycle.responses, 0);
  const promoters = cycles.reduce((sum, cycle) => sum + cycle.high[1], 0);
  const detractors = cycles.reduce((sum, cycle) => sum + cycle.detractors, 0);
  const totalNps = 100 * (promoters - detractors) / count;
  const peakNps = Math.max(...cycles.map(npsOf));
  const totalAverage = (metric: number) => cycles.reduce((sum, cycle) => sum + cycle.sums[metric], 0) / count;

  return (
    <main className={styles.page}>
      <nav className={styles.nav} aria-label="Navegação da retrospectiva">
        <Link href="/home"><ArrowLeft size={16} aria-hidden="true" /> Voltar à retrospectiva</Link>
        <span>Programa de Inclusão PcD Aché</span>
      </nav>

      <header className={styles.hero}>
        <div className={styles.heroStory}>
          <p className={styles.kicker}>Retrospectiva Aché · Pesquisa de satisfação</p>
          <h1>Da confiança à prática de ser <em>propagandista.</em></h1>
          <p className={styles.lead}>Seis ciclos de formação mostram como o grupo ganhou confiança, levou os conteúdos para a prática e criou vínculos que continuaram além das aulas.</p>
          <a href="#jornada" className={styles.cta}>Percorrer os seis ciclos <ArrowDown size={16} aria-hidden="true" /></a>
        </div>
        <aside className={styles.heroScore} aria-label="NPS consolidado da pesquisa">
          <span>NPS consolidado</span>
          <strong>{npsFormat.format(totalNps)}</strong>
          <p>{promoters} respostas promotoras em {count} avaliações de recomendação</p>
          <dl>
            <div><dt>Ciclos de aula</dt><dd>{cycles.length}</dd></div>
            <div><dt>Respostas válidas</dt><dd>{count}</dd></div>
          </dl>
        </aside>
      </header>

      <section className={styles.overview} aria-labelledby="nps-ciclos">
        <p className={styles.kicker}>A evolução da recomendação</p>
        <h2 id="nps-ciclos">NPS ciclo a ciclo</h2>
        <p className={styles.sectionLead}>O ciclo 4 marcou o ponto mais alto da recomendação. Na reta final, o NPS recuou, enquanto as avaliações da facilitação permaneceram altas.</p>
        <ol className={styles.npsGrid}>
          {cycles.map((cycle, i) => {
            const peak = npsOf(cycle) === peakNps;
            return <li key={cycle.start}>
              <a href={`#ciclo-${i + 1}`} className={peak ? styles.peak : undefined}>
                <span className={styles.npsLabel}>Ciclo {i + 1} <ArrowUpRight size={15} aria-hidden="true" /></span>
                <strong>{npsFormat.format(npsOf(cycle))}</strong>
                <span className={styles.npsFoot}>{peak ? "Pico da série" : `${cycle.responses} respostas`}</span>
              </a>
            </li>;
          })}
        </ol>
        <p className={styles.method}>O NPS é a diferença entre a porcentagem de promotores (notas 9 e 10) e a de detratores (notas 0 a 6). Notas 7 e 8 são neutras.</p>
        <dl className={styles.means}>
          {metrics.map(({ label, color }, i) => <div key={label} style={{ borderLeftColor: color }}>
            <dt>Média de {label.toLocaleLowerCase("pt-BR")}</dt>
            <dd>{rating.format(totalAverage(i))}<small> / 10</small></dd>
          </div>)}
        </dl>
      </section>

      <section id="jornada" className={styles.journey} aria-labelledby="jornada-titulo">
        <p className={styles.kicker}>Seis capítulos, muitas vozes</p>
        <h2 id="jornada-titulo">O que ficou de cada ciclo</h2>
        <p className={styles.sectionLead}>Cada ciclo toma cinco dias de aula como referência. As datas nos cartões indicam o período de coleta das respostas.</p>
        <ol className={styles.timeline}>
          {cycles.map((cycle, i) => {
            const chapter = chapters[i];
            const cycleNumber = i + 1;
            const passives = cycle.responses - cycle.high[1] - cycle.detractors;
            return (
              <li id={`ciclo-${cycleNumber}`} key={cycle.start} className={styles.chapter}>
                <div className={styles.chapterHeader}>
                  <div className={styles.chapterStory}>
                    <p className={styles.kicker}>Ciclo {String(cycleNumber).padStart(2, "0")} · {chapter.theme}</p>
                    <h3>{chapter.title}</h3>
                    <p className={styles.collection}>Coleta de {day.format(new Date(cycle.start))} a {day.format(new Date(cycle.end))} · {cycle.responses} respostas</p>
                    <p>{chapter.story}</p>
                  </div>
                  <div className={styles.chapterScore}>
                    <div><span>NPS do ciclo</span><strong>{npsFormat.format(npsOf(cycle))}</strong></div>
                    <p>{cycle.high[1]} promotores · {passives} neutros · {cycle.detractors} detratores</p>
                    <dl className={styles.cycleScores}>
                      {metrics.map(({ label, color }, m) => <div key={label}><dt>{label}</dt><dd style={{ color }}>{rating.format(average(cycle, m))}</dd></div>)}
                    </dl>
                  </div>
                </div>
                <div className={styles.quotes}>
                  {cycle.quotes.map(quote => <blockquote key={quote}><Quote size={19} aria-hidden="true" /><p>“{quote}”</p></blockquote>)}
                </div>
                {chapter.process ? <aside className={styles.processNote}>
                  <h4>Cronograma e próximos passos</h4>
                  <p>{chapter.process}</p>
                </aside> : null}
                <CycleComments cycle={cycleNumber} count={cycle.commentCount} />
              </li>
            );
          })}
        </ol>
      </section>

      <section className={styles.evolution} aria-label="Síntese das avaliações">
        <EvolutionChart cycles={cycles} />
      </section>
    </main>
  );
}
