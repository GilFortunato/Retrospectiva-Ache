import type { ClassId, DiaryParticipant } from "@/lib/classDiary";

export type TeacherHighlights = Partial<Record<ClassId, Record<string, readonly string[]>>>;
type GradedParticipant = Pick<DiaryParticipant, "name" | "finalGrade" | "weeklyGrades">;

export function rankApprovals(participants: readonly GradedParticipant[]) {
  const usesFinalGrade = participants.some(person => person.finalGrade !== null);
  const withWeeklyGrades = participants.filter(person => person.weeklyGrades.length > 0);
  const firstWeeks = withWeeklyGrades[0]?.weeklyGrades.map(({ week }) => week) ?? [];
  const weeks = usesFinalGrade ? [] : [...new Set(firstWeeks)]
    .filter(week => withWeeklyGrades.every(person => person.weeklyGrades.some(grade => grade.week === week)))
    .sort((a, b) => a - b);

  const rows = participants.map(person => {
    const weekly = weeks.flatMap(week => {
      const entry = person.weeklyGrades.find(grade => grade.week === week);
      return entry ? [entry.grade] : [];
    });
    const value = usesFinalGrade ? person.finalGrade : weekly.length
      ? weekly.reduce((total, grade) => total + grade, 0) / weekly.length
      : null;
    return { name: person.name, grade: value };
  });

  return { usesFinalGrade, weeks, rows: rankByGrade(rows) };
}

export function rankByGrade<T extends { name: string; grade: number | null }>(rows: readonly T[]) {
  const sorted = rows.map(row => ({
    ...row,
    grade: row.grade === null ? null : Number(row.grade.toFixed(2)),
  })).sort((a, b) => {
    if (a.grade === b.grade) return a.name.localeCompare(b.name, "pt-BR");
    if (a.grade === null) return 1;
    if (b.grade === null) return -1;
    return b.grade - a.grade;
  });

  let position = 0;
  let lastGrade: number | null = null;
  return sorted.map((row, index) => {
    if (row.grade === null) return { ...row, position: null };
    if (row.grade !== lastGrade) position = index + 1;
    lastGrade = row.grade;
    return { ...row, position };
  });
}
