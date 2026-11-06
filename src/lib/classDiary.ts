import { openExcelWorkbook, type WorkbookCell, type WorkbookRow } from "@/lib/excelWorkbook";
import { participantKey } from "@/lib/participantName";

export type ClassId = "A" | "B" | "C";

const performanceFields = ["finalGrade", "attendance", "highlightWeeks", "communication", "initiative", "collaboration"] as const;
export type PerformanceField = typeof performanceFields[number];
type MetricTotals = { sum: number; count: number };
export type ClassPerformance = Record<PerformanceField, MetricTotals>;
export type DiaryParticipant = Record<PerformanceField, number | null> & {
  name: string;
  teacherComment: string | null;
  additionalObservation: string | null;
  weeklyGrades: { week: number; grade: number }[];
};

export type ClassDiary = {
  total: number;
  pending: number;
  performance: ClassPerformance;
  participants: DiaryParticipant[];
  approved: DiaryParticipant[];
};

const columnLabels = {
  name: ["name", "nome", "nome completo", "participante"],
  classId: ["turma"],
  status: ["status na trilha"],
  attendance: ["frequencia", "frequencia final"],
  finalGrade: ["media final", "nota final"],
  highlightWeeks: ["semanas em destaque"],
  communication: ["comunicacao"],
  initiative: ["protagonismo"],
  collaboration: ["colaboracao"],
  teacherComment: ["observacoes finais", "avaliacao do professor", "comentario do professor"],
  additionalObservation: ["observacoes (se necessario)"],
  activities: ["nota: atividades em aula"],
  exam: ["nota: prova avaliativa"],
  extra: ["nota: atividades extras"],
  result: ["resultado final", "situacao final", "status final", "aprovacao"],
  certificate: ["certificados", "certificado"],
} as const;

type Column = keyof typeof columnLabels;
type Columns = Partial<Record<Column, string>>;

