import { createHmac } from "node:crypto";
import { disabilityGroups, isDisabilityGroup, protectedBucket, type BiDataset, type BiSummary, type DisabilityCounts, type DisabilityGroup, type Distribution } from "@/lib/biDemografico";
import { openExcelWorkbook, type WorkbookRow } from "@/lib/excelWorkbook";
import { participantKey } from "@/lib/participantName";

const MISSING = "Não informado";
const MINIMUM_COHORT = 5;
const disabilityColumn = "Grupo de deficiência ou neurodivergência";
const groupKeys = Object.keys(disabilityGroups).filter(isDisabilityGroup);
const small = (count: number) => count > 0 && count < MINIMUM_COHORT;

export type ApprovedRoster = { key: string; digests: ReadonlySet<string> };
type DisabilityRoster = { key: string; groups: ReadonlyMap<string, DisabilityGroup> };

export function approvedNameDigest(name: string, key: string) {
  return createHmac("sha256", key).update(participantKey(name)).digest("hex");
}

export function parseDisabilityRoster(config: string): DisabilityRoster {
  const value = JSON.parse(config) as { key?: unknown; groups?: unknown } | null;
  if (!value || typeof value.key !== "string" || !/^[a-f0-9]{64}$/.test(value.key) || !value.groups
    || typeof value.groups !== "object" || Array.isArray(value.groups)) throw new Error("O recorte por deficiência não está configurado corretamente.");
  const groups = new Map<string, DisabilityGroup>();
  for (const [digest, group] of Object.entries(value.groups)) {
    if (!/^[a-f0-9]{64}$/.test(digest) || typeof group !== "string" || !isDisabilityGroup(group)) {
      throw new Error("O recorte por deficiência não está configurado corretamente.");
    }
    groups.set(digest, group);
  }
  return { key: value.key, groups };
}

function protectedDisabilityCounts(
  records: WorkbookRow[], approvedRows: WorkbookRow[] | undefined,
  groupFor: (row: WorkbookRow) => DisabilityGroup,
) {
  const tally = (rows: WorkbookRow[]) => {
    const counts = Object.fromEntries(groupKeys.map(group => [group, 0])) as Record<DisabilityGroup, number>;
    for (const row of rows) counts[groupFor(row)]++;
    return counts;
  };
  const totals = tally(records);
  const display = (counts: Record<DisabilityGroup, number>, suppressed: Set<DisabilityGroup>) => {
    // Hide a second category if the population total would reveal the only hidden count.
    if (suppressed.size === 1 || small([...suppressed].reduce((total, group) => total + counts[group], 0))) {
      const secondary = groupKeys.filter(group => !suppressed.has(group))
        .sort((a, b) => (counts[a] || Infinity) - (counts[b] || Infinity))[0];
      if (secondary) suppressed.add(secondary);
    }
    return Object.fromEntries(groupKeys.map(group => [group, suppressed.has(group) ? null : counts[group]])) as DisabilityCounts;
  };
  const hiddenGeneral = new Set(groupKeys.filter(group => small(totals[group])));
  const general = display(totals, hiddenGeneral);
  if (!approvedRows) return { general };
  const passed = tally(approvedRows);
  const matched = tally(approvedRows.filter(row => row.Participante));
  const hiddenApproved = new Set(groupKeys.filter(group => hiddenGeneral.has(group) || small(passed[group])
    || small(totals[group] - matched[group])));
  return { general, approved: display(passed, hiddenApproved) };
}

function protectBuckets(items: Distribution, hiddenLabel: (label: string) => boolean = () => false): Distribution {
  const visible = items.filter(item => !small(item.count) && !hiddenLabel(item.label));
  let hidden = items.reduce((total, item) => total + item.count, 0) - visible.reduce((total, item) => total + item.count, 0);
  if (small(hidden) || items.length - visible.length === 1) {
    if (!visible.length) return [];
    hidden += visible.pop()!.count;
  }
  return hidden >= MINIMUM_COHORT ? [...visible, { label: protectedBucket, count: hidden }] : visible;
}

export function parseDemographicWorkbook(bytes: Uint8Array): BiDataset {
  return parseDemographicDashboard(bytes).data;
}

