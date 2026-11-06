import { isAbsolute } from "node:path";
import { openExcelWorkbook } from "@/lib/excelWorkbook";
import { isLocalDevelopmentRequest } from "@/lib/localRequest";
import { readWorkbook } from "@/lib/workbookSource";

export type SurveyCommentGroup = { label: string; comments: string[] };

const questions = [
  { column: "D", label: "Sobre o conteúdo" },
  { column: "F", label: "Sobre a recomendação" },
  { column: "H", label: "Sobre a facilitação" },
  { column: "I", label: "Feedbacks e sugestões" },
  { column: "J", label: "Depoimentos" },
];

export function surveyWorkbookComments(bytes: Uint8Array, cycle: number): SurveyCommentGroup[] {
  const book = openExcelWorkbook(bytes);
  const rows = book.readSheet(book.sheetNames[0]);
  const period = String(rows[1]?.A ?? "").trim();
  const cycleNumber = Number(period.match(/^(?:semana\s+)?(\d+)/i)?.[1]);
  if (cycleNumber !== cycle || rows[2]?.I !== "Feedbacks" || rows[2]?.J !== "Depoimento") {
    throw new Error("Planilha de satisfação fora do formato esperado.");
  }

  const answers = rows.slice(3).filter(row => row.A === "Incoming form answer"
    && !["D", "I", "J"].every(column => String(row[column] ?? "").trim().toLowerCase() === "teste"));

  return questions.map(({ column, label }) => ({
    label,
    comments: answers.map(row => String(row[column] ?? "").trim()).filter(Boolean),
  }));
}

export async function localSurveyComments(cycle: number): Promise<SurveyCommentGroup[] | null> {
  if (!await isLocalDevelopmentRequest()) return null;
  const config = process.env.BI_PESQUISAS_SATISFACAO;
  if (!config) return null;
  const files: unknown = JSON.parse(config);
  const file: unknown = Array.isArray(files) ? files[cycle - 1] : null;
  if (typeof file !== "string" || !isAbsolute(file)) return null;
  return surveyWorkbookComments(await readWorkbook(file), cycle);
}
