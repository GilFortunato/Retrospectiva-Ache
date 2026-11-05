import { redirect } from "next/navigation";

// Mantém o endereço antigo funcionando e leva para a seção de vagas da página Aché.
export default function VagasPage() {
  redirect("/ache#vagas");
}
