import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  GraduationCap,
  HeartHandshake,
  Network,
  Rocket,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";

const levels = [
  {
    n: "01",
    name: "Exploradoras da IA",
    level: "Iniciante",
    purpose: "Desmistificar a inteligência artificial e transformar curiosidade em uso prático.",
    items: [
      "Letramento Digital e Tecnológico",
      "Engenharia de Prompt",
      "IA aplicada ao dia a dia",
      "Organização e Produtividade",
    ],
  },
  {
    n: "02",
    name: "Transformadoras",
    level: "Intermediária",
    purpose: "Aplicar IA estrategicamente a demandas profissionais e ganhar produtividade.",
    items: [
      "Prompt Estratégico",
      "Aplicação Estratégica",
      "Design de Soluções com Agentes",
      "Criação de Conteúdo com IA",
    ],
  },
  {
    n: "03",
    name: "Criadoras do Futuro",
    level: "Avançada",
    purpose: "Construir soluções, automações e novas formas de decidir e comunicar com IA.",
    items: [
      "Resolução Criativa de Problemas",
      "Automação Inteligente",
      "Comunicação Estratégica",
      "Decisão Orientada por Dados",
    ],
  },
];

const journey = [
  ["Assessment inicial", "Entende o nível de conhecimento e identifica os principais gaps."],
  ["Trilha personalizada", "Direciona cada participante para conteúdos adequados ao seu momento."],
  ["Sprints de aprendizagem", "Ciclos curtos, práticos e conectados ao cotidiano profissional."],
  ["Mentorias", "Acompanhamento, orientação e troca para apoiar a evolução da jornada."],
  ["Projeto prático", "Aplicação da IA em um problema real do dia a dia ou do trabalho."],
  ["Assessment final", "Mede evolução e ajuda a tornar o desenvolvimento visível."],
];

