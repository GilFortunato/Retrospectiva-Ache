import { openExcelWorkbook, type WorkbookCell, type WorkbookRow } from "@/lib/excelWorkbook";

export type ClassId = "A" | "B" | "C";

export type ApprovedParticipant = {
  name: string;
  attendance: number | null;
  finalGrade: number | null;
};

export type ClassDiary = {
  total: number;
  pending: number;
  averageAttendance: number | null;
  approved: ApprovedParticipant[];
};

const columnLabels = {
  name: ["name", "nome", "nome completo", "participante"],
  classId: ["turma"],
  status: ["status na trilha"],
  attendance: ["frequencia", "frequencia final"],
  finalGrade: ["media final", "nota final"],
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

export function parseClassDiary(bytes: Uint8Array, classId: ClassId): ClassDiary {
  const workbook = openExcelWorkbook(bytes);

  for (const sheetName of workbook.sheetNames) {
    const rows = workbook.readSheet(sheetName);
    const headers = rows.slice(0, 20).map(findColumns);
    const headerIndex = headers.findIndex(columns => columns.name && (columns.attendance || columns.finalGrade || columns.result || columns.certificate));
    if (headerIndex === -1) continue;

    const columns = headers[headerIndex];
    const title = [sheetName, ...rows.slice(0, headerIndex).flatMap(row => Object.values(row))].join(" ");
    const titleClass = normalize(title).match(/\bturma\s+([a-z])\b/)?.[1].toUpperCase();
    if (titleClass && titleClass !== classId) throw new Error(`O arquivo é da Turma ${titleClass}. Selecione essa turma para carregar o diário.`);

    const approved: ApprovedParticipant[] = [];
    let total = 0;
    let pending = 0;
    let attendanceCount = 0;
    let attendanceSum = 0;

    for (const row of rows.slice(headerIndex + 1)) {
      const cell = (field: Column) => {
        const column = columns[field];
        return column ? row[column] : undefined;
      };
      const name = String(cell("name") ?? "").trim();
      const rowClass = normalize(cell("classId")).match(/^(?:turma\s+)?([a-z])$/)?.[1].toUpperCase();
      const status = normalize(cell("status"));
      const result = normalize(cell("result"));
      const certificate = normalize(cell("certificate"));
      const attendance = attendanceValue(cell("attendance"));
      const grade = numberValue(cell("finalGrade"));
      if (!name || !(rowClass || status || result || certificate || attendance !== null || grade !== null)) continue;
      if (rowClass && rowClass !== classId) throw new Error(`O diário contém registros da Turma ${rowClass}. Confira a turma selecionada.`);
      if (inactiveStatuses.has(status) || inactiveStatuses.has(result)) continue;

      total++;
      if (attendance !== null) {
        attendanceCount++;
        attendanceSum += attendance;
      }

      if (negatives.has(result)) continue;
      const isApproved = approvals.has(result) || approvals.has(certificate) || issuedCertificates.has(certificate);
      if (!isApproved) {
        pending++;
        continue;
      }

      const hasScoreColumns = scoreFields.some(field => columns[field]);
      const hasScore = scoreFields.some(field => numberValue(cell(field)) !== null);
      const finalGrade = grade === 0 && hasScoreColumns && !hasScore ? null : grade;
      approved.push({ name, attendance, finalGrade });
    }

    if (!total) throw new Error("O diário não tem participantes ativos para esta turma.");
    return {
      total,
      pending,
      averageAttendance: attendanceCount ? attendanceSum / attendanceCount : null,
      approved: approved.sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    };
  }

  throw new Error("A planilha precisa ter a coluna de nome e os campos de resultado do diário de classe.");
}
