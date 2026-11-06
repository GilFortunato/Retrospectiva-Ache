import type { Metadata } from "next";
import ApprovalPanel from "@/components/aprovados/ApprovalPanel";
import CandidateAccess from "@/components/aprovados/CandidateAccess";
import { hasCandidateSession } from "@/lib/candidateAccess";
import { readCandidateProfiles } from "@/lib/candidateStore";
import { localApprovalData } from "@/lib/localApprovalData";
import { isLocalDevelopmentRequest } from "@/lib/localRequest";

export const metadata: Metadata = {
  title: "Candidatos | Retrospectiva Aché",
  description: "Ranking geral e fichas dos candidatos por turma.",
  robots: { index: false, follow: false },
};

export default async function CandidatesPage() {
  if (!process.env.CANDIDATOS_DATABASE_URL && await isLocalDevelopmentRequest()) {
    return <ApprovalPanel mode="candidates" {...await localApprovalData()} />;
  }
  if (!await hasCandidateSession()) return <CandidateAccess />;

  try {
    const data = await readCandidateProfiles();
    return <ApprovalPanel mode="candidates" sharedGrades {...data} />;
  } catch {
    return <p role="alert">Não foi possível carregar as fichas. Recarregue a página para tentar novamente.</p>;
  }
}
