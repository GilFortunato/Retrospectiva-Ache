import type { Metadata } from "next";
import ApprovalPanel from "@/components/aprovados/ApprovalPanel";

export const metadata: Metadata = {
  title: "Aprovados por turma | Retrospectiva Aché",
  description: "Confira os resultados das turmas da formação de Propagandista Trainee.",
};

export default function ApprovedParticipantsPage() {
  return <ApprovalPanel />;
}
