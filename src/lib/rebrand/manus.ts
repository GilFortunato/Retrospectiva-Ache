import "server-only";
import { resolveProviderKey } from "@/lib/acheVercelSecrets";

const ROOT = "https://api.manus.ai/v2";

export class ManusUnavailable extends Error {
  constructor(message: string) { super(message); this.name = "ManusUnavailable"; }
}
function cleanKey(raw: string | null) {
  if (!raw) throw new ManusUnavailable("API do Manus ainda não configurada no ADM. Cadastre a chave Manus para iniciar pesquisas.");
  return raw;
}
async function manusRequest(path: string, init: RequestInit = {}) {
  const key = cleanKey(await resolveProviderKey("manus"));
  const response = await fetch(ROOT + path, {
    ...init,
    headers: { "x-manus-api-key": key, "Content-Type": "application/json", ...(init.headers || {}) },
    signal: AbortSignal.timeout(18000),
    cache: "no-store",
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403)
      throw new ManusUnavailable("A chave Manus foi recusada. Confira se ela é uma API Key válida e está ativa.");
    if (response.status === 402 || response.status === 429)
      throw new ManusUnavailable("O Manus não autorizou a pesquisa por limite de créditos ou requisições. Verifique sua conta Manus.");
    throw new ManusUnavailable("O Manus não iniciou a pesquisa. Verifique a disponibilidade do serviço (HTTP " + response.status + ").");
  }
  return response.json() as Promise<Record<string, unknown>>;
}

const stringField = { type: "string" };
const stringArray = { type: "array", items: { type: "string" } };
const experiences = {
  type: "array",
  items: {
    type: "object",
    properties: { role: stringField, company: stringField, description: stringField },
    required: ["role", "company", "description"],
    additionalProperties: false,
  },
};
const sources = {
  type: "array",
  items: {
    type: "object",
    properties: { url: stringField, snippet: stringField },
    required: ["url", "snippet"],
    additionalProperties: false,
  },
};

const publicPosts = {
  type: "array",
  items: {
    type: "object",
    properties: { text: stringField, url: stringField, publishedAt: stringField },
    required: ["text", "url", "publishedAt"],
    additionalProperties: false,
  },
};

const schema = {
  type: "object",
  properties: {
    fullName: stringField, headline: stringField, about: stringField, experiences,
    education: stringArray, certifications: stringArray, skills: stringArray,
    posts: publicPosts, sources,
  },
  required: ["fullName", "headline", "about", "experiences", "education", "certifications", "skills", "posts", "sources"],
  additionalProperties: false,
};

export async function createManusResearch(profileUrl: string) {
  const prompt = [
    "Você é uma pesquisadora de perfis profissionais públicos para orientação de carreira, NÃO para seleção ou rejeição de candidatos.",
    "Pesquise SOMENTE o perfil público do LinkedIn informado. Não tente burlar login, paywalls, CAPTCHA ou configurações de privacidade.",
    "Link: " + profileUrl,
    "Extraia apenas dados publicamente acessíveis da própria pessoa: nome, headline, texto Sobre, experiências profissionais (cargo, empresa, descrição), formação, certificados e competências.",
    "Se existirem publicações próprias visíveis SEM login, tente recuperar até 5 posts profissionais recentes com texto literal, URL pública direta do post e data; caso inacessíveis, retorne posts como []. Não infira frequência, alcance, autoria ou engajamento.",
    "Avalie apenas os próprios posts da pessoa cujo URL foi informado. Para cada post, inclua em sources a URL do post com um snippet que corresponda ao seu texto; não use posts de homônimos nem publicações reproduzidas por terceiros.",
    "Para cada experiência retornada, inclua ao menos uma citação no perfil LinkedIn com trecho que confirme o cargo ou a empresa. Se não conseguir corroborar, não inclua a experiência.",
    "Para cada evidência encontrada, forneça sources com URL e snippet pequeno e fiel à página encontrada.",
    "Se a página não permitir acesso ou não puder confirmar informações, retorne strings vazias e listas vazias. NUNCA invente uma informação, use perfis homônimos, dados de terceiros ou copie propaganda de serviços de scraping.",
    "Não use conteúdo de publicidade, erros de robots, vendas de planos, documentação ou resultados não relacionados como evidência profissional.",
    "O campo 'sources' deve conter links precisos verificáveis, priorizando o LinkedIn original. Não gere aconselhamento ou pontuações.",
    "Retorne os dados no esquema JSON solicitado; use strings vazias/listas vazias quando não verificável.",
  ].join("\n");

  const value = await manusRequest("/task.create", {
    method: "POST",
    body: JSON.stringify({
      message: { content: [{ type: "text", text: prompt, visibility: "visible" }], connectors: [] },
      agent_profile: "lite",
      locale: "pt-BR",
      interactive_mode: false,
      hide_in_task_list: true,
      share_visibility: "private",
      title: "ReBrand Aché · pesquisa de LinkedIn público",
      structured_output_schema: schema,
    }),
  });
  if (value.ok !== true || typeof value.task_id !== "string" || value.task_id.length < 8)
    throw new ManusUnavailable("O Manus não retornou um ID válido da pesquisa.");
  return value.task_id;
}

