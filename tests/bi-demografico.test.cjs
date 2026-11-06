const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const { zipSync, strToU8 } = require("fflate");
const root = path.resolve(__dirname, "..");

function loadTs(relative) {
  const filename = path.join(root, relative);
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = loaded.require.bind(loaded);
  loaded.require = name => name.startsWith("@/lib/") ? loadTs("src/" + name.slice(2) + ".ts") : originalRequire(name.startsWith("@/") ? path.join(root, "src", name.slice(2)) : name);
  loaded._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
  return loaded.exports;
}
const { biData, getSummary, normalizeFilters, csvSummary, emptyFilters } = loadTs("src/lib/biDemografico.ts");
const { approvedNameDigest, parseDemographicWorkbook, parseDemographicDashboard } = loadTs("src/lib/biWorkbook.ts");
const { rankApprovals, rankByGrade } = loadTs("src/lib/approvalRanking.ts");
const { updateFinalGrades } = loadTs("src/lib/classDiary.ts");

function workbook(count, duplicate = false) {
  const escape = value => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const headers = ["Participante", "Gênero", "Raça/cor", "Nascimento", "Idade", "Faixa etária", "Cidade", "UF", "Região Brasil", "Região SP", "Formação informada", "Área formação", "Situação formação"];
  const row = (values, index) => '<row r="' + index + '">' + values.map((value, column) => {
    const ref = String.fromCharCode(65 + column) + index;
    return typeof value === "number" ? `<c r="${ref}"><v>${value}</v></c>` : `<c r="${ref}" t="inlineStr"><is><t>${escape(value)}</t></is></c>`;
  }).join("") + "</row>";
  const records = Array.from({ length: count }, (_, i) => [duplicate ? "Pessoa de teste" : `Pessoa de teste ${i + 1}`, i % 2 ? "Mulher cisgênero" : "Homem cisgênero", "Parda", "campo privado", i ? 40 : 0, "faixa antiga", "São Paulo", "SP", "Sudeste", "Capital", "curso privado", "Saúde & Biológicas", "Superior informada"]);
  const sheet = '<worksheet><sheetData>' + row(headers, 1) + records.map((values, index) => row(values, index + 2)).join("") + '</sheetData></worksheet>';
  return zipSync({
    "xl/workbook.xml": strToU8('<workbook><sheets><sheet name="Base Tratada" r:id="rId1"/><sheet name="Dicionário" r:id="rId2"/></sheets></workbook>'),
    "xl/_rels/workbook.xml.rels": strToU8('<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Target="worksheets/sheet2.xml"/></Relationships>'),
    "xl/worksheets/sheet1.xml": strToU8(sheet),
    "xl/worksheets/sheet2.xml": strToU8('<worksheet><sheetData><row><c r="A1" t="inlineStr"><is><t>Data de referência</t></is></c><c r="B1" t="inlineStr"><is><t>01/11/2026</t></is></c></row></sheetData></worksheet>'),
    "xl/vbaProject.bin": strToU8("Ignored macro content"),
  });
}

test("source totals reconcile across every demographic dimension", () => {
  assert.equal(biData.slices.all.total, 131);
  assert.equal(biData.slices.all.cityCount, 69);
  assert.equal(biData.slices.all.stateCount, 18);
  assert.equal(biData.slices.all.age.valid, 130);
  assert.equal(biData.slices.all.age.invalid, 1);
  for (const [key, summary] of Object.entries(biData.slices)) {
    if (summary.restricted) continue;
    for (const dimension of ["gender", "race", "ageBands", "education", "educationStatus", "regions", "states", "cities"]) {
      assert.equal(summary.distributions[dimension].reduce((sum, item) => sum + item.count, 0), summary.total, key + ":" + dimension);
    }
  }
});

test("geographic selections keep their intersections consistent", () => {
  assert.equal(getSummary({ region: "", state: "SP", spRegion: "" }).total, 68);
  assert.deepEqual(normalizeFilters({ region: "Nordeste", state: "SP", spRegion: "Capital" }), { region: "Nordeste", state: "", spRegion: "" });
  assert.equal(getSummary({ region: "Nordeste", state: "SP", spRegion: "Capital" }).total, 22);
  const capital = normalizeFilters({ ...emptyFilters, spRegion: "Capital" });
  assert.deepEqual(capital, { region: "Sudeste", state: "SP", spRegion: "Capital" });
  assert.equal(getSummary(capital).total, 24);
});

