import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Sparkles, Youtube } from "lucide-react";
import { communityVideos } from "@/data/communityVideos";

export const metadata: Metadata = { title: "Comunidade | Retrospectiva Aché" };

export default function ComunidadePage() {
  return (
    <main className="communityPage">
      <header className="experienceHeader communityHeader">
        <div className="experienceBrand">
          <Link href="/home" aria-label="Ir para o Nexus" className="headerLogoLink">
            <Image src="/brand/ache-logo-tagline.webp" alt="Aché" width={115} height={69} className="acheHeaderLogo" priority />
          </Link>
          <strong>Programa PcD · Propagandista Trainee</strong>
        </div>
        <Link href="/documentacoes" className="backNexus">
          <ArrowLeft size={17} aria-hidden="true" />Voltar a Documentações
        </Link>
      </header>

      <section className="communityHero">
        <div>
          <span className="communityEyebrow"><Sparkles size={15} aria-hidden="true" /> Retrospectiva Aché</span>
          <h1>Comunidade</h1>
          <p>Assista aqui aos vídeos da comunidade do Programa PcD de formação de propagandistas.</p>
        </div>
      </section>

      <section className="communityLibrary" aria-label="Vídeos da comunidade">
        <div className="communityVideoGrid">
          {communityVideos.map(video => (
            <article key={video.id} className="communityVideoCard">
              <figure className="communityVideoFrame">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${video.id}`}
                  title={video.title}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </figure>
              <div>
                <h2>{video.title}</h2>
                <a href={video.youtubeUrl} target="_blank" rel="noopener noreferrer" className="communityYoutubeLink">
                  <Youtube size={19} aria-hidden="true" /> Abrir no YouTube
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
