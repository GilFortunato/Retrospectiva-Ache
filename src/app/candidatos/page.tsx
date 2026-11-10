import type { Metadata } from "next";
import ApprovalPanel from "@/components/aprovados/ApprovalPanel";
import { redirect } from "next/navigation";
import { currentPortalSession } from "@/lib/portalAuth";
import { readCandidateProfiles } from "@/lib/candidateStore";
import { localApprovalData } from "@/lib/localApprovalData";
import { isLocalDevelopmentRequest } from "@/lib/localRequest";
import { recommendationPriorities } from "@/lib/recommendationPriorities";

export const metadata: Metadata = {
  title: "Candidatos | Retrospectiva Aché",
  description: "Ranking geral e fichas dos candidatos por turma.",
  robots: { index: false, follow: false },
};

export default async function CandidatesPage() {
  const session = await currentPortalSession();
  if (!session) redirect("/login");
  if (session.must_change_password) redirect("/trocar-senha");
  if (!process.env.CANDIDATOS_DATABASE_URL && await isLocalDevelopmentRequest()) {
    const data = await localApprovalData();
    return <ApprovalPanel mode="candidates" priorities={recommendationPriorities(data.initialLoaded)} {...data} />;
  }

  try {
    const data = await readCandidateProfiles();
    return <ApprovalPanel mode="candidates" priorities={recommendationPriorities(data.initialLoaded)} {...data} />;
  } catch {
    return <p role="alert">Não foi possível carregar as fichas. Recarregue a página para tentar novamente.</p>;
  }
}
