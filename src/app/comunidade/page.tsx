import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Play, Youtube, Sparkles } from "lucide-react";
import { communityVideos } from "@/data/communityVideos";

export default function ComunidadePage() {
  const [featured, ...others] = communityVideos;

  return (
    <main className="communityPage">
      <header className="experienceHeader communityHeader">
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
        <Link href="/home" className="backNexus">
          <ArrowLeft size={17} />
          Voltar ao Nexus
        </Link>
      </header>

      <section className="communityHero">
        <div>
          <span className="communityEyebrow"><Sparkles size={15}/> Comunidade</span>
          <h1>Histórias, conversas e conteúdos para acompanhar sua jornada.</h1>
          <p>
            Este espaço reúne vídeos da comunidade, encontros e conteúdos do Programa PcD –
            Propagandista Trainee em um só lugar.
          </p>
        </div>
      </section>

      {featured && (
        <section className="communityFeatured">
          <div className="communityVideoFrame">
            <iframe
              src={`https://www.youtube.com/embed/${featured.id}`}
              title={featured.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          <div className="communityFeaturedCopy">
            <span className="communityPill">Em destaque</span>
            <h2>{featured.title}</h2>
            <p>{featured.description}</p>
            <a href={featured.youtubeUrl} target="_blank" rel="noreferrer" className="communityYoutubeLink">
              <Youtube size={19}/> Assistir no YouTube
            </a>
          </div>
        </section>
      )}

      <section className="communityLibrary">
        <div className="sectionHeading">
          <span className="sectionTag acheTag">Biblioteca da Comunidade</span>
          <h2>Novos vídeos vão aparecer aqui.</h2>
          <p>À medida que novos conteúdos forem adicionados pelo ADM, eles entram nesta biblioteca.</p>
        </div>

        <div className="communityVideoGrid">
          {communityVideos.map((video) => (
            <article key={video.id} className="communityVideoCard">
              <a href={video.youtubeUrl} target="_blank" rel="noreferrer" className="communityThumb">
                <img src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} alt="" />
                <span><Play size={22} fill="currentColor"/></span>
              </a>
              <div>
                <small>{video.category}</small>
                <h3>{video.title}</h3>
                <p>{video.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
