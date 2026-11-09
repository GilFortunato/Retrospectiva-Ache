import snapshot from "@/data/bi-demografico.json";
import type { ClassId } from "@/lib/classDiary";

export const disabilityGroups = {
  fisica: "Deficiência física",
  auditiva: "Deficiência auditiva",
  visual: "Deficiência visual",
  neurodivergencia: "Neurodivergência",
  intelectual: "Deficiência intelectual",
  outra: "Outra",
  "nao-informado": "Não informado",
} as const;
export type DisabilityGroup = keyof typeof disabilityGroups;
export type DisabilityCounts = Record<DisabilityGroup, number | null>;

export function isDisabilityGroup(value: string): value is DisabilityGroup {
  return Object.hasOwn(disabilityGroups, value);
}

export type Distribution = { label: string; count: number }[];
export type BiSummary = {
  total: number;
  restricted: boolean;
  cityCount: number | null;
  stateCount: number | null;
  regionCount: number | null;
  age: { mean: number | null; valid: number; invalid: number } | null;
  distributions: Record<"gender" | "race" | "ageBands" | "education" | "educationStatus" | "regions" | "states" | "spRegions" | "cities", Distribution> | null;
};

export type BiDataset = {
  source: { fileName: string; sheet: string; referenceDate: string; minimumCohort: number };
  filters: { regions: string[]; states: { value: string; region: string }[]; spRegions: string[] };
  slices: Record<string, BiSummary>;
  disabilityCounts?: DisabilityCounts;
};

export type BiApprovals = {
  data: BiDataset | null;
  classes: ClassId[];
  partial: boolean;
  unmatched: number;
  error?: string;
};

export const biData = snapshot as BiDataset;

export type BiFilters = { region: string; state: string; spRegion: string };
export const emptyFilters: BiFilters = { region: "", state: "", spRegion: "" };

export function normalizeFilters(filters: BiFilters, dataset: BiDataset = biData): BiFilters {
  const region = dataset.filters.regions.includes(filters.region) ? filters.region : "";
  const state = dataset.filters.states.find(s => s.value === filters.state && (!region || s.region === region));
  const spRegion = dataset.filters.spRegions.includes(filters.spRegion)
    && (!state || state.value === "SP") && (!region || region === "Sudeste") ? filters.spRegion : "";
  if (spRegion) return { region: "Sudeste", state: "SP", spRegion };
  return { region, state: state?.value || "", spRegion: "" };
}

export function getSummary(filters: BiFilters, dataset: BiDataset = biData): BiSummary {
  const clean = normalizeFilters(filters, dataset);
  const key = clean.spRegion ? "sp:" + clean.spRegion : clean.state ? "state:" + clean.state : clean.region ? "region:" + clean.region : "all";
  return dataset.slices[key];
}

export function filterLabel(filters: BiFilters, dataset: BiDataset = biData) {
  const clean = normalizeFilters(filters, dataset);
  return clean.spRegion ? "SP · " + clean.spRegion : clean.state ? clean.state : clean.region || "Brasil · base completa";
}

export function percent(value: number, total: number) {
  return new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 }).format(total ? value / total : 0);
}

function csvRows(rows: (string | number)[][]) {
  const escape = (value: string | number) => {
    const text = String(value);
    const safe = /^[=+\-@]/.test(text) ? "'" + text : text;
    return '"' + safe.replace(/"/g, '""') + '"';
  };
  return "\uFEFF" + rows.map(row => row.map(escape).join(";")).join("\r\n");
}

export function csvDisability(group: DisabilityGroup, population: string, count: number, total: number) {
  return csvRows([
    ["BI Demográfico - Programa de Inclusão PcD Aché"],
    ["Público", population],
    ["Categoria", "Participantes", "% do público"],
    [disabilityGroups[group], count, percent(count, total)],
  ]);
}

export function csvSummary(summary: BiSummary, selection: string, dataset: BiDataset = biData) {
  const rows: (string | number)[][] = [
    ["BI Demográfico - Programa de Inclusão PcD Aché"],
    ["Referência", dataset.source.referenceDate],
    ["Recorte", selection],
    ["Indicador", "Quantidade"],
    ["Participantes", summary.total],
  ];
  if (!summary.restricted && summary.distributions) {
    rows.push(["Localidades informadas", summary.cityCount ?? ""], ["UFs", summary.stateCount ?? ""], ["Regiões", summary.regionCount ?? ""], ["Idade média (anos)", summary.age?.mean?.toFixed(1).replace(".", ",") ?? ""], ["Idades válidas", summary.age?.valid ?? 0], ["Idades não informadas/inconsistentes", summary.age?.invalid ?? 0]);
    const names: Record<string, string> = { gender: "Gênero", race: "Raça/cor", ageBands: "Faixa etária", education: "Área de formação", educationStatus: "Situação da formação", regions: "Região Brasil", states: "UF", spRegions: "Região SP", cities: "Localidades" };
    for (const [dimension, values] of Object.entries(summary.distributions)) {
      rows.push([], [names[dimension], "Participantes", "% do recorte"]);
      values.forEach(item => rows.push([item.label, item.count, percent(item.count, summary.total)]));
    }
  } else rows.push(["Detalhamento", "Para proteger recortes pequenos, exibição limitada ao total."]);
  return csvRows(rows);
}
