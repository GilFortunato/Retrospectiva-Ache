import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  Gauge,
  GraduationCap,
  Network,
  Rocket,
  Target,
  UsersRound,
  WandSparkles,
} from "lucide-react";

const fallbackData: Record<string, { title: string; description: string }> = {
  ache: { title: "Aché", description: "Conheça a marca, o programa e a jornada de inclusão." },
  cultura: { title: "Cultura", description: "Cultura Aché, valores e contexto para a jornada de Propagandista Trainee." },
  vagas: { title: "Vagas", description: "Oportunidades e conteúdos de preparação para carreira." },
  comunidade: { title: "Comunidade", description: "Histórias, experiências e vídeos da comunidade." },
  rebrand: { title: "ReBrand Pessoal", description: "Diagnóstico de LinkedIn e marca profissional orientado à carreira de Propagandista." },
};

function Header() {
  return (
    <header className="experienceHeader">
      <div className="experienceBrand">
        <Image
          src="/brand/ache-logo-tagline.webp"
          alt="Aché"
          width={115}
          height={69}
          className="acheHeaderLogo"
          priority
        />
        <strong>Programa PcD – Propagandista Trainee</strong>
      </div>
      <Link href="/home" className="backNexus">
        <ArrowLeft size={18} aria-hidden="true" />
        Voltar ao Nexus
      </Link>
    </header>
  );
}