export function parseDemographicDashboard(
  bytes: Uint8Array,
  approvedList?: readonly string[] | ApprovedRoster,
  approvedNameAliases: Readonly<Record<string, string>> = {},
  disabilityRoster?: DisabilityRoster,
  pendingDisabilityNames: readonly string[] = [],
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

  function geographicRows(rows: WorkbookRow[]) {
    const scopes: Record<string, WorkbookRow[]> = { all: rows };
    regions.forEach(region => { scopes["region:" + region] = rows.filter(row => label(row["Região Brasil"]) === region); });
    states.forEach(state => { scopes["state:" + state.value] = rows.filter(row => label(row.UF) === state.value); });
    spRegions.forEach(region => { scopes["sp:" + region] = rows.filter(row => label(row.UF) === "SP" && label(row["Região SP"]) === region); });
    return scopes;
  }

  function createDataset(rows: WorkbookRow[], comparison?: BiDataset, unmatched = 0): BiDataset {
    const slices: Record<string, BiSummary> = {};
    for (const [key, subset] of Object.entries(geographicRows(rows))) {
      const baseline = comparison?.slices[key]?.total;
      const comparisonTotal = baseline === undefined ? undefined : baseline + (key === "all" ? unmatched : 0);
      slices[key] = summarize(subset, comparisonTotal);
    }
    return { source, filters, slices };
  }

  const data = createDataset(records);
  const uniqueRecords = new Map<string, WorkbookRow | null>();
  for (const row of records) {
    const key = participantKey(String(row.Participante));
    uniqueRecords.set(key, uniqueRecords.has(key) ? null : row);
  }
  const aliases = new Map(Object.entries(approvedNameAliases).map(([name, target]) => [participantKey(name), participantKey(target)]));
  const resolveName = (name: string) => {
    const key = participantKey(name);
    if (uniqueRecords.has(key)) return key;
    const target = aliases.get(key);
    return target && uniqueRecords.get(target) ? target : key;
  };
  const pendingNames = new Set(pendingDisabilityNames.map(resolveName).filter(Boolean));
  const pendingRows = new Set([...pendingNames].flatMap(name => {
    const row = uniqueRecords.get(name);
    return row ? [row] : [];
  }));
  const hasDisabilityColumn = Object.values(header).includes(disabilityColumn);
  const hasDisability = hasDisabilityColumn || Boolean(disabilityRoster) || pendingNames.size > 0;
  const groupFor = (row: WorkbookRow): DisabilityGroup => {
    if (pendingRows.has(row)) return "classificacao-pendente";
    if (hasDisabilityColumn) {
      const group = groupKeys.find(key => disabilityGroups[key] === row[disabilityColumn]);
      return group ?? "nao-informado";
    }
    if (disabilityRoster && typeof row.Participante === "string") {
      return disabilityRoster.groups.get(approvedNameDigest(row.Participante, disabilityRoster.key)) ?? "nao-informado";
    }
    return "nao-informado";
  };

  function addDisabilityBreakdown(approved?: BiDataset, approvedPopulation?: WorkbookRow[]) {
    const generalScopes = geographicRows(records);
    const approvedScopes = approvedPopulation && geographicRows(approvedPopulation);
    const counts = Object.fromEntries(Object.entries(generalScopes).map(([key, scope]) => [key,
      protectedDisabilityCounts(scope, approvedScopes?.[key], groupFor),
    ]));
    const children: Record<string, string[]> = { all: regions.map(region => "region:" + region) };
    for (const state of states) (children[regions.includes(state.region) ? "region:" + state.region : "all"] ??= []).push("state:" + state.value);
    if (spRegions.length) children["state:SP"] = spRegions.map(region => "sp:" + region);

    function buildBreakdown(dataset: BiDataset, scopes: Record<string, WorkbookRow[]>, population: "general" | "approved") {
      const nationalCounts = counts.all[population]!;
      const byScope = (group: DisabilityGroup) => {
        const selected = Object.fromEntries(Object.entries(scopes).map(([key, scope]) => [key, scope.filter(row => groupFor(row) === group)]));
        const hidden = new Set(Object.keys(selected).filter(key => nationalCounts[group] === null || counts[key][population]?.[group] === null
          || (population === "approved" && data.disabilitySlices?.[group]?.[key] === null)));
        // Protect small remainders when a parent total is compared with its geographic children.
        for (const [parent, keys] of Object.entries(children)) {
          if (hidden.has(parent)) {
            keys.forEach(key => hidden.add(key));
            continue;
          }
          const visible = keys.filter(key => !hidden.has(key) && selected[key].length > 0);
          const remainder = selected[parent].length - visible.reduce((total, key) => total + selected[key].length, 0);
          if (small(remainder)) {
            visible.sort((a, b) => selected[a].length - selected[b].length);
            if (visible.length) hidden.add(visible[0]);
          }
        }
        return Object.fromEntries(Object.entries(selected).map(([key, rows]) => {
          if (hidden.has(key)) return [key, null];
          const summary = summarize(rows);
          if (summary.distributions) {
            for (const [field, items] of Object.entries(summary.distributions) as [keyof NonNullable<BiSummary["distributions"]>, Distribution][]) {
              const prefix = field === "regions" ? "region:" : field === "states" ? "state:" : field === "spRegions" ? "sp:" : "";
              summary.distributions[field] = protectBuckets(items, name => Boolean(prefix) && hidden.has(prefix + name));
            }
          }
          return [key, summary];
        }));
      };
      dataset.disabilityCounts = nationalCounts;
      dataset.disabilitySlices = Object.fromEntries(groupKeys.map(group => [group, byScope(group)])) as BiDataset["disabilitySlices"];
    }

    buildBreakdown(data, generalScopes, "general");
    if (approved && approvedScopes) buildBreakdown(approved, approvedScopes, "approved");
  }
  if (!approvedList) {
    if (hasDisability) addDisabilityBreakdown();
    return { data, approved: null, unmatched: 0 };
  }

  const roster = "digests" in approvedList ? approvedList : null;
  const names = "digests" in approvedList
    ? [...uniqueRecords.keys()].filter(name => approvedList.digests.has(approvedNameDigest(name, approvedList.key)))
    : [...new Set(approvedList.map(resolveName).filter(Boolean))];
  const approvedRows = [...names].map(name => uniqueRecords.get(name)).filter((row): row is WorkbookRow => Boolean(row));
  const unmatched = (roster?.digests.size ?? names.length) - approvedRows.length;
  const missingDemographics = Array.from({ length: unmatched }, (): WorkbookRow => ({}));
  const approvedNames = new Set(names);
  const pendingUnmatched = [...pendingNames].filter(name => !uniqueRecords.get(name) && (
    roster ? roster.digests.has(approvedNameDigest(name, roster.key)) : approvedNames.has(name)
  )).length;
  missingDemographics.slice(0, pendingUnmatched).forEach(row => pendingRows.add(row));
  const approvedPopulation = [...approvedRows, ...missingDemographics];
  const approved = createDataset(approvedPopulation, data, unmatched);
  if (hasDisability) addDisabilityBreakdown(approved, approvedPopulation);
  return { data, approved, unmatched };
}
