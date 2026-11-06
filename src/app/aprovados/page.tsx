import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ApprovalPanel from "@/components/aprovados/ApprovalPanel";
import { readCandidateProfiles } from "@/lib/candidateStore";
import { localApprovalData } from "@/lib/localApprovalData";
import { isLocalDevelopmentRequest } from "@/lib/localRequest";
import { currentPortalSession } from "@/lib/portalAuth";

export const metadata: Metadata = {
  title: "Aprovados por turma | Retrospectiva Aché",
  description: "Confira os resultados das turmas da formação de Propagandista Trainee.",
};

export default async function ApprovedParticipantsPage() {
  const session = await currentPortalSession();
  if (!session) redirect("/login");
  if (session.must_change_password) redirect("/trocar-senha");

  if (!process.env.CANDIDATOS_DATABASE_URL && await isLocalDevelopmentRequest()) {
    return <ApprovalPanel {...await localApprovalData()} />;
  }

  try {
    return <ApprovalPanel {...await readCandidateProfiles()} />;
  } catch {
    return <p role="alert">Não foi possível carregar os aprovados. Recarregue a página para tentar novamente.</p>;
  }
}
