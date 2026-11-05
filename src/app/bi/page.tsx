import type { Metadata } from "next";
import DemographicDashboard from "@/components/bi/DemographicDashboard";

export const metadata: Metadata = {
  title: "BI Demográfico | Retrospectiva Aché",
  description: "Perfil demográfico e alcance do Programa de Inclusão PcD Aché em um painel interativo.",
};

export default function BiPage() {
  return <DemographicDashboard />;
}
