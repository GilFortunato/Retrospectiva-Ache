import { validOrigin } from "@/lib/acheAdminAuth";
import { hasCandidateSession } from "@/lib/candidateAccess";
import { readCandidateProfiles, writeCandidateGrades } from "@/lib/candidateStore";
import { validateFinalGrades, type FinalGradeEntry } from "@/lib/classDiary";

function reply(body: object, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

function isGradeEntry(value: unknown): value is FinalGradeEntry {
  if (!value || typeof value !== "object" || !("name" in value) || !("finalGrade" in value)) return false;
  return typeof value.name === "string" && value.name.length <= 300
    && (value.finalGrade === null || typeof value.finalGrade === "number");
}

export async function PATCH(request: Request) {
  if (!validOrigin(request)) return reply({ message: "Origem da solicitação inválida." }, 403);
  if (!await hasCandidateSession()) {
    return reply({ message: "Sua sessão expirou. Reabra o painel e tente novamente." }, 401);
  }

  const raw = await request.text();
  if (raw.length > 40_000) return reply({ message: "A lista de notas excede o limite de importação." }, 413);

  let body: { classId?: unknown; participants?: unknown } | null;
  try {
    body = JSON.parse(raw);
  } catch {
    return reply({ message: "Lista de notas inválida." }, 400);
  }
  const classId = body?.classId;
  const participants = body?.participants;
  if ((classId !== "A" && classId !== "B" && classId !== "C")
    || !Array.isArray(participants) || participants.length > 100 || !participants.every(isGradeEntry)) {
    return reply({ message: "Confira a turma e a lista de notas da planilha." }, 400);
  }

  try {
    const { initialLoaded } = await readCandidateProfiles();
    const current = initialLoaded[classId];
    if (!current) return reply({ message: "A turma selecionada ainda não tem fichas cadastradas." }, 404);

    let grades: Map<string, number>;
    try {
      grades = validateFinalGrades(current.results.approved, participants);
    } catch (error) {
      return reply({ message: error instanceof Error ? error.message : "As notas são inválidas." }, 422);
    }
    if (!await writeCandidateGrades(classId, grades)) {
      return reply({ message: "A lista da turma mudou. Reabra o painel e tente novamente." }, 409);
    }

    return reply(await readCandidateProfiles(), 200);
  } catch {
    return reply({ message: "Não foi possível confirmar a atualização. Reabra o painel para conferir as notas e tente novamente se necessário." }, 503);
  }
}
