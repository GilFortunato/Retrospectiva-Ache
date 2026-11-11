import { readFile, stat } from "node:fs/promises";
import { isAbsolute } from "node:path";

const MAX_BYTES = 8 * 1024 * 1024;
export const driveFileIdPattern = /^[A-Za-z0-9_-]{10,200}$/;

export function demographicWorkbookSource() {
  const localPath = process.env.BI_WORKBOOK_PATH;
  const fileId = process.env.BI_DRIVE_FILE_ID;
  if (localPath && isAbsolute(localPath)) return localPath;
  return fileId && driveFileIdPattern.test(fileId) ? fileId : null;
}

export function readApprovedNameAliases(): Record<string, string> | null {
  const config = process.env.BI_APROVADOS_NOMES_EQUIVALENTES?.trim();
  if (!config) return {};
  try {
    const value: unknown = JSON.parse(config);
    if (value && typeof value === "object" && !Array.isArray(value)
      && Object.entries(value).every(([name, target]) => name.trim() && typeof target === "string" && target.trim())) {
      return value as Record<string, string>;
    }
  } catch {
    // Keep invalid server configuration out of the response.
  }
  return null;
}

export async function readWorkbook(source: string) {
  let bytes: Uint8Array;
  if (isAbsolute(source)) {
    const file = await stat(source);
    if (!file.isFile()) throw new Error("A fonte configurada precisa ser um arquivo Excel.");
    if (file.size > MAX_BYTES) throw new Error("A planilha ultrapassa o limite de 8 MB do painel.");
    bytes = await readFile(source);
  } else {
    if (!driveFileIdPattern.test(source)) throw new Error("A fonte da planilha está configurada incorretamente.");
    const response = await fetch("https://drive.google.com/uc?export=download&id=" + encodeURIComponent(source), { cache: "no-store", signal: AbortSignal.timeout(35000) });
    if (!response.ok || response.headers.get("content-type")?.includes("text/html")) throw new Error("Não foi possível ler a planilha. Confira se o mesmo arquivo continua compartilhado para leitura por link.");
    if (Number(response.headers.get("content-length")) > MAX_BYTES) throw new Error("A planilha ultrapassa o limite de 8 MB do painel.");
    const reader = response.body?.getReader();
    if (!reader) throw new Error("O Drive não retornou o arquivo da planilha.");
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > MAX_BYTES) { await reader.cancel(); throw new Error("A planilha ultrapassa o limite de 8 MB do painel."); }
      chunks.push(value);
    }
    bytes = new Uint8Array(length);
    let offset = 0;
    chunks.forEach(chunk => { bytes.set(chunk, offset); offset += chunk.length; });
  }
  if (bytes.length > MAX_BYTES) throw new Error("A planilha ultrapassa o limite de 8 MB do painel.");
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error("A fonte não retornou um arquivo Excel válido.");
  return bytes;
}
