"use client";

import Image from "next/image";
import Link from "next/link";
import { certificateFolderUrl } from "@/data/certificateFolder";
import {
  FolderOpen,
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
  { label: "Documentações", href: "/documentacoes", icon: FolderOpen, position: "petalDocumentacoes" },
  { label: "Candidatos", href: "/candidatos", icon: UsersRound, position: "petalCandidatos" },
  { label: "Satisfação", href: "/satisfacao", icon: MessageCircle, position: "petalSatisfacao" },
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

        <div className="portalAccount">
          <Link href="/trocar-senha">Trocar senha</Link>
          <form action="/api/acesso/sair" method="post"><button type="submit">Sair</button></form>
          <Link
            href="/admin"
            className="adminIcon"
            aria-label="Área administrativa"
            title="Área administrativa"
          >
            <ShieldCheck size={20} strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <div className="homeContent">
        <section className="hero">
          <p className="eyebrow">Sua jornada começa aqui</p>
          <h1>Mais que contratar,<br />queremos incluir.</h1>
          <p className="homeIntro">Explore os módulos da experiência e os indicadores do programa.</p>
          <nav className="retrospectiveAreas" aria-label="Áreas da retrospectiva">
            <Link href={certificateFolderUrl}>
              <span className="retrospectiveAreaTitle"><Award size={18} aria-hidden="true" />Certificado<ArrowUpRight size={15} aria-hidden="true" /></span>
              <span className="retrospectiveAreaDescription">Acesse a pasta de certificados no Google Drive.</span>
            </Link>
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