export default function PotenciaPage() {
  return (
    <main className="potenciaExperience">
      <header className="experienceHeader potenciaExperienceHeader">
        <div className="experienceBrand">
          <Link href="/home" aria-label="Ir para Home" className="headerLogoLink">
            <Image
              src="/brand/ache-logo-tagline.webp"
              alt="Aché"
              width={115}
              height={69}
              className="acheHeaderLogo"
              priority
            />
          </Link>
          <strong>Programa PcD – Propagandista Trainee</strong>
        </div>
        <Link href="/home" className="backNexus potenciaBack">
          <ArrowLeft size={17} />
          Voltar ao Nexus
        </Link>
      </header>

      <section className="potenciaHeroNew">
        <Image
          src="/potencia/potencia-bg.webp"
          alt=""
          fill
          priority
          className="potenciaHeroBg"
        />
        <div className="potenciaHeroInner">
          <div className="potenciaHeroCopyNew">
            <Image
              src="/potencia/potencia-logo.webp"
              alt="Potenc.IA"
              width={300}
              height={81}
              className="potenciaOfficialLogo"
              priority
            />
            <p className="potenciaEyebrow">Um movimento de inclusão produtiva</p>
            <h1>Impulsionando carreiras femininas <em>por meio da IA.</em></h1>
            <p className="potenciaLead">
              O Potenc.IA nasce para ampliar o acesso de mulheres às habilidades que estão
              redefinindo o futuro do trabalho — com formação prática, personalização e
              conexão com oportunidades reais.
            </p>
            <a href="#porque" className="potenciaPrimaryCta">
              Entenda o Potenc.IA <ArrowRight size={18} />
            </a>
          </div>

          <div className="potenciaHeroPeople">
            <div className="potenciaGlow" />
            <Image
              src="/potencia/potencia-mulheres.webp"
              alt="Mulheres representando a identidade visual do Potenc.IA"
              width={460}
              height={292}
              className="potenciaWomen"
              priority
            />
          </div>
        </div>
      </section>

      <section id="porque" className="potenciaWhy sectionPotencia">
        <div className="potenciaSectionIntro">
          <span>POR QUE ELE FOI CRIADO</span>
          <h2>A IA avançou rápido. O acesso às oportunidades, nem sempre.</h2>
          <p>
            A inteligência artificial deixou de ser apenas uma tendência e passou a fazer
            parte das competências exigidas pelo mercado. Ao mesmo tempo, essa transformação
            pode ampliar desigualdades quando mulheres — especialmente em contextos de maior
            vulnerabilidade — ficam fora desse novo repertório.
          </p>
        </div>

        <div className="potenciaWhyGrid">
          <article>
            <span className="potenciaCardIcon"><BrainCircuit size={27} /></span>
            <h3>Uma nova habilidade essencial</h3>
            <p>
              Entender como usar IA deixou de ser um diferencial isolado e passou a influenciar
              produtividade, empregabilidade e desenvolvimento de carreira.
            </p>
          </article>
          <article>
            <span className="potenciaCardIcon"><HeartHandshake size={27} /></span>
            <h3>Reduzir a distância de acesso</h3>
            <p>
              O programa aproxima mulheres desse universo com linguagem acessível, prática e
              conectada a situações reais — sem exigir uma formação técnica prévia.
            </p>
          </article>
          <article>
            <span className="potenciaCardIcon"><Rocket size={27} /></span>
            <h3>Transformar conhecimento em oportunidade</h3>
            <p>
              A proposta não termina no aprendizado da ferramenta: ela busca ampliar autonomia,
              confiança, capacidade de criação e possibilidades profissionais.
            </p>
          </article>
        </div>
      </section>

      <section className="potenciaWhat sectionPotencia">
        <div className="potenciaWhatVisual">
          <span className="potenciaOrbit orbitA" />
          <span className="potenciaOrbit orbitB" />
          <div className="potenciaWhatCenter">
            <Image
              src="/potencia/potencia-logo.webp"
              alt="Potenc.IA"
              width={220}
              height={60}
            />
          </div>
        </div>

        <div className="potenciaWhatCopy">
          <span>O QUE É O POTENC.IA</span>
          <h2>Mais do que um curso, uma jornada de transformação.</h2>
          <p>
            O Potenc.IA é um programa de formação em Inteligência Artificial generativa
            criado pela Prosper Digital Skills. Ele combina diagnóstico de habilidades,
            trilhas personalizadas, aprendizagem em ciclos curtos, mentorias e aplicação
            prática para que a participante evolua de forma concreta.
          </p>
          <p>
            A lógica é simples: <strong>entender, experimentar, aplicar e transformar.</strong>
            Cada etapa foi desenhada para aproximar a IA da realidade das mulheres e tornar
            o aprendizado útil para a carreira.
          </p>

          <div className="potenciaPillRow">
            <span><Target size={17} /> Personalização</span>
            <span><Sparkles size={17} /> Aplicação prática</span>
            <span><UsersRound size={17} /> Mentoria</span>
            <span><BriefcaseBusiness size={17} /> Empregabilidade</span>
          </div>
        </div>
      </section>

      <section className="potenciaImpactNew sectionPotencia">
        <div className="potenciaImpactHeadline">
          <span>NOSSA AMBIÇÃO</span>
          <strong>10.000</strong>
          <h2>mulheres impactadas</h2>
          <p>
            Uma meta que transforma formação em escala e posiciona o Potenc.IA como um
            movimento de acesso, qualificação e inclusão produtiva.
          </p>
        </div>

        <div className="potenciaImpactCards">
          <article>
            <span>29%</span>
            <p>da meta já alcançada no ciclo apresentado pelo programa.</p>
          </article>
          <article>
            <span>2.900</span>
            <p>vagas viabilizadas até o momento reportado na edição 2025.</p>
          </article>
          <article>
            <Network size={34} />
            <p>Comunidade, empresas patrocinadoras, embaixadoras e parceiros conectados.</p>
          </article>
        </div>
      </section>

      <section className="potenciaLevelsNew sectionPotencia">
        <div className="potenciaSectionIntro">
          <span>CONTEÚDO EM 3 NÍVEIS</span>
          <h2>Uma trilha para cada momento de maturidade em IA.</h2>
          <p>
            O ponto de partida muda. O objetivo é o mesmo: fazer a participante avançar com
            segurança e aplicar IA de forma útil, responsável e estratégica.
          </p>
        </div>

        <div className="potenciaLevelGridNew">
          {levels.map((level) => (
            <article key={level.n}>
              <div className="potenciaLevelTop">
                <span>{level.n}</span>
                <small>{level.level}</small>
              </div>
              <h3>{level.name}</h3>
              <p>{level.purpose}</p>
              <ul>
                {level.items.map((item) => (
                  <li key={item}><CheckCircle2 size={16} />{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="potenciaJourneyNew sectionPotencia">
        <div className="potenciaSectionIntro">
          <span>COMO A JORNADA FUNCIONA</span>
          <h2>Do diagnóstico ao projeto prático.</h2>
          <p>
            O desenvolvimento acontece em etapas conectadas, para que aprender IA não seja
            um evento pontual, mas uma evolução acompanhada.
          </p>
        </div>

        <div className="potenciaJourneyRailNew">
          {journey.map(([title, text], index) => (
            <article key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="potenciaProject sectionPotencia">
        <div>
          <span>PROJETO PRÁTICO + MENTORIAS</span>
          <h2>Aprender fazendo.</h2>
          <p>
            Ao longo da jornada, a participante identifica um problema real do cotidiano ou
            do ambiente de trabalho e desenvolve uma solução usando IA. As mentorias ajudam
            a revisar resultados, enfrentar obstáculos, refinar abordagens e transformar
            conhecimento em entrega.
          </p>
        </div>

        <div className="potenciaProjectSteps">
          <article><span>Semana 1</span><strong>Identificar</strong><p>Escolher um problema real.</p></article>
          <article><span>Semana 2</span><strong>Planejar</strong><p>Estruturar a solução com IA.</p></article>
          <article><span>Semana 3</span><strong>Executar</strong><p>Construir e testar.</p></article>
          <article><span>Semana 4</span><strong>Ajustar</strong><p>Validar, aprender e apresentar.</p></article>
        </div>
      </section>

      <section className="potenciaMovement sectionPotencia">
        <div className="potenciaMovementCopy">
          <span>UM MOVIMENTO</span>
          <h2>Indo além da formação.</h2>
          <p>
            O Potenc.IA foi estruturado para ampliar a conversa sobre IA, empregabilidade e
            inclusão produtiva. Comunicação, presença digital, eventos, embaixadoras,
            empresas patrocinadoras e comunidade ajudam a multiplicar esse impacto.
          </p>
        </div>
        <div className="potenciaMovementQuote">
          <Image
            src="/potencia/potencia-logo.webp"
            alt="Potenc.IA"
            width={220}
            height={60}
          />
          <blockquote>
            “Um programa com o poder de impulsionar carreiras femininas, por meio da IA.”
          </blockquote>
        </div>
      </section>
    </main>
  );
}
