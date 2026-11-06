import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowDown, MessageCircle, Sparkles } from "lucide-react";
import survey from "./survey.json";
import styles from "./satisfaction.module.css";

export const metadata: Metadata = {
  title: "Satisfação | Retrospectiva Aché",
  description: "A jornada do Programa de Inclusão PcD pela voz de quem participou.",
};

const metrics = [
  { label: "Conteúdo", color: "#a0175d" },
  { label: "Recomendação", color: "#a55418" },
  { label: "Facilitação", color: "#19745b" },
];
const chapters = [
  { title: "O primeiro passo", story: "O início abriu espaço para refletir sobre a trajetória profissional e reconhecer competências que podem crescer com a prática." },
  { title: "Aprender em conjunto", story: "No ciclo com maior volume de respostas, a clareza do conteúdo e a troca de experiências ganharam destaque nas falas." },
  { title: "Acolhimento que dá confiança", story: "Os relatos conectaram um ambiente acessível à vontade de aprender, participar e se preparar para o mercado." },
  { title: "Da reflexão à aplicação", story: "Trabalhos em grupo e temas ligados ao cotidiano ajudaram a transformar autoconhecimento em ação. Foi o pico de recomendação da série." },
  { title: "Repertório para a profissão", story: "Cenários, cases e postura profissional aproximaram a formação da rotina de propagandista. Parte do aprendizado também foi levada para a vida pessoal." },
  { title: "Conhecimento que fica", story: "Na última rodada disponível, os participantes falaram de uma nova visão de mercado e das conexões que criaram durante a formação." },
];

const count = survey.reduce((sum, cycle) => sum + cycle.responses, 0);
const rating = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const day = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
const average = (cycle: typeof survey[number], metric: number) => cycle.sums[metric] / cycle.responses;
const totalAverage = (metric: number) => survey.reduce((sum, cycle) => sum + cycle.sums[metric], 0) / count;

function EvolutionChart() {
  const x = (index: number) => 58 + index * 110;
  const y = (value: number) => 22 + (10 - value) * 165;
  return (
    <figure className={styles.chart}>
      <figcaption>
        <h3>Como as notas evoluíram</h3>
        <p>Notas de 0 a 10. O gráfico amplia a faixa de 9 a 10 para mostrar as variações.</p>
      </figcaption>
      <div className={styles.chartScroll} tabIndex={0} role="region" aria-label="Gráfico de evolução das notas">
        <svg viewBox="0 0 650 220" role="img" aria-label="As três médias ficaram acima de 9,5. A recomendação atingiu o pico no ciclo 4 e caiu até o ciclo 6. As notas exatas aparecem por ciclo abaixo.">
          {[10, 9.75, 9.5, 9.25, 9].map(value => (
            <g key={value}>
              <line x1="54" y1={y(value)} x2="616" y2={y(value)} stroke="#e6dce2" />
              <text x="43" y={y(value) + 4} textAnchor="end">{value.toLocaleString("pt-BR")}</text>
            </g>
          ))}
          {metrics.map(({ label, color }, metric) => (
            <g key={label}>
              <polyline points={survey.map((cycle, i) => `${x(i)},${y(average(cycle, metric))}`).join(" ")} fill="none" stroke={color} strokeWidth="3" strokeDasharray={metric === 1 ? "7 4" : undefined} />
              {survey.map((cycle, i) => <circle key={i} cx={x(i)} cy={y(average(cycle, metric))} r={metric === 1 ? 3 : 4} fill={color}>
                <title>{`Ciclo ${i + 1} · ${label} ${rating.format(average(cycle, metric))}`}</title>
              </circle>)}
            </g>
          ))}
          {survey.map((_, i) => <text key={i} x={x(i)} y="209" textAnchor="middle">Ciclo {i + 1}</text>)}
        </svg>
      </div>
      <ul className={styles.legend}>
        {metrics.map(({ label, color }) => <li key={label}><span style={{ background: color }} />{label}</li>)}
      </ul>
    </figure>
  );
}

