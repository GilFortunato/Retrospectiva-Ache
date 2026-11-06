import "server-only";
import { retrospectiveDatabase } from "@/lib/retrospectiveDatabase";
import type { LoadedDiaries } from "@/components/aprovados/ApprovalPanel";
import type { TeacherHighlights } from "@/lib/approvalRanking";
import { summarizePerformance, type ClassId, type DiaryParticipant } from "@/lib/classDiary";

type ProfileRow = {
  class_id: ClassId;
  candidate_key: string;
  profile: Omit<DiaryParticipant, "finalGrade">;
  final_grade: number | null;
  teacher_highlights: string[];
};

export async function readCandidateProfiles() {
  const { rows } = await retrospectiveDatabase().query<ProfileRow>(
    "SELECT class_id, candidate_key, profile, final_grade, teacher_highlights FROM candidate_profiles",
  );
  const initialLoaded: LoadedDiaries = {};
  const teacherHighlights: TeacherHighlights = {};
  for (const classId of ["A", "B", "C"] as const) {
    const members = rows.filter(row => row.class_id === classId);
    if (!members.length) continue;
    const approved = members.map(row => ({ ...row.profile, finalGrade: row.final_grade }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    initialLoaded[classId] = {
      filename: `Diário da Turma ${classId}`,
      results: { total: approved.length, pending: 0, performance: summarizePerformance(approved), participants: approved, approved },
    };
    teacherHighlights[classId] = Object.fromEntries(members.map(row => [row.candidate_key, row.teacher_highlights]));
  }
  return { initialLoaded, teacherHighlights };
}

export async function writeCandidateGrades(classId: ClassId, grades: ReadonlyMap<string, number>) {
  const payload = JSON.stringify(Array.from(grades, ([candidate_key, final_grade]) => ({ candidate_key, final_grade })));
  const result = await retrospectiveDatabase().query(
    `WITH incoming AS (
      SELECT candidate_key, final_grade
      FROM jsonb_to_recordset($2::jsonb) AS entry(candidate_key text, final_grade double precision)
    )
    UPDATE candidate_profiles AS candidate
    SET final_grade = incoming.final_grade
    FROM incoming
    WHERE candidate.class_id = $1 AND candidate.candidate_key = incoming.candidate_key
      AND (SELECT count(*) FROM incoming JOIN candidate_profiles AS existing
           ON existing.class_id = $1 AND existing.candidate_key = incoming.candidate_key) = $3`,
    [classId, payload, grades.size],
  );
  return result.rowCount === grades.size;
}
