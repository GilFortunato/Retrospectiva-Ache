import { createHmac } from "node:crypto";
import type { BiDataset, BiSummary, Distribution } from "@/lib/biDemografico";
import { openExcelWorkbook, type WorkbookRow } from "@/lib/excelWorkbook";
import { participantKey } from "@/lib/participantName";

const MISSING = "Não informado";
const MINIMUM_COHORT = 5;

export type ApprovedRoster = { key: string; digests: ReadonlySet<string> };

export function approvedNameDigest(name: string, key: string) {
  return createHmac("sha256", key).update(participantKey(name)).digest("hex");
}

export function parseDemographicWorkbook(bytes: Uint8Array): BiDataset {
  return parseDemographicDashboard(bytes).data;
}

export function parseDemographicDashboard(
  bytes: Uint8Array,
  approvedList?: readonly string[] | ApprovedRoster,
  approvedNameAliases: Readonly<Record<string, string>> = {},
) {
  const { readSheet } = openExcelWorkbook(bytes);
  const rows = readSheet("Base Tratada");
  const header = rows[0] || {};
  const required = ["Participante", "Gênero", "Raça/cor", "Idade", "Cidade", "UF", "Região Brasil", "Região SP", "Área formação", "Situação formação"];
  if (required.some(name => !Object.values(header).includes(name))) throw new Error("A aba Base Tratada não contém as colunas esperadas pelo BI.");
  const records = rows.slice(1).filter(row => row.A).map(row => Object.fromEntries(Object.entries(header).map(([column, title]) => [String(title), row[column] ?? ""])) as WorkbookRow);
  if (!records.length || records.length > 50000) throw new Error("A quantidade de registros da planilha é inválida.");
  if (new Set(records.map(row => String(row.Participante).trim().toLocaleLowerCase("pt-BR"))).size !== records.length) throw new Error("A planilha contém participantes repetidos. Revise a base antes de atualizar o BI.");

  const label = (value: unknown) => [undefined, null, "", "—", "-"].includes(value as string) ? MISSING : String(value).trim() || MISSING;
  const age = (row: WorkbookRow): number | null => typeof row.Idade === "number" && Number.isFinite(row.Idade) && row.Idade >= 18 && row.Idade <= 100 ? row.Idade : null;
  const ageBand = (row: WorkbookRow) => {
    const value = age(row);
    return value === null ? "Não informada" : value <= 24 ? "18–24" : value <= 34 ? "25–34" : value <= 44 ? "35–44" : value <= 54 ? "45–54" : "55+";
  };
  const distribution = (source: WorkbookRow[], field: string): Distribution => {
    const counts = new Map<string, number>();
    for (const row of source) { const key = label(row[field]); counts.set(key, (counts.get(key) || 0) + 1); }
    return [...counts].map(([name, count]) => ({ label: name, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR"));
  };
  const countUnique = (source: WorkbookRow[], field: string) => new Set(source.map(row => label(row[field])).filter(value => value !== MISSING)).size;
  function summarize(source: WorkbookRow[], comparisonTotal = source.length): BiSummary {
    const total = source.length;
    const outsideSelection = comparisonTotal - total;
    if (total < MINIMUM_COHORT || (outsideSelection > 0 && outsideSelection < MINIMUM_COHORT)) {
      return { total, restricted: true, cityCount: null, stateCount: null, regionCount: null, age: null, distributions: null };
    }
    const ages = source.map(age).filter((value): value is number => value !== null);
    const bands = new Map<string, number>();
    source.forEach(row => { const band = ageBand(row); bands.set(band, (bands.get(band) || 0) + 1); });
    const allCities = distribution(source, "Cidade");
    const cities = allCities.filter(item => item.count >= 3 && item.label !== MISSING).slice(0, 10);
    const others = allCities.filter(item => item.label !== MISSING).reduce((sum, item) => sum + item.count, 0) - cities.reduce((sum, item) => sum + item.count, 0);
    if (others) cities.push({ label: "Demais localidades", count: others });
    const unknownCity = allCities.find(item => item.label === MISSING);
    if (unknownCity) cities.push(unknownCity);
    return {
      total, restricted: false,
      cityCount: countUnique(source, "Cidade"), stateCount: countUnique(source, "UF"), regionCount: countUnique(source, "Região Brasil"),
      age: { mean: ages.length ? Math.round(ages.reduce((sum, value) => sum + value, 0) / ages.length * 10000) / 10000 : null, valid: ages.length, invalid: total - ages.length },
      distributions: {
        gender: distribution(source, "Gênero"), race: distribution(source, "Raça/cor"),
        ageBands: ["18–24", "25–34", "35–44", "45–54", "55+", "Não informada"].filter(name => bands.has(name)).map(name => ({ label: name, count: bands.get(name)! })),
        education: distribution(source, "Área formação"), educationStatus: distribution(source, "Situação formação"),
        regions: distribution(source, "Região Brasil"), states: distribution(source, "UF"),
        spRegions: distribution(source.filter(row => label(row.UF) === "SP"), "Região SP"), cities,
      },
    };
  }
  const regions = [...new Set(records.map(row => label(row["Região Brasil"])))].filter(value => value !== MISSING).sort();
  const states = [...new Map(records.filter(row => label(row.UF) !== MISSING).map(row => [label(row.UF), { value: label(row.UF), region: label(row["Região Brasil"]) }])).values()].sort((a, b) => a.value.localeCompare(b.value));
  const spRegions = [...new Set(records.filter(row => label(row.UF) === "SP").map(row => label(row["Região SP"])))].filter(value => value !== MISSING).sort();
  const dictionary = readSheet("Dicionário");
  const rawDate = dictionary.find(row => row.A === "Data de referência")?.B;
  const match = typeof rawDate === "string" ? rawDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/) : null;
  const referenceDate = match ? `${match[3]}-${match[2]}-${match[1]}` : typeof rawDate === "number" ? new Date(Date.UTC(1899, 11, 30) + rawDate * 86400000).toISOString().slice(0, 10) : "2026-09-18";
  const source = { fileName: "Planilha demográfica Aché", sheet: "Base Tratada", referenceDate, minimumCohort: MINIMUM_COHORT };
  const filters = { regions, states, spRegions };

  function createDataset(rows: WorkbookRow[], comparison?: BiDataset, unmatched = 0): BiDataset {
    const slices: Record<string, BiSummary> = {};
    const addSlice = (key: string, subset: WorkbookRow[]) => {
      const baseline = comparison?.slices[key]?.total;
      const comparisonTotal = baseline === undefined ? undefined : baseline + (key === "all" ? unmatched : 0);
      slices[key] = summarize(subset, comparisonTotal);
    };
    addSlice("all", rows);
    regions.forEach(region => addSlice("region:" + region, rows.filter(row => label(row["Região Brasil"]) === region)));
    states.forEach(state => addSlice("state:" + state.value, rows.filter(row => label(row.UF) === state.value)));
    spRegions.forEach(region => addSlice("sp:" + region, rows.filter(row => label(row.UF) === "SP" && label(row["Região SP"]) === region)));
    return { source, filters, slices };
  }

  const data = createDataset(records);
  if (!approvedList) return { data, approved: null, unmatched: 0 };

  const uniqueRecords = new Map<string, WorkbookRow | null>();
  for (const row of records) {
    const key = participantKey(String(row.Participante));
    uniqueRecords.set(key, uniqueRecords.has(key) ? null : row);
  }
  const aliases = new Map(Object.entries(approvedNameAliases).map(([name, target]) => [participantKey(name), participantKey(target)]));
  const roster = "digests" in approvedList ? approvedList : null;
  const names = "digests" in approvedList
    ? [...uniqueRecords.keys()].filter(name => approvedList.digests.has(approvedNameDigest(name, approvedList.key)))
    : [...new Set(approvedList.map(participantKey).filter(Boolean).map(name => {
      if (uniqueRecords.has(name)) return name;
      const target = aliases.get(name);
      return target && uniqueRecords.get(target) ? target : name;
    }))];
  const approvedRows = [...names].map(name => uniqueRecords.get(name)).filter((row): row is WorkbookRow => Boolean(row));
  const unmatched = (roster?.digests.size ?? names.length) - approvedRows.length;
  const missingDemographics = Array.from({ length: unmatched }, (): WorkbookRow => ({}));
  return { data, approved: createDataset([...approvedRows, ...missingDemographics], data, unmatched), unmatched };
}
