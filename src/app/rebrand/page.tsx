import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, MessageCircle, Stethoscope, Target, UsersRound } from "lucide-react";
import { RebrandLinkedInDiagnostic } from "@/components/rebrand/RebrandLinkedInDiagnostic";

export default function RebrandPage() {
  return (
    <main className="rebrandPage">
      <header className="experienceHeader rebrandHeader">
        <div className="experienceBrand">
          <Link href="/home" aria-label="Ir para Home" className="headerLogoLink">
            <Image src="/brand/ache-logo-tagline.webp" alt="Aché" width={115} height={69} className="acheHeaderLogo" priority />
          </Link>
          <strong>Programa PcD – Propagandista Trainee</strong>
        </div>
        <Link href="/home" className="backNexus"><ArrowLeft size={17}/>Voltar ao Nexus</Link>
      </header>

      <section className="rebrandHero">
        <div className="rebrandHeroCopy">
          <span className="sectionTag acheTag">ReBrand Pessoal</span>
          <h1>Seu LinkedIn também conta a sua história profissional.</h1>
          <p>Um diagnóstico orientado à carreira de Propagandista Trainee para tornar mais claros seus diferenciais, repertório, comunicação e potencial de relacionamento.</p>
        </div>
        <div className="rebrandHeroSignals">
          <span><MessageCircle/>Comunicação</span>
          <span><UsersRound/>Relacionamento</span>
          <span><Stethoscope/>Saúde</span>
          <span><Target/>Resultados</span>
          <span><BadgeCheck/>Credibilidade</span>
        </div>
      </section>

      <section className="rebrandIntro">
        <div><span>01</span><h3>Clareza</h3><p>Seu perfil deixa evidente quem você é, o que sabe fazer e onde gera valor?</p></div>
        <div><span>02</span><h3>Aderência</h3><p>As experiências e competências conversam com a rotina de um Propagandista?</p></div>
        <div><span>03</span><h3>Provas</h3><p>Existem exemplos, resultados ou vivências que sustentam sua narrativa?</p></div>
        <div><span>04</span><h3>Próximo passo</h3><p>O diagnóstico transforma a leitura em ações concretas de melhoria.</p></div>
      </section>

      <section className="rebrandWorkspace">
        <RebrandLinkedInDiagnostic />
      </section>
    </main>
  );
}
