import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Accessibility,
  Ear,
  Eye,
  PersonStanding,
  Brain,
  MessageSquareText,
  MonitorSmartphone,
  HandHeart,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  UsersRound,
  BookOpen,
  Film,
  Sparkles,
} from "lucide-react";

const disabilityTypes = [
  { title: "Física", Icon: PersonStanding, text: "Não toque em cadeira, bengala, muleta ou andador sem permissão. Pergunte antes de ajudar." },
  { title: "Auditiva", Icon: Ear, text: "Fale de frente, sem gritar. Use Libras, escrita ou apoio visual quando necessário." },
  { title: "Visual", Icon: Eye, text: "Identifique-se, descreva obstáculos e ofereça o braço para guiar se a pessoa aceitar." },
  { title: "Intelectual", Icon: Brain, text: "Use linguagem clara, uma instrução por vez e confirme entendimento." },
  { title: "Múltipla", Icon: Accessibility, text: "Combine recursos e respeite as preferências de comunicação da pessoa." },
  { title: "TEA", Icon: Sparkles, text: "Seja direto, previsível e dê tempo para processamento. Evite pressão desnecessária." },
];

const accessibilityTypes = [
  { n: "01", title: "Física / arquitetônica", Icon: PersonStanding, text: "Rampas, elevadores, circulação e banheiros acessíveis." },
  { n: "02", title: "Comunicacional", Icon: MessageSquareText, text: "Libras, legendas, audiodescrição e linguagem clara." },
  { n: "03", title: "Digital", Icon: MonitorSmartphone, text: "Documentos acessíveis, contraste, navegação por teclado e leitor de tela." },
  { n: "04", title: "Atitudinal", Icon: HandHeart, text: "Respeito, autonomia, escuta ativa e combate a expressões capacitistas." },
];

const ableism = [
  ["Presumir incapacidade", "Recusar oportunidade ou reduzir expectativa sem avaliar competência real."],
  ["Falar com o acompanhante", "Ignorar a autonomia da pessoa e dirigir a conversa a terceiros."],
  ["Infantilizar adultos", "Tratar pessoa adulta como criança porque ela tem deficiência."],
  ["Não garantir acesso", "Evento, reunião ou material sem adaptações físicas, digitais ou comunicacionais."],
];

const practices = [
  "Eduque-se sobre diferentes deficiências e necessidades de acessibilidade.",
  "Garanta acessibilidade física, digital e comunicacional antes de convidar.",
  "Use linguagem inclusiva e corrija termos inadequados sem exposição pública.",
  "Ofereça apoio na comunicação com paciência e alternativas acessíveis.",
  "Incentive participação ativa sem subestimar capacidade.",
  "Valorize entregas e contribuições individuais, não superação compulsória.",
];

