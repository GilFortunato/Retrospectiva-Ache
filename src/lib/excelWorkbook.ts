import { XMLParser } from "fast-xml-parser";
import { strFromU8, unzipSync } from "fflate";

export type WorkbookCell = string | number;
export type WorkbookRow = Record<string, WorkbookCell>;

type XmlObject = Record<string, unknown>;
const MAX_EXPANDED = 32 * 1024 * 1024;

function asArray(value: unknown): unknown[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function asObject(value: unknown): XmlObject {
  return value && typeof value === "object" ? value as XmlObject : {};
}

const entities: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function xmlText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (original, entity: string) => {
      if (entities[entity]) return entities[entity];
      const number = entity.startsWith("#x") ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isFinite(number) && number >= 0 && number <= 0x10ffff ? String.fromCodePoint(number) : original;
    });
  }

  const item = asObject(value);
  if ("#text" in item) return xmlText(item["#text"]);
  if ("t" in item) return xmlText(item.t);
  if ("r" in item) return asArray(item.r).map(xmlText).join("");
  return "";
}

export function openExcelWorkbook(bytes: Uint8Array) {
  let expanded = 0;
  // Read the workbook XML and saved cell values without opening macros or external links.
  const files = unzipSync(bytes, {
    filter(file) {
      if (!/^xl\/(?:workbook\.xml|_rels\/workbook\.xml\.rels|sharedStrings\.xml|worksheets\/[^/]+\.xml)$/.test(file.name)) return false;
      expanded += file.originalSize;
      if (file.originalSize > 16 * 1024 * 1024 || expanded > MAX_EXPANDED) {
        throw new Error("A planilha ultrapassa o limite de leitura do painel.");
      }
      return true;
    },
  });

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@",
    parseTagValue: false,
    trimValues: false,
    processEntities: false,
  });

  function parse(path: string): XmlObject {
    if (!files[path]) throw new Error("Não foi possível ler a estrutura da planilha.");
    return asObject(parser.parse(strFromU8(files[path]), true));
  }

  const workbook = asObject(parse("xl/workbook.xml").workbook);
  const relationships = asArray(asObject(parse("xl/_rels/workbook.xml.rels").Relationships).Relationship).map(asObject);
  const shared = files["xl/sharedStrings.xml"]
    ? asArray(asObject(parse("xl/sharedStrings.xml").sst).si).map(xmlText)
    : [];
  const sheets = asArray(asObject(workbook.sheets).sheet).map(asObject);

  function readSheet(name: string): WorkbookRow[] {
    const sheet = sheets.find(item => xmlText(item["@name"]) === name);
    if (!sheet) return [];
    const relationship = relationships.find(item => item["@Id"] === sheet["@r:id"]);
    const target = String(relationship?.["@Target"] || "");
    const path = target.startsWith("/") ? target.slice(1) : "xl/" + target.replace(/^\.\//, "");
    if (!/^xl\/worksheets\/[^/]+\.xml$/.test(path)) throw new Error("A referência interna da planilha é inválida.");

    const rows = asArray(asObject(asObject(parse(path).worksheet).sheetData).row);
    return rows.map(row => {
      const result: WorkbookRow = {};
      for (const cell of asArray(asObject(row).c).map(asObject)) {
        const column = String(cell["@r"] || "").replace(/\d/g, "");
        const raw = xmlText(cell.v);
        const kind = cell["@t"];
        if (kind === "s") result[column] = shared[Number(raw)] || "";
        else if (kind === "inlineStr") result[column] = xmlText(cell.is);
        else if (raw !== "" && !["str", "e"].includes(String(kind)) && Number.isFinite(Number(raw))) result[column] = Number(raw);
        else result[column] = raw;
      }
      return result;
    });
  }

  return { sheetNames: sheets.map(sheet => xmlText(sheet["@name"])), readSheet };
}