test("small cohorts export only totals and no demographic details", () => {
  const summary = getSummary({ region: "", state: "AC", spRegion: "" });
  assert.equal(summary.total, 1);
  assert.equal(summary.restricted, true);
  assert.equal(summary.distributions, null);
  assert.equal(summary.age, null);
  const csv = csvSummary(summary, "AC");
  assert.match(csv, /exibição limitada ao total/);
  assert.doesNotMatch(csv, /Gênero|Faixa etária|Raça/);
});

test("re-reading an edited workbook updates totals, filters and reference date", () => {
  const first = parseDemographicWorkbook(workbook(6));
  const updated = parseDemographicWorkbook(workbook(7));
  assert.equal(first.slices.all.total, 6);
  assert.equal(updated.slices.all.total, 7);
  assert.equal(updated.slices["sp:Capital"].total, 7);
  assert.equal(updated.slices.all.age.mean, 40);
  assert.equal(updated.slices.all.age.valid, 6);
  assert.equal(updated.slices.all.age.invalid, 1);
  assert.equal(updated.slices.all.distributions.education[0].label, "Saúde & Biológicas");
  assert.equal(updated.source.referenceDate, "2026-11-01");
  assert.doesNotMatch(JSON.stringify(updated), /Pessoa de teste|campo privado|curso privado|Ignored macro content/);
});

test("duplicate participants stop the import without disclosing identities", () => {
  assert.throws(() => parseDemographicWorkbook(workbook(6, true)), /participantes repetidos/);
});

test("the approved recorte deduplicates names, retains unmatched people and protects small complementary groups", () => {
  const names = [" PESSÓA  DE TESTE 1 ", "Pessoa de teste 1", ...Array.from({ length: 5 }, (_, i) => `Pessoa de teste ${i + 2}`), "Pessoa sem correspondência"];
  const result = parseDemographicDashboard(workbook(12), names);
  assert.equal(result.data.slices.all.total, 12);
  assert.equal(result.unmatched, 1);
  assert.equal(result.approved.slices.all.total, 7);
  assert.equal(result.approved.slices.all.distributions.gender.find(item => item.label === "Não informado").count, 1);
  const capital = getSummary({ ...emptyFilters, spRegion: "Capital" }, result.approved);
  assert.equal(capital.total, 6);
  assert.equal(capital.restricted, false);
  assert.equal(capital.distributions.gender.reduce((sum, item) => sum + item.count, 0), 6);
  assert.doesNotMatch(JSON.stringify(result), /Pessoa de teste|Pessoa sem correspondência/);

  const almostEveryone = parseDemographicDashboard(workbook(7), names).approved.slices.all;
  assert.equal(almostEveryone.total, 7);
  assert.equal(almostEveryone.restricted, true);
  assert.equal(almostEveryone.distributions, null);
});

