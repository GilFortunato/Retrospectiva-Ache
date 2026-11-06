"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  BriefcaseBusiness,
  UserRoundPen,
  ShieldCheck,
  ChartNoAxesCombined,
  MessageCircle,
  UsersRound,
  Award,
  ArrowUpRight,
} from "lucide-react";

// Módulos visíveis no Nexus. Os demais permanecem preservados em suas rotas.
const modules = [
  { label: "BI do programa", href: "/bi", icon: ChartNoAxesCombined, position: "petalBi" },
  { label: "ReBrand Pessoal", href: "/rebrand", icon: UserRoundPen, position: "petalRebrand" },
  { label: "Prosper", href: "/prosper", icon: Sparkles, position: "petalProsper" },
  { label: "Vagas", href: "/ache#vagas", icon: BriefcaseBusiness, position: "petalVagas" },
];

const retrospectiveAreas = [
  { label: "Satisfação", href: "/satisfacao", icon: MessageCircle, description: "Pesquisas, evolução das avaliações e depoimentos." },
  { label: "Candidatos", href: "/candidatos", icon: UsersRound, description: "Fichas por turma, notas e ranking geral." },
  { label: "Certificado", href: "https://drive.google.com/drive/folders/1VAjnw7FDUbEQhoZSBbxIyrE5wSTfoHcp?usp=sharing", icon: Award, description: "Acesse a pasta de certificados no Google Drive." },
];

export default function HomePage() {
  return (
    <main className="homePage">
      <header className="topbar">
        <div>
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
          <span>Programa PcD – Propagandista Trainee</span>
        </div>

        <Link
          href="/admin"
          className="adminIcon"
          aria-label="Área administrativa"
          title="Área administrativa"
        >
          <ShieldCheck size={20} strokeWidth={1.8} aria-hidden="true" />
        </Link>
      </header>

      <div className="homeContent">
        <section className="hero">
          <p className="eyebrow">Sua jornada começa aqui</p>
          <h1>Mais que contratar,<br />queremos incluir.</h1>
          <p className="homeIntro">Explore os módulos da experiência e os indicadores do programa.</p>
          <nav className="retrospectiveAreas" aria-label="Áreas da retrospectiva">
            {retrospectiveAreas.map(({ label, href, icon: Icon, description }) => (
              <Link key={href} href={href}>
                <span className="retrospectiveAreaTitle"><Icon size={18} aria-hidden="true" />{label}<ArrowUpRight size={15} aria-hidden="true" /></span>
                <span className="retrospectiveAreaDescription">{description}</span>
              </Link>
            ))}
          </nav>
        </section>

        <div className="nexusWrap">
          <section className="nexus" aria-label="Nexus do programa">
            <div className="nexusCore">
              <div className="acheWordmarkCrop acheWordmarkCropNexus" aria-label="Aché">
                <Image
                  src="/brand/ache-logo-tagline.webp"
                  alt="Aché"
                  fill
                  sizes="132px"
                  className="acheWordmarkCropImage"
                  priority
                />
              </div>
              <span>Propagandista<br />Trainee</span>
            </div>

            {modules.map(({ label, href, icon: Icon, position }) => (
              <Link
                key={label}
                href={href}
                className={"nexusPetal " + position}
              >
                <Icon size={28} strokeWidth={1.65} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
