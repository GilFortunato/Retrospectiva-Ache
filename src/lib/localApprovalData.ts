import { basename, isAbsolute } from "node:path";
import type { LoadedDiaries } from "@/components/aprovados/ApprovalPanel";
import type { TeacherHighlights } from "@/lib/approvalRanking";
import { parseClassDiary, type ClassId } from "@/lib/classDiary";
import { participantKey } from "@/lib/participantName";
import { readWorkbook } from "@/lib/workbookSource";
import { isLocalDevelopmentRequest } from "@/lib/localRequest";

const classes: ClassId[] = ["A", "B", "C"];

function localTeacherHighlights(): TeacherHighlights {
  const config = process.env.BI_DESTAQUES_DOCENTES;
  if (!config) return {};
  try {
    const input: unknown = JSON.parse(config);
    if (!input || typeof input !== "object" || Array.isArray(input)) return {};
    const highlights: TeacherHighlights = {};
    for (const classId of classes) {
      const entries = (input as Record<string, unknown>)[classId];
      if (!entries || typeof entries !== "object" || Array.isArray(entries)) continue;
      highlights[classId] = Object.fromEntries(Object.entries(entries).flatMap(([name, labels]) =>
        Array.isArray(labels) && labels.every(label => typeof label === "string")
          ? [[participantKey(name), labels]]
          : [],
      ));
    }
    return highlights;
  } catch {
    return {};
  }
}

export async function localApprovalData(): Promise<{ initialLoaded?: LoadedDiaries; teacherHighlights?: TeacherHighlights }> {
  if (!await isLocalDevelopmentRequest()) return {};

  const sources = await Promise.allSettled(classes.map(async classId => {
    const file = process.env[`BI_DIARIO_TURMA_${classId}`]?.trim();
    if (!file || !isAbsolute(file)) return null;
    const results = parseClassDiary(await readWorkbook(file), classId, { asApprovalList: true });
    return [classId, { filename: basename(file), results }] as const;
  }));
  return {
    initialLoaded: Object.fromEntries(sources.flatMap(source => source.status === "fulfilled" && source.value ? [source.value] : [])),
    teacherHighlights: localTeacherHighlights(),
  };
}
