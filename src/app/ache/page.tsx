import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Building2, Bus, Dumbbell, GraduationCap, HeartPulse, Leaf, Scale, ShieldCheck, Sparkles, Stethoscope, UsersRound, Utensils } from "lucide-react";

const values = [
  { label: "Apaixonados pela vida", Icon: HeartPulse },
  { label: "Inovamos para estar sempre à frente", Icon: Sparkles },
  { label: "Cuidamos dos nossos clientes", Icon: UsersRound },
  { label: "Inspiramos pelo talento e pela diversidade", Icon: UsersRound },
  { label: "Zelamos pela nossa reputação", Icon: ShieldCheck },
];

export default function AchePage() {
  return (
    <main className="acheLanding">
      <header className="experienceHeader acheHeader">
        <div className="experienceBrand">
          <Link href="/home" aria-label="Ir para Home" className="headerLogoLink">
            <Image src="/brand/ache-logo-tagline.webp" alt="Aché" width={115} height={69} className="acheHeaderLogo" priority />
          </Link>
          <strong>Programa PcD – Propagandista Trainee</strong>
        </div>
        <Link href="/home" className="backNexus"><ArrowLeft size={17}/>Voltar ao Nexus</Link>
      </header>

      <div className="acheBodyLayout">
        <aside className="acheSectionNav" aria-label="Navegação da página Aché">
          <span className="acheMenuLabel">Navegue</span>
          <a href="#vagas"><span>01</span>Vagas</a>
          <a href="#beneficios"><span>02</span>Benefícios</a>
          <a href="#sobre"><span>03</span>Sobre o Aché</a>
          <a href="#governanca"><span>04</span>Governança</a>
          <a href="#conduta"><span>05</span>Código de Conduta</a>
          <a href="#sustentabilidade"><span>06</span>Sustentabilidade</a>
        </aside>

        <div className="acheBodyContent acheUnifiedContent">
      <section id="vagas" className="landingSection vagasHero">
        <div className="vagasHeroCopy">
          <span className="sectionTag acheTag">Carreiras</span>
          <h1>Construa sua jornada na <span>Aché</span>.</h1>
          <p>
            Um ambiente diverso e inclusivo, com espaço para aprendizagem, desenvolvimento
            e reconhecimento de talentos que constroem resultados e reputação.
          </p>
        </div>
      </section>

      <section className="vagasEntry landingSection">
        <div className="vagasCards">
          <a
            className="vagaChoice active"
            href="https://vagasache.gupy.io/"
            target="_blank"
            rel="noreferrer"
          >
            <div className="vagaChoiceIcon"><BriefcaseBusiness size={30} /></div>
            <span className="vagaChoiceTag">Oportunidades abertas</span>
            <h2>Vagas Aché</h2>
            <p>
              Consulte as oportunidades disponíveis e encontre vagas alinhadas ao seu perfil.
            </p>
            <div className="vagaChoiceCta">Ver vagas <ArrowRight size={18} /></div>
          </a>

          <article className="vagaChoice exclusive">
            <div className="vagaChoiceIcon"><UsersRound size={30} /></div>
            <span className="vagaChoiceTag">Programa exclusivo</span>
            <h2>Vaga Exclusiva Programa</h2>
            <p>
              Espaço reservado para oportunidades exclusivas do Programa PcD – Propagandista Trainee.
            </p>
            <div className="vagaChoiceCta disabled">Disponível em breve</div>
          </article>
        </div>
      </section>

      <section id="beneficios" className="landingSection vagasBenefits">
        <div className="sectionHeading">
          <span className="sectionTag acheTag">Benefícios</span>
          <h2>Uma jornada pensada para saúde, bem-estar e desenvolvimento.</h2>
          <p>
            Os benefícios variam conforme área, modelo de trabalho e unidade, mas a proposta
            combina cuidado com a saúde, qualidade de vida, desenvolvimento e conveniência.
          </p>
        </div>

        <div className="benefitGrid">
          <article>
            <Stethoscope size={28} />
            <h3>Saúde</h3>
            <p>Assistência médica e odontológica, medicamentos, exames preventivos e iniciativas de cuidado.</p>
          </article>
          <article>
            <Dumbbell size={28} />
            <h3>Bem-estar</h3>
            <p>Wellhub, programa de saúde mental e apoio a colaboradoras e famílias.</p>
          </article>
          <article>
            <GraduationCap size={28} />
            <h3>Desenvolvimento</h3>
            <p>Parcerias e convênios com bolsas e descontos educacionais.</p>
          </article>
          <article>
            <Utensils size={28} />
            <h3>Dia a dia</h3>
            <p>Restaurante ou vale-refeição, vale-alimentação e outras facilidades.</p>
          </article>
          <article>
            <Bus size={28} />
            <h3>Mobilidade</h3>
            <p>Vale-transporte, estacionamento ou fretado, conforme elegibilidade.</p>
          </article>
          <article>
            <Building2 size={28} />
            <h3>Flexibilidade</h3>
            <p>Benefícios como auxílio home office e Short Friday podem variar conforme a função.</p>
          </article>
        </div>
      </section>

      <section className="landingSection diversitySection">
        <div className="sectionHeading">
          <span className="sectionTag acheTag">Diversidade, Equidade & Inclusão</span>
          <h2>Inclusão como parte da cultura.</h2>
          <p>
            O Aché apresenta diversidade, equidade e inclusão como pilares da cultura e cita
            iniciativas de governança, letramento, grupos de afinidade e uso do nome social
            desde o recrutamento e seleção.
          </p>
        </div>

        <div className="diversityBanner">
          <div>
            <UsersRound size={34} />
            <strong>Mais que contratar, queremos incluir.</strong>
          </div>
          <p>
            A proposta do programa se conecta diretamente a esse compromisso de ampliar
            oportunidades e criar uma experiência de carreira mais inclusiva.
          </p>
        </div>
      </section>

      <section className="acheHero landingSection">
        <div>
          <span className="sectionTag acheTag">O Aché</span>
          <h1>Mais vida<br/><em>para você.</em></h1>
          <p>Conheça a história, o propósito, a governança e os compromissos que sustentam a atuação do Aché.</p>
        </div>
        <div className="acheHeroArt" aria-hidden="true">
          <span className="acheBlob magentaBlob"/>
          <span className="acheBlob orangeBlob"/>
          <div className="acheWordmarkCrop acheWordmarkCropHero acheWordmarkCropHeroWhite" aria-label="Aché">
            <Image
              src="/brand/ache-logo-tagline.webp"
              alt="Aché"
              fill
              sizes="185px"
              className="acheWordmarkCropImage acheWordmarkCropImageWhite"
              priority
            />
          </div>
        </div>
      </section>

      <section id="sobre" className="landingSection acheAbout">
        <div className="sectionHeading">
          <span className="acheSectionNumber">03</span>
          <span className="sectionTag acheTag">Sobre o Aché</span>
          <h2>Uma trajetória brasileira construída com inovação, saúde e confiança.</h2>
          <p>O Aché está entre as cinco maiores empresas farmacêuticas do Brasil, atua em mais de 157 classes terapêuticas e 30 especialidades médicas, possui quatro plantas industriais e mais de 6 mil colaboradores.</p>
        </div>
        <div className="acheStats">
          <article><strong>157+</strong><span>classes terapêuticas</span></article>
          <article><strong>30</strong><span>especialidades médicas</span></article>
          <article><strong>4</strong><span>plantas industriais</span></article>
          <article><strong>6 mil+</strong><span>colaboradores</span></article>
        </div>
        <div className="acheValuesGrid">
          {values.map(({label, Icon}) => <article key={label}><Icon size={25}/><strong>{label}</strong></article>)}
        </div>
      </section>

      <section id="governanca" className="landingSection acheGovernance">
        <div className="sectionHeading">
          <span className="acheSectionNumber light">04</span>
          <span className="sectionTag acheTag lightTag">Governança</span>
          <h2>Ética e transparência como pilares do negócio.</h2>
          <p>A governança corporativa parte da construção de relações sólidas, transparentes e responsáveis. Ética, integridade e conformidade orientam decisões e fortalecem a confiança.</p>
        </div>
        <div className="governanceGrid">
          <article><Building2 size={28}/><strong>Estrutura de Governança</strong></article>
          <article><Scale size={28}/><strong>Ética</strong></article>
          <article><ShieldCheck size={28}/><strong>Programa de Integridade</strong></article>
          <article><ShieldCheck size={28}/><strong>Concorrencial</strong></article>
        </div>
        <div className="acheMilestones">
          <div><span>1998</span><p>Participação na criação do Instituto Ethos.</p></div>
          <div><span>2004</span><p>Primeira publicação do Código de Conduta.</p></div>
          <div><span>Hoje</span><p>Ética e conformidade integradas à tomada de decisão.</p></div>
        </div>
      </section>

      <section id="conduta" className="landingSection acheConduct">
        <div className="sectionHeading">
          <span className="acheSectionNumber">05</span>
          <span className="sectionTag acheTag">Código de Conduta Corporativa</span>
          <h2>Fazer o certo — e do jeito certo.</h2>
          <p>O Código de Conduta funciona como guia de comportamento para colaboradores, lideranças, parceiros e demais públicos que se relacionam com o Aché.</p>
        </div>
        <div className="conductFeature">
          <article><ShieldCheck size={36}/><h3>Integridade</h3><p>Ética, transparência e responsabilidade.</p></article>
          <article><UsersRound size={36}/><h3>Diversidade e inclusão</h3><p>Respeito às diferentes experiências, competências e identidades.</p></article>
          <article><Scale size={36}/><h3>Governança</h3><p>Regras claras, conformidade e proteção da reputação.</p></article>
          <article><Leaf size={36}/><h3>Olhar ESG</h3><p>Aspectos ambientais, sociais e de governança integrados às decisões.</p></article>
        </div>
        <div className="conductQuote"><strong>Somos Magenta</strong><p>Paixão pela vida, inovação, cuidado com clientes, valorização do talento e da diversidade e compromisso com a reputação.</p></div>
      </section>

      <section id="sustentabilidade" className="landingSection acheSustainability">
        <div className="sectionHeading">
          <span className="acheSectionNumber light">06</span>
          <span className="sectionTag acheTag lightTag">Sustentabilidade</span>
          <h2>Mais pacientes. Mais inovação. Mais impacto. Mais futuro.</h2>
          <p>O relatório anual mais recente coloca o paciente no centro das decisões e conecta ciência, inovação, acesso e impacto positivo.</p>
        </div>
        <div className="sustainabilityGrid">
          <article><HeartPulse size={27}/><strong>Mais pacientes</strong><span>Conectar inovação científica à jornada de saúde.</span></article>
          <article><Sparkles size={27}/><strong>Mais inovação</strong><span>Transformar conhecimento em soluções relevantes.</span></article>
          <article><Leaf size={27}/><strong>Mais impacto</strong><span>Gerar valor para sociedade e meio ambiente.</span></article>
          <article><Building2 size={27}/><strong>Mais futuro</strong><span>Preparar a companhia para novos ciclos de crescimento.</span></article>
        </div>
        <div className="acheFuture"><strong>100 mi</strong><span>pessoas por ano até 2030</span></div>
      </section>
        </div>
      </div>
    </main>
  );
}