test("CSV export protects spreadsheet cells from formula injection", () => {
  const summary = structuredClone(biData.slices.all);
  summary.distributions.education[0].label = '=HYPERLINK("https://example.invalid")';
  const csv = csvSummary(summary, "Brasil");
  assert.match(csv, /'\=HYPERLINK/);
  assert.equal(csv.startsWith("\uFEFF"), true);
});

test("verified name aliases merge a unique demographic record and preserve exact matches", () => {
  const names = Array.from({ length: 6 }, (_, i) => `Pessoa de teste ${i + 1}`);
  const result = parseDemographicDashboard(workbook(12), [...names, "Grafia alternativa", "Sem registro"], {
    "Grafia alternativa": " PESSÔA  DE TESTE 1 ",
    "Pessoa de teste 6": "Pessoa de teste 2",
    "Sem registro": "Registro ausente",
  });
  assert.equal(result.approved.slices.all.total, 7);
  assert.equal(result.approved.slices["sp:Capital"].total, 6);
  assert.equal(result.unmatched, 1);
  assert.doesNotMatch(JSON.stringify(result), /Grafia alternativa|Pessoa de teste|Sem registro/);
});

test("a server-side approved roster excludes the general population from the approved distributions", () => {
  const key = "a".repeat(64);
  const digests = new Set(Array.from({ length: 6 }, (_, index) => approvedNameDigest(`PESSOA  DE TESTE ${index + 1}`, key)));
  const result = parseDemographicDashboard(workbook(12), { key, digests });
  assert.equal(result.data.slices.all.total, 12);
  assert.equal(result.approved.slices.all.total, 6);
  assert.equal(result.approved.slices["sp:Capital"].total, 6);
  assert.equal(result.unmatched, 0);
  assert.equal(result.approved.slices.all.distributions.gender.reduce((total, item) => total + item.count, 0), 6);
  assert.ok(!JSON.stringify(result).includes([...digests][0]));
});

test("the approved ranking compares common weeks, shares tied positions and uses final grades when available", () => {
  const people = [
    { name: "Ana", finalGrade: null, weeklyGrades: [{ week: 1, grade: 9 }, { week: 2, grade: 4 }] },
    { name: "Beatriz", finalGrade: null, weeklyGrades: [{ week: 1, grade: 9 }] },
    { name: "Carlos", finalGrade: null, weeklyGrades: [{ week: 1, grade: 7 }] },
    { name: "Daniel", finalGrade: null, weeklyGrades: [] },
  ];
  const weekly = rankApprovals(people);
  assert.deepEqual(weekly.weeks, [1]);
  assert.deepEqual(weekly.rows.map(row => [row.name, row.grade, row.position]), [
    ["Ana", 9, 1], ["Beatriz", 9, 1], ["Carlos", 7, 3], ["Daniel", null, null],
  ]);

  const final = rankApprovals([{ ...people[0], finalGrade: 8 }, ...people.slice(1)]);
  assert.equal(final.usesFinalGrade, true);
  assert.deepEqual(final.rows.map(row => [row.grade, row.position]), [[8, 1], [null, null], [null, null], [null, null]]);
});

test("updating class grades re-ranks candidates without replacing their profiles", () => {
  const ana = { name: "Ana Silva", finalGrade: null, teacherComment: "Comentário original" };
  const bruno = { name: "Bruno", finalGrade: null };
  const current = { approved: [ana, bruno], participants: [ana, bruno] };
  const incoming = { participants: [{ name: "ANA  SILVA", finalGrade: 9, teacherComment: null }] };
  const updated = updateFinalGrades(current, incoming);
  assert.deepEqual(updated.approved, [{ ...ana, finalGrade: 9 }, bruno]);
  assert.equal(updated.performance.finalGrade.sum, 9);
  assert.equal(updated.performance.finalGrade.count, 1);
  assert.equal(ana.finalGrade, null);
  assert.throws(() => updateFinalGrades(current, { participants: [...incoming.participants, { name: "Outro", finalGrade: 10 }] }), /não correspondem/);
  const ranking = rankByGrade([
    ...updated.approved.map(person => ({ name: person.name, grade: person.finalGrade, classId: "A" })),
    { name: "Caio", grade: 9, classId: "B" },
  ]);
  assert.deepEqual(ranking.map(row => [row.classId, row.position]), [["A", 1], ["B", 1], ["A", null]]);
});

test("the refresh API re-reads the workbook on each call with no-store responses", async () => {
  const originalFetch = global.fetch;
  const previousFile = process.env.BI_DRIVE_FILE_ID;
  process.env.BI_DRIVE_FILE_ID = "fixture_source_12345";
  const { GET } = loadTs("src/app/api/bi/route.ts");
  let count = 6;
  let calls = 0;
  global.fetch = async (url, options) => {
    assert.match(url, /^https:\/\/drive\.google\.com\/uc\?/);
    assert.equal(options.cache, "no-store");
    calls++;
    return new Response(workbook(count), { headers: { "Content-Type": "application/octet-stream" } });
  };
  try {
    const first = await GET();
    assert.equal(first.status, 200);
    assert.match(first.headers.get("Cache-Control"), /no-store/);
    assert.equal((await first.json()).data.slices.all.total, 6);
    count = 7;
    const updated = await GET();
    const text = await updated.text();
    assert.equal(JSON.parse(text).data.slices.all.total, 7);
    assert.equal(calls, 2);
    assert.doesNotMatch(text, /fixture_source_12345|Pessoa de teste|campo privado|curso privado/);
  } finally {
    global.fetch = originalFetch;
    if (previousFile === undefined) delete process.env.BI_DRIVE_FILE_ID;
    else process.env.BI_DRIVE_FILE_ID = previousFile;
  }
});
