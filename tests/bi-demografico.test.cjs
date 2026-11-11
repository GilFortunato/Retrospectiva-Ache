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
const { biData, getDisabilitySummary, getSummary, normalizeFilters, csvSummary, emptyFilters } = loadTs("src/lib/biDemografico.ts");
const { approvedNameDigest, parseCandidateLocations, parseDemographicWorkbook, parseDemographicDashboard, parseDisabilityRoster } = loadTs("src/lib/biWorkbook.ts");
const { orderTeacherRecommendations, rankApprovals, rankByGrade } = loadTs("src/lib/approvalRanking.ts");
const { updateFinalGrades } = loadTs("src/lib/classDiary.ts");

function workbook(count, duplicate = false, geography = () => ["São Paulo", "SP", "Sudeste", "Capital"]) {
  const escape = value => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const headers = ["Participante", "Gênero", "Raça/cor", "Nascimento", "Idade", "Faixa etária", "Cidade", "UF", "Região Brasil", "Região SP", "Formação informada", "Área formação", "Situação formação"];
  const row = (values, index) => '<row r="' + index + '">' + values.map((value, column) => {
    const ref = String.fromCharCode(65 + column) + index;
    return typeof value === "number" ? `<c r="${ref}"><v>${value}</v></c>` : `<c r="${ref}" t="inlineStr"><is><t>${escape(value)}</t></is></c>`;
  }).join("") + "</row>";
  const records = Array.from({ length: count }, (_, i) => [duplicate ? "Pessoa de teste" : `Pessoa de teste ${i + 1}`, i % 2 ? "Mulher cisgênero" : "Homem cisgênero", "Parda", "campo privado", i ? 40 : 0, "faixa antiga", ...geography(i), "curso privado", "Saúde & Biológicas", "Superior informada"]);
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

test("candidate locations include only matched candidates and use the same name aliases as the BI", () => {
  const locations = parseCandidateLocations(workbook(3, false, index => [
    ["São Paulo", "SP", "Sudeste", "Capital"],
    ["Não informado", "—", "", ""],
    ["Curitiba", "PR", "Sul", ""],
  ][index]), [" PESSÓA  DE TESTE 1 ", "Nome no diário", "Sem correspondência"], {
    "Nome no diário": "Pessoa de teste 2",
  });
  assert.deepEqual(locations, {
    "pessoa de teste 1": { city: "São Paulo", state: "SP" },
    "nome no diario": { city: "", state: "" },
  });
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

test("disability totals protect small categories and differences between populations", () => {
  const key = "a".repeat(64);
  const names = Array.from({ length: 18 }, (_, index) => `Pessoa de teste ${index + 1}`);
  const labels = [...Array(7).fill("fisica"), ...Array(5).fill("visual"), ...Array(5).fill("neurodivergencia"), "intelectual"];
  const groups = Object.fromEntries(names.map((name, index) => [approvedNameDigest(name, key), labels[index]]));
  const roster = parseDisabilityRoster(JSON.stringify({ key, groups }));
  const approved = [...names.slice(0, 6), ...names.slice(7, 12), ...names.slice(12, 16)];
  const result = parseDemographicDashboard(workbook(18), approved, {}, roster);
  assert.equal(result.data.disabilityCounts.fisica, 7);
  assert.equal(result.data.disabilityCounts.intelectual, null);
  assert.equal(result.approved.disabilityCounts.fisica, null);
  assert.equal(result.approved.disabilityCounts.neurodivergencia, null);
  assert.doesNotMatch(JSON.stringify(result), /Pessoa de teste|[a-f0-9]{64}/);
});

test("pending classifications include approved candidates missing from demographics and protect small totals", () => {
  const key = "b".repeat(64);
  const names = Array.from({ length: 10 }, (_, index) => `Pessoa de teste ${index + 1}`);
  const absent = "Pessoa fora da planilha";
  const pending = [...names.slice(0, 5), absent];
  const approved = { key, digests: new Set([...names, absent].map(name => approvedNameDigest(name, key))) };
  const result = parseDemographicDashboard(workbook(15), approved, {}, undefined, pending);
  assert.equal(result.unmatched, 1);
  assert.equal(result.data.disabilityCounts["classificacao-pendente"], 5);
  assert.equal(result.approved.disabilityCounts["classificacao-pendente"], 6);
  assert.doesNotMatch(JSON.stringify(result), /Pessoa de teste|Pessoa fora da planilha/);

  const small = parseDemographicDashboard(workbook(15), approved, {}, undefined, [names[0], absent]);
  assert.equal(small.data.disabilityCounts["classificacao-pendente"], null);
  assert.equal(small.approved.disabilityCounts["classificacao-pendente"], null);
});

test("disability intersects population and geography for KPIs, charts and CSV", () => {
  const key = "c".repeat(64);
  const names = Array.from({ length: 36 }, (_, index) => `Pessoa de teste ${index + 1}`);
  const groups = Object.fromEntries(names.map((name, index) => [approvedNameDigest(name, key), index < 24 ? "fisica" : "visual"]));
  const roster = parseDisabilityRoster(JSON.stringify({ key, groups }));
  const source = workbook(36, false, i => {
    if (i < 6 || (i >= 24 && i < 30)) return ["São Paulo", "SP", "Sudeste", "Capital"];
    if (i < 12) return ["Campinas", "SP", "Sudeste", "Interior"];
    if (i < 18 || i >= 30) return ["Rio de Janeiro", "RJ", "Sudeste", ""];
    if (i < 23) return ["Salvador", "BA", "Nordeste", ""];
    return ["Curitiba", "PR", "Sul", ""];
  });
  const { data, approved } = parseDemographicDashboard(source, [...names.slice(0, 12), ...names.slice(24, 30)], {}, roster);
  assert.equal(getDisabilitySummary(emptyFilters, data, "fisica").total, 24);
  assert.equal(getDisabilitySummary({ ...emptyFilters, region: "Sudeste" }, data, "fisica").total, 18);
  assert.equal(getDisabilitySummary({ ...emptyFilters, state: "SP" }, approved, "fisica").total, 12);
  const capital = getDisabilitySummary({ ...emptyFilters, spRegion: "Capital" }, approved, "fisica");
  assert.equal(capital.total, 6);
  assert.equal(capital.distributions.education[0].count, 6);
  assert.equal(capital.distributions.gender[0].label, "Categorias agrupadas");
  assert.equal(getDisabilitySummary({ ...emptyFilters, state: "PR" }, data, "fisica"), null);
  assert.equal(getDisabilitySummary({ ...emptyFilters, state: "BA" }, data, "fisica"), null);
  assert.doesNotMatch(JSON.stringify(getDisabilitySummary(emptyFilters, data, "fisica").distributions.states), /"PR"|"BA"/);
  const csv = csvSummary(capital, "Aprovados · SP · Capital · Deficiência física", approved);
  assert.match(csv, /Aprovados · SP · Capital · Deficiência física/);
  assert.match(csv, /"Participantes";"6"/);
  assert.match(csv, /Área de formação/);
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

test("prioritized candidates appear in recommendation order even without a teacher highlight", () => {
  const candidates = [
    { classId: "B", name: "Terceira Pessoa" },
    { classId: "A", name: "Primeira Pessoa" },
    { classId: "C", name: "Outra Pessoa" },
    { classId: "B", name: "Segunda Pessoa" },
    { classId: "B", name: "Pessoa sem indicação" },
  ];
  const highlights = { C: { "outra pessoa": ["Indicação docente"] } };
  const priorities = { "A:primeira pessoa": 1, "B:segunda pessoa": 2, "B:terceira pessoa": 3 };
  const { featured, others } = orderTeacherRecommendations(candidates, highlights, priorities);
  assert.deepEqual(featured.map(row => row.name), ["Primeira Pessoa", "Segunda Pessoa", "Terceira Pessoa"]);
  assert.deepEqual(others.map(row => row.name), ["Outra Pessoa"]);
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
