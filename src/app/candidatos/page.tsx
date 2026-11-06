import type { Metadata } from "next";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import ApprovalPanel, { type LoadedDiaries } from "@/components/aprovados/ApprovalPanel";
import CandidateAccess from "@/components/aprovados/CandidateAccess";
import type { TeacherHighlights } from "@/lib/approvalRanking";
import { hasCandidateSession } from "@/lib/candidateAccess";
import { localApprovalData } from "@/lib/localApprovalData";
import { isLocalDevelopmentRequest } from "@/lib/localRequest";
import { participantKey } from "@/lib/participantName";

export const metadata: Metadata = {
  title: "Candidatos | Retrospectiva Aché",
  description: "Ranking geral e fichas dos candidatos por turma.",
  robots: { index: false, follow: false },
};

export default async function CandidatesPage() {
  const encoded = process.env.CANDIDATOS_BASE;
  if (!encoded && await isLocalDevelopmentRequest()) {
    return <ApprovalPanel mode="candidates" {...await localApprovalData()} />;
  }
  if (!await hasCandidateSession()) return <CandidateAccess />;

  if (!encoded) return <p>As fichas ainda não estão disponíveis nesta versão.</p>;

  const { initialLoaded, teacherHighlights } = JSON.parse(gunzipSync(Buffer.from(encoded, "base64")).toString("utf8")) as {
    initialLoaded: LoadedDiaries;
    teacherHighlights: TeacherHighlights;
  };
  const gradeStorageKeys = Object.fromEntries((["A", "B", "C"] as const).flatMap(classId => {
    const diary = initialLoaded[classId];
    if (!diary) return [];
    const roster = diary.results.approved.map(person => participantKey(person.name));
    const version = createHash("sha256").update(JSON.stringify(roster)).digest("hex").slice(0, 24);
    return [[classId, `ache-candidatos-notas-v1:${classId}:${version}`]];
  }));
  return <ApprovalPanel mode="candidates" initialLoaded={initialLoaded} teacherHighlights={teacherHighlights} gradeStorageKeys={gradeStorageKeys} />;
}
