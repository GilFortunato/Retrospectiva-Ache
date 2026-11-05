import { XMLParser } from "fast-xml-parser";
import { strFromU8, unzipSync } from "fflate";
import type { BiDataset, BiSummary, Distribution } from "@/lib/biDemografico";

type Xml = Record<string, unknown>;
type RecordRow = Record<string, string | number>;
const MISSING = "Não informado";
const MINIMUM_COHORT = 5;
const MAX_EXPANDED = 32 * 1024 * 1024;

const array = (value: unknown): unknown[] => value === undefined || value === null ? [] : Array.isArray(value) ? value : [value];
const object = (value: unknown): Xml => value && typeof value === "object" ? value as Xml : {};
const decode = (value: string) => value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (original, entity: string) => {
  const entities: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
  if (entities[entity]) return entities[entity];
  const number = entity.startsWith("#x") ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
  return Number.isFinite(number) && number >= 0 && number <= 0x10ffff ? String.fromCodePoint(number) : original;
});
function xmlText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return decode(String(value));
  const item = object(value);
  if ("#text" in item) return xmlText(item["#text"]);
  if ("t" in item) return xmlText(item.t);
  if ("r" in item) return array(item.r).map(xmlText).join("");
  return "";
}

export function parseDemographicWorkbook(bytes: Uint8Array): BiDataset {
  let expanded = 0;
  // Only read workbook XML. VBA, executable content and external links are ignored.
  const files = unzipSync(bytes, { filter: file => {
    if (!/^xl\/(?:workbook\.xml|_rels\/workbook\.xml\.rels|sharedStrings\.xml|worksheets\/[^/]+\.xml)$/.test(file.name)) return false;
    expanded += file.originalSize;
    if (file.originalSize > 16 * 1024 * 1024 || expanded > MAX_EXPANDED) throw new Error("A planilha ultrapassa o limite de leitura do painel.");
    return true;
  } });
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@", parseTagValue: false, trimValues: false, processEntities: false });
  const parse = (path: string) => {
    if (!files[path]) throw new Error("Não foi possível ler a estrutura da planilha.");
    return object(parser.parse(strFromU8(files[path]), true));
  };
  const workbook = object(parse("xl/workbook.xml").workbook);
  const relationships = array(object(parse("xl/_rels/workbook.xml.rels").Relationships).Relationship).map(object);
  const shared = files["xl/sharedStrings.xml"] ? array(object(parse("xl/sharedStrings.xml").sst).si).map(xmlText) : [];
  const sheets = array(object(workbook.sheets).sheet).map(object);

  function readSheet(name: string): Record<string, string | number>[] {
    const sheet = sheets.find(item => item["@name"] === name);
    if (!sheet) return [];
    const relation = relationships.find(item => item["@Id"] === sheet["@r:id"]);
    const target = String(relation?.["@Target"] || "");
    const path = target.startsWith("/") ? target.slice(1) : "xl/" + target.replace(/^\.\//, "");
    if (!/^xl\/worksheets\/[^/]+\.xml$/.test(path)) throw new Error("A referência interna da planilha é inválida.");
    return array(object(object(parse(path).worksheet).sheetData).row).map(row => {
      const result: Record<string, string | number> = {};
      for (const cell of array(object(row).c).map(object)) {
        const column = String(cell["@r"] || "").replace(/\d/g, "");
        const raw = xmlText(cell.v);
        const kind = cell["@t"];
        result[column] = kind === "s" ? shared[Number(raw)] || "" : kind === "inlineStr" ? xmlText(cell.is) : raw !== "" && !["str", "e"].includes(String(kind)) && Number.isFinite(Number(raw)) ? Number(raw) : raw;
      }
      return result;
    });
  }

  const rows = readSheet("Base Tratada");
  const header = rows[0] || {};
  const required = ["Participante", "Gênero", "Raça/cor", "Idade", "Cidade", "UF", "Região Brasil", "Região SP", "Área formação", "Situação formação"];
  if (required.some(name => !Object.values(header).includes(name))) throw new Error("A aba Base Tratada não contém as colunas esperadas pelo BI.");
  const records = rows.slice(1).filter(row => row.A).map(row => Object.fromEntries(Object.entries(header).map(([column, title]) => [String(title), row[column] ?? ""])) as RecordRow);
  if (!records.length || records.length > 50000) throw new Error("A quantidade de registros da planilha é inválida.");
  if (new Set(records.map(row => String(row.Participante).trim().toLocaleLowerCase("pt-BR"))).size !== records.length) throw new Error("A planilha contém participantes repetidos. Revise a base antes de atualizar o BI.");

  const label = (value: unknown) => [undefined, null, "", "—", "-"].includes(value as string) ? MISSING : String(value).trim() || MISSING;
  const age = (row: RecordRow): number | null => typeof row.Idade === "number" && Number.isFinite(row.Idade) && row.Idade >= 18 && row.Idade <= 100 ? row.Idade : null;
  const ageBand = (row: RecordRow) => {
    const value = age(row);
    return value === null ? "Não informada" : value <= 24 ? "18–24" : value <= 34 ? "25–34" : value <= 44 ? "35–44" : value <= 54 ? "45–54" : "55+";
  };
  const distribution = (source: RecordRow[], field: string): Distribution => {
    const counts = new Map<string, number>();
    for (const row of source) { const key = label(row[field]); counts.set(key, (counts.get(key) || 0) + 1); }
    return [...counts].map(([name, count]) => ({ label: name, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR"));
  };
  const countUnique = (source: RecordRow[], field: string) => new Set(source.map(row => label(row[field])).filter(value => value !== MISSING)).size;
  function summarize(source: RecordRow[]): BiSummary {
    const total = source.length;
    if (total < MINIMUM_COHORT) return { total, restricted: true, cityCount: null, stateCount: null, regionCount: null, age: null, distributions: null };
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
  const slices: Record<string, BiSummary> = { all: summarize(records) };
  regions.forEach(region => { slices["region:" + region] = summarize(records.filter(row => label(row["Região Brasil"]) === region)); });
  states.forEach(state => { slices["state:" + state.value] = summarize(records.filter(row => label(row.UF) === state.value)); });
  spRegions.forEach(region => { slices["sp:" + region] = summarize(records.filter(row => label(row.UF) === "SP" && label(row["Região SP"]) === region)); });
  const dictionary = readSheet("Dicionário");
  const rawDate = dictionary.find(row => row.A === "Data de referência")?.B;
  const match = typeof rawDate === "string" ? rawDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/) : null;
  const referenceDate = match ? `${match[3]}-${match[2]}-${match[1]}` : typeof rawDate === "number" ? new Date(Date.UTC(1899, 11, 30) + rawDate * 86400000).toISOString().slice(0, 10) : "2026-09-18";
  return { source: { fileName: "Planilha demográfica Aché", sheet: "Base Tratada", referenceDate, minimumCohort: MINIMUM_COHORT }, filters: { regions, states, spRegions }, slices };
}