export default function SatisfactionPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav} aria-label="Navegação da retrospectiva">
        <Link href="/home"><ArrowLeft size={16} aria-hidden="true" /> Voltar à retrospectiva</Link>
      </nav>
      <header className={styles.hero}>
        <p className={styles.kicker}>Retrospectiva Aché · Pesquisa de satisfação</p>
        <h1>Uma formação contada por quem a viveu.</h1>
        <p className={styles.lead}>Do primeiro encontro à aplicação no dia a dia, as avaliações e os depoimentos mostram o que marcou a jornada de inclusão e formação de propagandistas.</p>
        <div className={styles.heroStats}>
          <div><strong>{count}</strong><span>respostas válidas</span></div>
          <div><strong>{survey.length}</strong><span>ciclos de aula analisados</span></div>
          <div><strong>{rating.format(totalAverage(2))}<small> / 10</small></strong><span>média em facilitação</span></div>
        </div>
        <a href="#jornada" className={styles.cta}>Percorrer a jornada <ArrowDown size={16} /></a>
      </header>

      <section className={styles.overview} aria-labelledby="leitura">
        <div>
          <p className={styles.kicker}>A experiência em números</p>
          <h2 id="leitura">A qualidade se sustentou ao longo dos ciclos</h2>
          <p>Clareza na facilitação, conteúdos ligados à prática e um espaço acolhedor para trocar experiências apareceram entre os elogios. O ciclo 4 reuniu as melhores médias de facilitação e recomendação. No ciclo 6, a recomendação recuou para {rating.format(average(survey[5], 1))}, enquanto a facilitação seguiu bem avaliada, com {rating.format(average(survey[5], 2))}.</p>
          <dl className={styles.means}>
            {metrics.map(({ label, color }, i) => <div key={label} style={{ borderLeftColor: color }}>
              <dt>{label}</dt><dd>{rating.format(totalAverage(i))}<small> / 10</small>
                <span>{survey.reduce((sum, cycle) => sum + cycle.high[i], 0)} notas de 9 ou 10</span>
              </dd>
            </div>)}
          </dl>
        </div>
        <EvolutionChart />
      </section>

      <section id="jornada" className={styles.journey} aria-labelledby="jornada-titulo">
        <p className={styles.kicker}>Seis capítulos, muitas vozes</p>
        <h2 id="jornada-titulo">O que ficou de cada ciclo</h2>
        <p>Os ciclos têm cinco dias de aula como referência. As datas abaixo correspondem à coleta das respostas de cada rodada.</p>
        <ol className={styles.timeline}>
          {survey.map((cycle, i) => (
            <li key={cycle.start} className={styles.chapter}>
              <div className={styles.number} aria-hidden="true">{String(i + 1).padStart(2, "0")}</div>
              <div>
                <p className={styles.kicker}>Ciclo {i + 1} · {cycle.responses} respostas</p>
                <h3>{chapters[i].title}</h3>
                <p className={styles.collection}>Coleta de {day.format(new Date(cycle.start))} a {day.format(new Date(cycle.end))}</p>
                <p>{chapters[i].story}</p>
                <dl className={styles.cycleScores}>
                  {metrics.map(({ label, color }, m) => <div key={label}><dt>{label}</dt><dd style={{ color }}>{rating.format(average(cycle, m))}</dd></div>)}
                </dl>
                <div className={styles.quotes}>
                  {cycle.quotes.map(quote => <blockquote key={quote}><MessageCircle size={17} aria-hidden="true" /><p>“{quote}”</p></blockquote>)}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.closing} aria-labelledby="fechamento">
        <Sparkles size={26} aria-hidden="true" />
        <div>
          <p className={styles.kicker}>Próximo capítulo</p>
          <h2 id="fechamento">Pesquisa final</h2>
          <p>O quadro registra 60 respostas na rodada final. Os indicadores e depoimentos dessa rodada aguardam a planilha correspondente.</p>
        </div>
      </section>
      <footer className={styles.method}>
        <h2>Como ler os dados</h2>
        <p>As médias gerais foram calculadas sobre as 492 respostas válidas das seis planilhas. A base exclui um registro de teste e as linhas de resumo. As rodadas podem ter públicos diferentes, e a mesma pessoa pode ter respondido mais de uma vez ao longo do programa. Os depoimentos selecionados são anônimos e vieram de registros marcados com autorização de publicação no formulário.</p>
      </footer>
    </main>
  );
}