type ManusMessage = {
  type?: string;
  structured_output_result?: { success?: boolean; value?: unknown };
  status_update?: { agent_status?: string };
};
function safeRecord(x: unknown): Record<string, unknown> | null {
  return x && typeof x === "object" && !Array.isArray(x) ? x as Record<string, unknown> : null;
}
function publicLinkedInSource(candidate: unknown, targetUrl: string) {
  const v = safeRecord(candidate);
  if (!v || typeof v.url !== "string" || typeof v.snippet !== "string" || v.snippet.trim().length < 12) return false;
  try {
    const source = new URL(v.url);
    const target = new URL(targetUrl);
    return source.protocol === "https:"
      && (source.hostname === "www.linkedin.com" || source.hostname === "linkedin.com")
      && source.pathname.toLowerCase().replace(/\/+$/, "") === target.pathname.toLowerCase().replace(/\/+$/, "");
  } catch { return false; }
}

export async function pollManusResearch(taskId: string, profileUrl: string):
  Promise<{ state: "processing" | "failed" | "complete"; profile?: unknown; posts?: unknown[]; message?: string }> {
  const params = new URLSearchParams({ task_id: taskId });
  const detail = await manusRequest("/task.detail?" + params.toString());
  const task = safeRecord(detail.task);
  if (!task || task.id !== taskId) throw new ManusUnavailable("O Manus não reconheceu a pesquisa solicitada.");
  if (task.status === "error" || task.status === "deleted") return { state: "failed", message: "O Manus não conseguiu finalizar a pesquisa." };
  if (task.status === "waiting") return { state: "failed", message: "A pesquisa exigiu uma confirmação manual e foi interrompida para evitar ações não autorizadas." };
  if (task.status !== "stopped" || task.has_running_background_jobs === true) return { state: "processing" };

  const messages = await manusRequest("/task.listMessages?" + new URLSearchParams({
    task_id: taskId, order: "desc", limit: "80",
  }).toString());
  if (messages.ok !== true || !Array.isArray(messages.messages)) return { state: "processing" };
  const records = messages.messages as ManusMessage[];
  const report = records.find((message) =>
    message.type === "structured_output_result" && message.structured_output_result?.success === true,
  )?.structured_output_result?.value;
  const result = safeRecord(report);
  if (!result) return { state: "failed", message: "O Manus finalizou, mas não entregou um resultado estruturado verificável." };

  // Reject fabricated or unrelated results: at least one directly cited piece
  // of text from the exact LinkedIn profile URL must exist.
  const claimedSources = Array.isArray(result.sources) ? result.sources : [];
  if (!claimedSources.some((value) => publicLinkedInSource(value, profileUrl)))
    return { state: "complete", profile: null, message: "O Manus não encontrou uma fonte pública verificável para o perfil." };
  // Individual content must have its own direct public LinkedIn citation.
  // If posts are hidden or not cited, they stay unevaluated, not a low score.
  const citedPosts = Array.isArray(result.posts) ? result.posts : [];
  const verifiedPosts = citedPosts.filter((candidate) => {
    const item = safeRecord(candidate);
    if (!item || typeof item.text !== "string" || item.text.trim().length < 35 || typeof item.url !== "string") return false;
    const postText = item.text;
    const postUrl = item.url;
    try {
      const url = new URL(postUrl);
      const sourceValid = url.protocol === "https:"
        && (url.hostname === "linkedin.com" || url.hostname === "www.linkedin.com")
        && (url.pathname.startsWith("/posts/") || url.pathname.startsWith("/feed/update/"));
      if (!sourceValid) return false;
      return claimedSources.some((candidateSource) => {
        const source = safeRecord(candidateSource);
        if (!source || source.url !== postUrl || typeof source.snippet !== "string") return false;
        const words = postText.toLocaleLowerCase("pt-BR").split(/[^\p{L}\p{N}]+/u).filter((word) => word.length > 4);
        const snippet = source.snippet.toLocaleLowerCase("pt-BR");
        return words.length >= 3 && words.slice(0, 12).filter((word) => snippet.includes(word)).length >= 3;
      });
    } catch { return false; }
  }).slice(0, 5);
  // A role must also have public evidence on the same profile page. A name
  // plus an unrelated job description is not sufficient for a career score.
  const publicProfileSnippets = claimedSources
    .filter((source) => publicLinkedInSource(source, profileUrl))
    .map((source) => {
      const row = safeRecord(source);
      return typeof row?.snippet === "string" ? row.snippet.toLocaleLowerCase("pt-BR") : "";
    });
  const verifiedExperiences = (Array.isArray(result.experiences) ? result.experiences : [])
    .filter((candidate) => {
      const experience = safeRecord(candidate);
      if (!experience) return false;
      const role = typeof experience.role === "string" ? experience.role.trim().toLocaleLowerCase("pt-BR") : "";
      const company = typeof experience.company === "string" ? experience.company.trim().toLocaleLowerCase("pt-BR") : "";
      if (!role || !company) return false;
      return publicProfileSnippets.some((snippet) => snippet.includes(role) || snippet.includes(company));
    }).slice(0, 20);
  const documented = { ...result, experiences: verifiedExperiences };
  return { state: "complete", profile: documented, posts: verifiedPosts };
}