function normalize(value: WorkbookCell | undefined) {
  return String(value ?? "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function findColumns(row: WorkbookRow): Columns {
  const entries = Object.entries(row);
  const columns: Columns = {};
  for (const field of Object.keys(columnLabels) as Column[]) {
    const labels: readonly string[] = columnLabels[field];
    const match = entries.find(([, label]) => labels.includes(normalize(label)));
    if (match) columns[field] = match[0];
  }
  return columns;
}

function numberValue(value: WorkbookCell | undefined): number | null {
  const text = String(value ?? "").trim();
  if (!/^\d+(?:[.,]\d+)?$/.test(text)) return null;
  const number = Number(text.replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

function attendanceValue(value: WorkbookCell | undefined): number | null {
  const text = String(value ?? "").trim();
  const number = numberValue(text.replace(/%$/, ""));
  if (number === null) return null;
  const percentage = !text.endsWith("%") && typeof value === "number" && number <= 1 ? number * 100 : number;
  return percentage <= 100 ? percentage : null;
}

function observation(value: WorkbookCell | undefined) {
  const text = typeof value === "string" ? value.trim() : "";
  return text && text !== "-" && text !== "—" ? text : null;
}

const approvals = new Set(["aprovado", "aprovada", "aprovado(a)", "aprovada(o)"]);
const negatives = new Set(["reprovado", "reprovada", "reprovado(a)", "nao aprovado", "nao aprovada"]);
const issuedCertificates = new Set(["sim", "emitido", "emitida", "certificado emitido", "certificada", "certificado"]);
const inactiveStatuses = new Set(["desistente", "desistencia", "desligado", "desligada", "desligamento", "inativo", "inativa", "cancelado", "cancelada"]);
const scoreFields = ["activities", "exam", "extra"] as const;
const summaryLabels = new Set(["total", "totais", "media", "media geral", "media da turma"]);

function summarizePerformance(participants: DiaryParticipant[]): ClassPerformance {
  return Object.fromEntries(performanceFields.map(field => {
    let sum = 0;
    let count = 0;
    for (const participant of participants) {
      const value = participant[field];
      if (value === null) continue;
      sum += value;
      count++;
    }
    return [field, { sum, count }];
  })) as ClassPerformance;
}

export function updateFinalGrades(current: ClassDiary, incoming: ClassDiary): ClassDiary {
  const names = new Set(current.approved.map(person => participantKey(person.name)));
  const seen = new Set<string>();
  const grades = new Map<string, number>();
  if (names.size !== current.approved.length) throw new Error("Há nomes duplicados no diário atual.");
  for (const person of incoming.participants) {
    const key = participantKey(person.name);
    if (!names.has(key) || seen.has(key)) {
      throw new Error("Há nomes duplicados ou que não correspondem à lista desta turma.");
    }
    seen.add(key);
    if (person.finalGrade === null) continue;
    if (!Number.isFinite(person.finalGrade) || person.finalGrade < 0 || person.finalGrade > 10) {
      throw new Error("As médias finais devem estar entre 0 e 10.");
    }
    grades.set(key, person.finalGrade);
  }
  if (!grades.size) throw new Error("Inclua ao menos uma média final válida na planilha.");

  const apply = (person: DiaryParticipant) => {
    const grade = grades.get(participantKey(person.name));
    return grade === undefined ? person : { ...person, finalGrade: grade };
  };
  const participants = current.participants.map(apply);
  return {
    ...current,
    participants,
    approved: current.approved.map(apply),
    performance: summarizePerformance(participants),
  };
}

export function parseClassDiary(bytes: Uint8Array, classId: ClassId, { asApprovalList = false } = {}): ClassDiary {
  const workbook = openExcelWorkbook(bytes);

  for (const sheetName of workbook.sheetNames) {
    const rows = workbook.readSheet(sheetName);
    const headers = rows.slice(0, 20).map(findColumns);
    const headerIndex = headers.findIndex(columns => columns.name && (asApprovalList || columns.result || columns.certificate || performanceFields.some(field => columns[field])));
    if (headerIndex === -1) continue;

    const columns = headers[headerIndex];
    const weeklyColumns = Object.entries(rows[headerIndex]).flatMap(([column, label]) => {
      const week = normalize(label).match(/^avaliacao\s+(?:semana|s)\s*0*([1-9]\d*)$/)?.[1];
      return week ? [{ column, week: Number(week) }] : [];
    });
    const title = [sheetName, ...rows.slice(0, headerIndex).flatMap(row => Object.values(row))].join(" ");
    const titleClass = normalize(title).match(/\bturma\s+([a-z])\b/)?.[1].toUpperCase();
    if (titleClass && titleClass !== classId) throw new Error(`O arquivo é da Turma ${titleClass}. Selecione essa turma para carregar o diário.`);

    const participants: DiaryParticipant[] = [];
    const approved: DiaryParticipant[] = [];
    let pending = 0;

    for (const row of rows.slice(headerIndex + 1)) {
      const cell = (field: Column) => {
        const column = columns[field];
        return column ? row[column] : undefined;
      };
      const name = String(cell("name") ?? "").trim();
      if (!name || summaryLabels.has(normalize(name))) continue;

      const rowClass = normalize(cell("classId")).match(/^(?:turma\s+)?([a-z])$/)?.[1].toUpperCase();
      const status = normalize(cell("status"));
      const result = normalize(cell("result"));
      const certificate = normalize(cell("certificate"));
      const grade = numberValue(cell("finalGrade"));
      const hasScoreColumns = scoreFields.some(field => columns[field]);
      const hasScore = scoreFields.some(field => numberValue(cell(field)) !== null);
      const participant: DiaryParticipant = {
        name,
        finalGrade: grade === 0 && hasScoreColumns && !hasScore ? null : grade,
        attendance: attendanceValue(cell("attendance")),
        highlightWeeks: numberValue(cell("highlightWeeks")),
        communication: numberValue(cell("communication")),
        initiative: numberValue(cell("initiative")),
        collaboration: numberValue(cell("collaboration")),
        teacherComment: observation(cell("teacherComment")),
        additionalObservation: observation(cell("additionalObservation")),
        weeklyGrades: weeklyColumns.flatMap(({ column, week }) => {
          const grade = numberValue(row[column]);
          return grade === null ? [] : [{ week, grade }];
        }),
      };
      if (!asApprovalList && !(rowClass || status || result || certificate || grade !== null || performanceFields.some(field => participant[field] !== null))) continue;
      if (rowClass && rowClass !== classId) throw new Error(`O diário contém registros da Turma ${rowClass}. Confira a turma selecionada.`);
      if (!asApprovalList && (inactiveStatuses.has(status) || inactiveStatuses.has(result))) continue;

      participants.push(participant);
      if (!asApprovalList && negatives.has(result)) continue;
      const isApproved = asApprovalList || approvals.has(result) || approvals.has(certificate) || issuedCertificates.has(certificate);
      if (isApproved) approved.push(participant);
      else pending++;
    }

    if (!participants.length && !asApprovalList) throw new Error("O diário não tem participantes ativos para esta turma.");
    return {
      total: participants.length,
      pending,
      performance: summarizePerformance(participants),
      participants: participants.sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
      approved: approved.sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    };
  }

  throw new Error("A planilha precisa ter a coluna de nome e os campos de resultado do diário de classe.");
}
