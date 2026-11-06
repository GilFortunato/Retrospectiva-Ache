import type { Metadata } from "next";
import ApprovalPanel from "@/components/aprovados/ApprovalPanel";
import { localApprovalData } from "@/lib/localApprovalData";

export const metadata: Metadata = {
  title: "Aprovados por turma | Retrospectiva Aché",
  description: "Confira os resultados das turmas da formação de Propagandista Trainee.",
};

export default async function ApprovedParticipantsPage() {
  return <ApprovalPanel {...await localApprovalData()} />;
}