function ProsperPage() {
  const areas = [
    {
      title: "Letramento Digital e Inic.IA",
      description: "Formação acessível para desenvolver competências digitais e começar a usar inteligência artificial com segurança e propósito.",
      icon: GraduationCap,
    },
    {
      title: "AI for Business",
      description: "Capacitação de equipes para aplicar IA em processos, rotinas e desafios reais das organizações.",
      icon: BrainCircuit,
    },
    {
      title: "AI Builders",
      description: "Aprendizagem prática para que profissionais transformem problemas em protótipos, automações e soluções.",
      icon: Rocket,
    },
    {
      title: "Education Recruiting",
      description: "Jornadas que conectam atração de talentos, qualificação e oportunidades de desenvolvimento profissional.",
      icon: BriefcaseBusiness,
    },
  ];

  return (
    <main className="experiencePage prosperLanding prosperAboutPage">
      <Header />

      <section className="prosperAboutIntro" aria-labelledby="prosper-about-title">
        <div className="prosperAboutIntroContent">
          <span className="prosperAboutLabel">SOBRE A PROSPER DIGITAL SKILLS</span>
          <h1 id="prosper-about-title">Desenvolvemos habilidades para o futuro do trabalho.</h1>
          <p>
            A Prosper Digital Skills é a frente de educação e desenvolvimento da Share People Hub.
            Criamos experiências de aprendizagem em tecnologia, habilidades digitais e inteligência
            artificial para apoiar a evolução de profissionais e a capacitação de equipes.
          </p>
        </div>
        <aside className="prosperAboutNote">
          <span>O QUE NOS MOVE</span>
          <strong>Conhecimento que sai da teoria e ganha espaço na prática.</strong>
          <p>Aprender, experimentar e aplicar — respeitando diferentes pontos de partida.</p>
        </aside>
      </section>

      <section className="prosperAboutMain" aria-labelledby="prosper-areas-title">
        <div className="prosperAboutSectionHeading">
          <span className="prosperAboutLabel">NOSSA ATUAÇÃO</span>
          <h2 id="prosper-areas-title">O que a Prosper faz</h2>
          <p>
            Desenvolvemos programas para pessoas e empresas, combinando formação, projetos práticos
            e acompanhamento conforme cada necessidade.
          </p>
        </div>
        <div className="prosperAboutGrid">
          {areas.map(({ title, description, icon: Icon }) => (
            <article key={title} className="prosperAboutCard">
              <span className="prosperAboutCardIcon"><Icon size={25} aria-hidden="true" /></span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="prosperAboutMethod">
          <strong>Como trabalhamos</strong>
          <p>
            Partimos do diagnóstico das necessidades, organizamos trilhas de aprendizagem e
            incentivamos a aplicação do conhecimento. Com o Prosper Sprints, podemos acompanhar
            atividades, projetos e evolução dos participantes.
          </p>
        </div>
      </section>

      <section className="prosperAboutPotencia" aria-labelledby="prosper-potencia-title">
        <div className="prosperAboutPotenciaCopy">
          <span className="prosperAboutLabel">PROGRAMA EM DESTAQUE</span>
          <h2 id="prosper-potencia-title">Potenc.IA</h2>
          <p>
            Uma iniciativa de inclusão produtiva da Prosper que amplia o acesso de mulheres
            à inteligência artificial generativa. A jornada reúne formação prática, mentorias
            e experiências que conectam novas habilidades a possibilidades de carreira.
          </p>
          <Link href="/potencia" className="prosperAboutPotenciaLink">
            Conhecer o Potenc.IA <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <div className="prosperAboutPotenciaBrand">
          <Image
            src="/potencia/potencia-logo.webp"
            alt="Potenc.IA"
            width={310}
            height={84}
          />
          <p>Inteligência artificial, desenvolvimento e oportunidades para mulheres.</p>
        </div>
      </section>
    </main>
  );
}

function LetramentoPage() {
  const columns = [
    {
      icon: Target,
      title: "A solução",
      subtitle: "Programa de Habilidades Essenciais",
      text: "Desenvolvimento estruturado de competências digitais para profissionais de diferentes áreas, com foco especial em públicos não técnicos.",
    },
    {
      icon: Gauge,
      title: "Problemas que resolve",
      bullets: ["Dificuldade de adaptação ao digital", "Uso ineficiente de ferramentas", "Dependência excessiva de suporte", "Baixa autonomia das equipes"],
    },
    {
      icon: WandSparkles,
      title: "Diferenciais Prosper",
      bullets: ["Conteúdo aplicado ao contexto real", "Linguagem acessível e adaptável", "Online, presencial ou gravado", "Personalização por nível de maturidade"],
    },
  ];

  return (
    <main className="experiencePage letramentoLanding">
      <Header />
      <section className="landingSection letramentoHero">
        <div className="letramentoHeroIcon"><Network size={54} /></div>
        <div>
          <span className="sectionTag">DESENVOLVIMENTO DE HABILIDADES DIGITAIS</span>
          <h1>Letramento Digital: <em>Preparando Times para Novas Formas de Trabalho</em></h1>
          <p className="lead">
            Tornando a tecnologia acessível e eficiente para criar uma base sólida de evolução
            para suas equipes.
          </p>
        </div>
      </section>

      <section className="landingSection letramentoCore">
        <div className="letramentoGrid">
          {columns.map(({ icon: Icon, title, subtitle, text, bullets }) => (
            <article key={title} className="letramentoCard">
              <Icon size={30} />
              <h2>{title}</h2>
              {subtitle && <strong>{subtitle}</strong>}
              {text && <p>{text}</p>}
              {bullets && <ul>{bullets.map((item) => <li key={item}><CheckCircle2 size={17} />{item}</li>)}</ul>}
            </article>
          ))}
        </div>
      </section>

      <section className="landingSection letramentoBenefits">
        <div>
          <span className="sectionTag">BENEFÍCIOS PARA O NEGÓCIO</span>
          <h2>Mais autonomia. Menos barreiras.</h2>
          <ul>
            <li><CheckCircle2 />Aumento da autonomia e produtividade</li>
            <li><CheckCircle2 />Uso inteligente do ecossistema digital</li>
            <li><CheckCircle2 />Redução de chamados de suporte técnico</li>
            <li><CheckCircle2 />Base sólida para evolução digital</li>
          </ul>
        </div>
        <aside className="formatCard">
          <span className="sectionTag">FORMATO DO PROGRAMA</span>
          <div><strong>Carga horária</strong><span>Flexível e adaptada aos objetivos.</span></div>
          <div><strong>Estrutura</strong><span>Modular, ajustada conforme o público-alvo.</span></div>
          <div><strong>Aplicação</strong><span>Todas as áreas e perfis corporativos.</span></div>
        </aside>
      </section>
    </main>
  );
}

function PotenciaPage() {
  const differentials = ["Jornada estruturada", "Aprendizado aplicado", "Personalização via assessment", "Ciclos curtos", "Ferramentas de IA diversas"];
  const levels = [
    { n: "01", name: "Exploradoras da IA", level: "Iniciante · 14h", text: "Desmistificar a IA, desenvolver letramento digital e promover o uso prático no cotidiano.", items: ["Letramento Digital e Tecnológico", "Engenharia de Prompt", "IA no dia a dia", "Organização e Produtividade"] },
    { n: "02", name: "Transformadoras", level: "Intermediária · 14h", text: "Desenvolver habilidades práticas de IA em contextos profissionais.", items: ["Prompt Estratégico", "Aplicação Estratégica", "Design com Agentes", "Criação de Conteúdo"] },
    { n: "03", name: "Criadoras", level: "Avançada · 14h", text: "Desenvolver soluções com IA e liderar iniciativas transformadoras.", items: ["Resolução de Problemas", "Automação Inteligente", "Comunicação Estratégica", "Decisão Orientada por Dados"] },
  ];

  return (
    <main className="experiencePage potenciaLanding">
      <Header />
      <section className="landingSection potenciaHero">
        <div className="potenciaHeroCopy">
          <span className="potenciaBrand">Potenc.IA</span>
          <h1>Impulsionando carreiras femininas <em>por meio da IA.</em></h1>
          <p>
            Um movimento para promover a aceleração da carreira de mulheres por meio do
            letramento em Inteligência Artificial.
          </p>
          <a href="#jornada" className="potenciaCta">Conheça a jornada <ArrowRight size={18} /></a>
        </div>
        <div className="potenciaVisual" aria-hidden="true">
          <div className="neonMesh" />
          <div className="aiBadge"><BrainCircuit size={56} /><span>IA</span></div>
          <div className="neonDot dot1" /><div className="neonDot dot2" /><div className="neonDot dot3" />
        </div>
      </section>

      <section className="landingSection potenciaImpact">
        <div className="impactNumber">10.000</div>
        <div>
          <span>mulheres</span>
          <p>colaboradoras e da comunidade como meta de impacto do movimento.</p>
        </div>
        <div className="impactGauge"><strong>29%</strong><span>marco já alcançado</span></div>
      </section>

      <section className="landingSection potenciaProposal">
        <div className="sectionHeading">
          <span className="potenciaTag">A PROPOSTA</span>
          <h2>Uma jornada. Não um curso isolado.</h2>
          <p>Formação em IA generativa com foco em habilidades práticas, personalização da aprendizagem e conexão com oportunidades reais.</p>
        </div>
        <div className="potenciaDiffGrid">
          {differentials.map((item, i) => (
            <article key={item}><span>0{i+1}</span><strong>{item}</strong></article>
          ))}
        </div>
      </section>

      <section id="jornada" className="landingSection potenciaJourney">
        <div className="sectionHeading">
          <span className="potenciaTag">JORNADA</span>
          <h2>Aprender, experimentar e transformar.</h2>
        </div>
        <div className="journeyRail">
          <article><span>01</span><h3>Assessment inicial</h3><p>Avalia conhecimento e identifica gaps para uma trilha personalizada.</p></article>
          <ArrowRight className="railArrow" />
          <article><span>02</span><h3>Sprints de aprendizagem</h3><p>Caminho focado nos gaps individuais, com conteúdo relevante e adaptado.</p></article>
          <ArrowRight className="railArrow" />
          <article><span>03</span><h3>Assessment final</h3><p>Mede progresso e avalia a eficácia dos projetos desenvolvidos.</p></article>
        </div>
        <div className="journeySupport">
          <span><UsersRound /> Mentoria</span>
          <span><GraduationCap /> Conteúdo assíncrono</span>
          <span><Rocket /> Projeto prático</span>
        </div>
      </section>

      <section className="landingSection potenciaLevels">
        <div className="sectionHeading">
          <span className="potenciaTag">CONTEÚDO EM 3 NÍVEIS</span>
          <h2>Uma trilha para cada momento.</h2>
        </div>
        <div className="levelGrid">
          {levels.map((level) => (
            <article key={level.n} className="levelCard">
              <span className="levelNumber">{level.n}</span>
              <h3>{level.name}</h3>
              <strong>{level.level}</strong>
              <p>{level.text}</p>
              <ul>{level.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;

  if (module === "prosper") return <ProsperPage />;
  if (module === "letramento") return <LetramentoPage />;
  if (module === "potencia") return <PotenciaPage />;

  const item = fallbackData[module] ?? { title: "Experiência", description: "Módulo em construção." };

  return (
    <main className="modulePage">
      <Header />
      <section className="moduleHero">
        <p className="eyebrow">Experiência</p>
        <h1>{item.title}</h1>
        <p>{item.description}</p>
        <div className="modulePlaceholder">
          <strong>Estrutura pronta para a próxima etapa.</strong>
          <span>Conteúdo, identidade específica e funcionalidades serão conectados sem alterar a Home.</span>
        </div>
      </section>
    </main>
  );
}