export default function LetramentoPage() {
  return (
    <main className="accessLanding">
      <header className="experienceHeader accessHeader">
        <div className="experienceBrand">
          <Link href="/home" aria-label="Ir para Home" className="headerLogoLink">
            <Image src="/brand/ache-logo-tagline.webp" alt="Aché" width={115} height={69} className="acheHeaderLogo" priority />
          </Link>
          <strong>Programa PcD – Propagandista Trainee</strong>
        </div>
        <Link href="/home" className="backNexus"><ArrowLeft size={17}/>Voltar ao Nexus</Link>
      </header>

      <section className="landingSection accessHero">
        <div className="accessHeroCopy">
          <span className="sectionTag accessTag">Letramento em</span>
          <h1>Acessibilidade<br/>e inclusão PcD</h1>
          <p>Síntese prática para convivência, comunicação e trabalho.</p>
          <strong>Programa de Inclusão PcD Aché</strong>
        </div>
        <div className="accessHeroMark" aria-hidden="true">
          <div className="accessRing ringOne"/>
          <div className="accessRing ringTwo"/>
          <Accessibility size={92}/>
        </div>
      </section>

      <div className="accessBodyLayout">
        <aside className="accessMenu" aria-label="Navegação do letramento">
          <span className="accessMenuLabel">Navegue</span>
          <a href="#mudanca"><span>01</span>Mudança de chave</a>
          <a href="#linguagem"><span>02</span>Linguagem</a>
          <a href="#tipos"><span>03</span>Tipos de deficiência</a>
          <a href="#acessibilidade"><span>04</span>Acessibilidade</a>
          <a href="#capacitismo"><span>05</span>Capacitismo</a>
          <a href="#praticas"><span>06</span>Boas práticas</a>
        </aside>

        <div className="accessBodyContent">
      <section id="mudanca" className="landingSection accessLight">
        <div className="sectionHeading">
          <span className="accessNumber">01</span>
          <span className="sectionTag accessTag">A mudança de chave</span>
          <h2>Da exclusão ao modelo social da deficiência.</h2>
        </div>
        <div className="shiftGrid">
          <article><span>01</span><h3>Exclusão</h3><p>A deficiência era tratada como motivo para afastamento social.</p></article>
          <article><span>02</span><h3>Modelo médico</h3><p>O foco ficava na limitação individual e na reabilitação.</p></article>
          <article className="featured"><span>03</span><h3>Modelo social</h3><p>O foco muda para barreiras, acessibilidade e participação.</p></article>
        </div>
        <div className="accessCallout">Não é a pessoa que precisa “caber” no mundo. O ambiente também precisa mudar.</div>
      </section>

      <section id="linguagem" className="landingSection accessSoft">
        <div className="sectionHeading">
          <span className="accessNumber">02</span>
          <span className="sectionTag accessTag">Linguagem importa</span>
          <h2>Pare de portar. Comece a nomear.</h2>
          <p>Linguagem correta reduz estigma e aumenta precisão.</p>
        </div>
        <div className="termsGrid">
          <article><XCircle/><div><strong>Evite</strong><span>PNE / “pessoa com necessidades especiais”</span></div><div><strong>Prefira</strong><span>Pessoa com deficiência / PcD</span></div></article>
          <article><XCircle/><div><strong>Evite</strong><span>PPD / “portador de deficiência”</span></div><div><strong>Prefira</strong><span>Pessoa com deficiência / PcD</span></div></article>
          <article><XCircle/><div><strong>Evite</strong><span>“O deficiente”</span></div><div><strong>Prefira</strong><span>Pessoa com deficiência</span></div></article>
          <article><XCircle/><div><strong>Evite</strong><span>“Pessoa normal”</span></div><div><strong>Prefira</strong><span>Pessoa sem deficiência</span></div></article>
        </div>
        <div className="accessCallout outline">Regra de ouro: pessoa antes da deficiência.</div>
      </section>

      <section id="tipos" className="landingSection accessLight">
        <div className="sectionHeading">
          <span className="accessNumber">03</span>
          <span className="sectionTag accessTag">Tipos de deficiência</span>
          <h2>O ponto é a barreira.</h2>
          <p>Conhecer ajuda a interagir melhor — sem presumir incapacidade.</p>
        </div>
        <div className="disabilityGrid">
          {disabilityTypes.map(({ title, Icon, text }) => (
            <article key={title}><Icon size={27}/><h3>{title}</h3><p>{text}</p></article>
          ))}
        </div>
      </section>

      <section id="acessibilidade" className="landingSection accessMagenta">
        <div className="sectionHeading">
          <span className="accessNumber light">04</span>
          <span className="sectionTag accessTag lightTag">Acessibilidade não é só rampa</span>
          <h2>Ela precisa aparecer no espaço, na comunicação, nos sistemas e nas atitudes.</h2>
        </div>
        <div className="accessibilityGrid">
          {accessibilityTypes.map(({n,title,Icon,text}) => (
            <article key={n}><div><span>{n}</span><Icon size={26}/></div><h3>{title}</h3><p>{text}</p></article>
          ))}
        </div>
        <div className="accessCallout lightCallout">Acessibilidade boa é aquela que não precisa ser implorada.</div>
      </section>

      <section id="capacitismo" className="landingSection accessSoft">
        <div className="sectionHeading">
          <span className="accessNumber">05</span>
          <span className="sectionTag accessTag">Capacitismo</span>
          <h2>Discriminação nem sempre vem em forma de ofensa explícita.</h2>
        </div>
        <div className="ableismGrid">
          {ableism.map(([title,text]) => (
            <article key={title}><ShieldAlert size={25}/><h3>{title}</h3><p>{text}</p></article>
          ))}
        </div>
        <div className="accessCallout outline">Fale diretamente com a pessoa, pergunte antes de ajudar e não reduza a pessoa à deficiência.</div>
      </section>

      <section className="landingSection languageExamples">
        <div className="sectionHeading">
          <span className="sectionTag accessTag">Expressões para aposentar</span>
          <h2>Trocar palavra não é frescura: é precisão, respeito e convivência.</h2>
        </div>
        <div className="phraseColumns">
          <article>
            <h3><XCircle size={20}/> Não use</h3>
            <ul>
              <li>surdo-mudo</li>
              <li>preso à cadeira de rodas</li>
              <li>sofre de deficiência</li>
              <li>pessoa especial</li>
              <li>normal</li>
            </ul>
          </article>
          <article>
            <h3><CheckCircle2 size={20}/> Use preferencialmente</h3>
            <ul>
              <li>pessoa surda / pessoa com deficiência auditiva</li>
              <li>pessoa usuária de cadeira de rodas</li>
              <li>tem deficiência / pessoa com deficiência</li>
              <li>pessoa com deficiência</li>
              <li>pessoa sem deficiência</li>
            </ul>
          </article>
        </div>
      </section>

      <section id="praticas" className="landingSection accessLight">
        <div className="sectionHeading">
          <span className="accessNumber">06</span>
          <span className="sectionTag accessTag">Boas práticas no trabalho</span>
          <h2>Inclusão vira cultura quando entra no comportamento cotidiano.</h2>
        </div>
        <div className="practiceGrid">
          {practices.map((item, index) => (
            <article key={item}><span>{String(index + 1).padStart(2,"0")}</span><p>{item}</p></article>
          ))}
        </div>
        <div className="accessCallout">Pergunte antes de ajudar. Respeite quando a resposta for “não”.</div>
      </section>

      <section className="landingSection repertoireSection">
        <div className="sectionHeading">
          <span className="sectionTag accessTag">Para aproximar</span>
          <h2>Repertório que abre conversa.</h2>
          <p>Filmes, séries e livros ajudam quando não viram manual único da experiência PcD.</p>
        </div>
        <div className="repertoireGrid">
          <article><Film size={26}/><h3>Filmes</h3><p>Meu Pé Esquerdo · Intocáveis · O Milagre de Anne Sullivan · Extraordinário · A Teoria de Tudo</p></article>
          <article><UsersRound size={26}/><h3>Séries</h3><p>Special · Atypical · Switched at Birth · The Good Doctor · Ramy</p></article>
          <article><BookOpen size={26}/><h3>Livro para reflexão</h3><p>Flores para Algernon</p></article>
        </div>
        <div className="accessCallout outline">A melhor fonte continua sendo escutar a própria pessoa.</div>
      </section>

      <section className="landingSection accessFinal">
        <div>
          <span className="sectionTag accessTag lightTag">Inclusão é prática cotidiana</span>
          <h2>Menos suposição.<br/>Mais escuta.<br/>Mais acesso.</h2>
        </div>
        <div className="minimumCard">
          <h3>O combinado mínimo</h3>
          <p>perguntar antes de ajudar</p>
          <p>falar diretamente com a pessoa</p>
          <p>não infantilizar</p>
          <p>garantir acessibilidade</p>
        </div>
      </section>
        </div>
      </div>
    </main>
  );
}
