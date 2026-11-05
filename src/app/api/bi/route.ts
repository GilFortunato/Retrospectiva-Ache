import { NextResponse } from "next/server";
import { parseDemographicWorkbook } from "@/lib/biWorkbook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const headers = { "Cache-Control": "no-store, max-age=0", "X-Content-Type-Options": "nosniff" };
const MAX_BYTES = 8 * 1024 * 1024;

export async function GET() {
  const fileId = process.env.BI_DRIVE_FILE_ID;
  if (!fileId || !/^[A-Za-z0-9_-]{10,200}$/.test(fileId)) return NextResponse.json({ error: "A leitura do Drive ainda não foi configurada para este painel." }, { status: 503, headers });
  try {
    const response = await fetch("https://drive.google.com/uc?export=download&id=" + encodeURIComponent(fileId), { cache: "no-store", signal: AbortSignal.timeout(35000) });
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
    const bytes = new Uint8Array(length);
    let offset = 0;
    chunks.forEach(chunk => { bytes.set(chunk, offset); offset += chunk.length; });
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error("O Drive não retornou um arquivo Excel válido. Confira a permissão de leitura da planilha.");
    const data = parseDemographicWorkbook(bytes);
    return NextResponse.json({ data, fetchedAt: new Date().toISOString() }, { headers });
  } catch (error) {
    // Never expose provider HTML, raw workbook data, file identifiers or credentials.
    const message = error instanceof Error && /^(A |O |Não |Aba )/.test(error.message) ? error.message : "Não foi possível atualizar os dados do Drive neste momento. Tente novamente.";
    return NextResponse.json({ error: message }, { status: 502, headers });
  }
}
