import { openExcelWorkbook, type WorkbookCell, type WorkbookRow } from "@/lib/excelWorkbook";

export type ClassId = "A" | "B" | "C";

const performanceFields = ["finalGrade", "attendance", "highlightWeeks", "communication", "initiative", "collaboration"] as const;
export type PerformanceField = typeof performanceFields[number];
type MetricTotals = { sum: number; count: number };
export type ClassPerformance = Record<PerformanceField, MetricTotals>;
export type DiaryParticipant = Record<PerformanceField, number | null> & { name: string };

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

export function parseClassDiary(bytes: Uint8Array, classId: ClassId): ClassDiary {
  const workbook = openExcelWorkbook(bytes);

  for (const sheetName of workbook.sheetNames) {
    const rows = workbook.readSheet(sheetName);
    const headers = rows.slice(0, 20).map(findColumns);
    const headerIndex = headers.findIndex(columns => columns.name && (columns.result || columns.certificate || performanceFields.some(field => columns[field])));
    if (headerIndex === -1) continue;

    const columns = headers[headerIndex];
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
      };
      if (!(rowClass || status || result || certificate || grade !== null || performanceFields.some(field => participant[field] !== null))) continue;
      if (rowClass && rowClass !== classId) throw new Error(`O diário contém registros da Turma ${rowClass}. Confira a turma selecionada.`);
      if (inactiveStatuses.has(status) || inactiveStatuses.has(result)) continue;

      participants.push(participant);
      if (negatives.has(result)) continue;
      const isApproved = approvals.has(result) || approvals.has(certificate) || issuedCertificates.has(certificate);
      if (isApproved) approved.push(participant);
      else pending++;
    }

    if (!participants.length) throw new Error("O diário não tem participantes ativos para esta turma.");
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
