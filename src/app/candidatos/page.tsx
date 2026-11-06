import type { Metadata } from "next";
import ApprovalPanel from "@/components/aprovados/ApprovalPanel";
import { localApprovalData } from "@/lib/localApprovalData";

export const metadata: Metadata = {
  title: "Candidatos | Retrospectiva Aché",
  description: "Ranking geral e fichas dos candidatos por turma.",
};

export default async function CandidatesPage() {
  return <ApprovalPanel mode="candidates" {...await localApprovalData()} />;
}
