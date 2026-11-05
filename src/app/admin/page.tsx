import { redirect } from "next/navigation";
import { adminSession } from "@/lib/acheAdminAuth";
import AdminIntegrations from "@/components/admin/AdminIntegrations";
import Image from "next/image";
import Link from "next/link";

export default async function AdminPage() {
  if (!await adminSession()) redirect("/admin/login");
  return (
    <main className="adminPage">
      <header className="simpleHeader">
        <div>
          <Link href="/home" aria-label="Ir para Home" className="headerLogoLink">
            <Image
              src="/brand/ache-logo-tagline.webp"
              alt="Aché"
              width={115}
              height={69}
              className="acheHeaderLogo"
            />
          </Link>
          <strong>Administração</strong>
        </div>
        <Link href="/home">Voltar para Home</Link>
      </header>

      <section className="adminHero">
        <p className="eyebrow">Área administrativa</p>
        <h1>Gestão da experiência</h1>
        <p>Área restrita para configurar integrações próprias desta cópia. O diagnóstico automático e o histórico do ReBrand estão desativados na retrospectiva.</p>
      </section>

      <AdminIntegrations />

      <section className="adminGrid">
        <article><h2>Acesso aos conteúdos</h2><p>As páginas da retrospectiva são abertas e não exigem cadastro de participantes.</p></article>
        <article className="adminCommunityCard">
          <h2>Comunidade</h2>
          <p>Cadastre links do YouTube, títulos, categorias e destaques.</p>
          <div className="adminVideoCurrent">
            <span>Vídeo cadastrado</span>
            <strong>Comunidade Aché — Vídeo 01</strong>
            <a href="https://youtu.be/RewY7L3wcyg" target="_blank" rel="noreferrer">Abrir no YouTube</a>
          </div>
          <div className="adminVideoFields" aria-label="Estrutura preparada para novos vídeos">
            <label>Link do YouTube<input value="https://youtu.be/RewY7L3wcyg" readOnly /></label>
            <label>Título<input value="Comunidade Aché — Vídeo 01" readOnly /></label>
            <label>Categoria<input value="Comunidade" readOnly /></label>
          </div>
          <Link href="/comunidade" className="adminCommunityLink">Ver página da Comunidade</Link>
        </article>
        <article><h2>Vagas</h2><p>Publique e organize oportunidades.</p></article>
        <article className="adminRebrandCard">
          <h2>ReBrand / LinkedIn</h2>
          <p>As orientações de posicionamento profissional permanecem disponíveis. Pesquisas automáticas e resultados anteriores não fazem parte desta retrospectiva.</p>


          <Link href="/rebrand" className="adminCommunityLink">Abrir ReBrand Pessoal</Link>
        </article>
      </section>
    </main>
  );
}
