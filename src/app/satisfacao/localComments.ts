import { isAbsolute } from "node:path";
import { openExcelWorkbook } from "@/lib/excelWorkbook";
import { isLocalDevelopmentRequest } from "@/lib/localRequest";
import { readWorkbook } from "@/lib/workbookSource";

const questions = [
  { column: "D", label: "Sobre o conteúdo" },
  { column: "F", label: "Sobre a recomendação" },
  { column: "H", label: "Sobre a facilitação" },
  { column: "I", label: "Feedbacks e sugestões" },
  { column: "J", label: "Depoimentos" },
];

async function readCycleComments(file: string, cycle: number) {
  const book = openExcelWorkbook(await readWorkbook(file));
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

export async function localSurveyComments() {
  if (!await isLocalDevelopmentRequest()) return [];
  const config = process.env.BI_PESQUISAS_SATISFACAO;
  if (!config) return [];
  let files: unknown;
  try { files = JSON.parse(config); } catch { return []; }
  if (!Array.isArray(files) || !files.every(file => typeof file === "string" && isAbsolute(file))) return [];
  const results = await Promise.allSettled(files.map((file, index) => readCycleComments(file, index + 1)));
  return results.map(result => result.status === "fulfilled" ? result.value : null);
}
