import { isAbsolute } from "node:path";
import { NextResponse } from "next/server";
import type { BiApprovals } from "@/lib/biDemografico";
import { parseDemographicDashboard } from "@/lib/biWorkbook";
import { parseClassDiary, type ClassId } from "@/lib/classDiary";
import { driveFileIdPattern, readWorkbook } from "@/lib/workbookSource";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const headers = { "Cache-Control": "no-store, max-age=0", "X-Content-Type-Options": "nosniff" };
const classes: ClassId[] = ["A", "B", "C"];

async function readApprovals() {
  const results = await Promise.allSettled(classes.map(async classId => {
    const source = process.env[`BI_DIARIO_TURMA_${classId}`]?.trim();
    if (!source) return null;
    return { classId, diary: parseClassDiary(await readWorkbook(source), classId, { asApprovalList: true }) };
  }));
  const failedClasses = classes.filter((_, index) => results[index].status === "rejected");
  const lists = results.flatMap(result => result.status === "fulfilled" && result.value ? [result.value] : []);
  return {
    classes: lists.map(({ classId }) => classId),
    names: lists.flatMap(({ diary }) => diary.approved.map(person => person.name)),
    partial: lists.length < classes.length,
    error: failedClasses.length ? `Não foi possível ler as listas das turmas ${failedClasses.join(", ")}.` : undefined,
  };
}

function readApprovedNameAliases(): Record<string, string> | null {
  const config = process.env.BI_APROVADOS_NOMES_EQUIVALENTES?.trim();
  if (!config) return {};
  try {
    const value: unknown = JSON.parse(config);
    if (value && typeof value === "object" && !Array.isArray(value)
      && Object.entries(value).every(([name, target]) => name.trim() && typeof target === "string" && target.trim())) {
      return value as Record<string, string>;
    }
  } catch {
    // The response reports the invalid configuration without including names.
  }
  return null;
}

export async function GET() {
  const localPath = process.env.BI_WORKBOOK_PATH;
  const fileId = process.env.BI_DRIVE_FILE_ID;
  const source = localPath && isAbsolute(localPath) ? localPath : fileId && driveFileIdPattern.test(fileId) ? fileId : null;
  if (!source) return NextResponse.json({ error: "A fonte demográfica ainda não foi configurada para este painel." }, { status: 503, headers });
  try {
    const [bytes, lists] = await Promise.all([readWorkbook(source), readApprovals()]);
    const aliases = readApprovedNameAliases();
    const error = lists.error ?? (aliases === null ? "A configuração de nomes equivalentes dos aprovados está inválida." : undefined);
    const names = lists.classes.length && !error ? lists.names : undefined;
    const { data, approved, unmatched } = parseDemographicDashboard(bytes, names, aliases ?? undefined);
    const approvals: BiApprovals = { data: approved, classes: lists.classes, partial: lists.partial, unmatched, error };
    return NextResponse.json({ data, approvals, fetchedAt: new Date().toISOString() }, { headers });
  } catch (error) {
    // Never expose provider HTML, raw workbook data, file identifiers or credentials.
    const message = error instanceof Error && /^(A |O |Não |Aba )/.test(error.message) ? error.message : "Não foi possível atualizar os dados das planilhas neste momento. Tente novamente.";
    return NextResponse.json({ error: message }, { status: 502, headers });
  }
}
