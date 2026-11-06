import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ChartNoAxesCombined, ClipboardList, FileText, UsersRound, Video } from "lucide-react";
import { currentPortalSession } from "@/lib/portalAuth";
import styles from "./documentacoes.module.css";

export const metadata: Metadata = { title: "Documentações | Retrospectiva Aché" };

const folders = [
  { key: "demograficos", label: "Dados Demográficos", icon: ChartNoAxesCombined },
  { key: "diarios", label: "Diários de Classe", icon: ClipboardList },
  { key: "laudos", label: "Laudos", icon: FileText },
  { key: "squad", label: "Squad Completo", icon: UsersRound },
];
const folderUrl = /^https:\/\/drive\.google\.com\/drive\/folders\/[\w-]+(?:\?[\w=&-]+)?$/;

function readFolders() {
  let links: Record<string, unknown> | null;
  try {
    links = JSON.parse(process.env.DOCUMENTACOES_DRIVE ?? "null");
  } catch {
    return [];
  }
  return folders.flatMap(({ key, label, icon }) => {
    const href = links?.[key];
    return typeof href === "string" && folderUrl.test(href) ? [{ label, icon, href }] : [];
  });
}

export default async function DocumentacoesPage() {
  const session = await currentPortalSession();
  if (!session) redirect("/login");
  if (session.must_change_password) redirect("/trocar-senha");
  const driveFolders = readFolders();
  const resources = [...driveFolders, { label: "Comunidade", href: "/comunidade", icon: Video }];

  return (
    <main className="communityPage">
      <header className="experienceHeader communityHeader">
        <div className="experienceBrand">
          <Link href="/home" aria-label="Ir para o Nexus" className="headerLogoLink">
            <Image src="/brand/ache-logo-tagline.webp" alt="Aché" width={115} height={69} className="acheHeaderLogo" />
          </Link>
          <strong>Programa PcD · Propagandista Trainee</strong>
        </div>
        <Link href="/home" className="backNexus"><ArrowLeft size={17} aria-hidden="true" />Voltar ao Nexus</Link>
      </header>

      <section className={styles.content} aria-labelledby="documentacoes-titulo">
        <p className="eyebrow">Retrospectiva Aché</p>
        <h1 id="documentacoes-titulo">Documentações</h1>
        <p>Consulte os materiais do programa no Drive ou assista aos vídeos da Comunidade. Cada botão abre uma nova aba.</p>
        {driveFolders.length < folders.length ? <p role="status">Algumas pastas do Drive estão temporariamente indisponíveis.</p> : null}
        <nav className={styles.resources} aria-label="Materiais e vídeos do programa">
          {resources.map(({ label, href, icon: Icon }) => (
            <a key={href} className={`nexusPetal ${styles.resource}`} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} (abre em nova aba)`}>
              <Icon size={28} strokeWidth={1.65} aria-hidden="true" />
              <span>{label}</span>
            </a>
          ))}
        </nav>
      </section>
    </main>
  );
}
