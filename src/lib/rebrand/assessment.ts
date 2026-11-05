export type ProfilePost = { text: string; publishedAt: string; url: string; reactions: number | null; comments: number | null; reposts: number | null };
export type ProfileExperience = { role: string; company: string; description: string };
export type PublicProfile = {
  name: string;
  headline: string;
  about: string;
  experiences: ProfileExperience[];
  education: string[];
  certifications: string[];
  skills: string[];
  posts: ProfilePost[];
};

export type EvidenceDimension = {
  key: string;
  label: string;
  weight: number;
  score: number | null;
  status: "evaluated" | "not_evaluated";
  rationale: string;
  evidence: string[];
  action: string;
};

export type DevelopmentWeek = { week: number; title: string; focus: string; actions: string[] };
export type CareerTransitionReview = {
  targetRole: string;
  headlineStatus: "aligned" | "partially_aligned" | "needs_repositioning" | "not_evaluated";
  headlineLabel: string;
  currentHeadline: string;
  explanation: string;
  transferableStrengths: string[];
  developmentPriorities: string[];
  headlineSuggestions: string[];
  aboutSuggestion: string;
  disclaimer: string;
};


const limits = { text: 4000, item: 200 };
const roleTerms = ["comunica", "relacion", "atend", "venda", "cliente", "saúde", "saude", "farmac", "ciênc", "cienc", "educa", "apresent", "planeja", "organiza", "negocia", "resultado", "ética", "etica"];
const outcomeTerms = /\b(?:\d+[\d.,]*\s*%|\d+[\d.,]*\s*(?:clientes?|projetos?|pessoas?|meses?|anos?|horas?|pontos?))\b/i;

export function cleanText(value: unknown, max = limits.text): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function read(obj: Record<string, unknown> | null, fields: string[]): unknown {
  if (!obj) return undefined;
  for (const field of fields) if (obj[field] !== undefined && obj[field] !== null) return obj[field];
  return undefined;
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function field(obj: Record<string, unknown> | null, keys: string[]): string {
  const value = read(obj, keys);
  return cleanText(typeof value === "string" ? value : record(value)?.name);
}

function records(obj: Record<string, unknown> | null, keys: string[]) {
  const value = read(obj, keys);
  return Array.isArray(value) ? value.map(record).filter((item): item is Record<string, unknown> => item !== null) : [];
}

function unique(items: string[], max = 12): string[] {
  return [...new Set(items.filter(Boolean))].slice(0, max);
}

function asList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return unique(value.map((item) => cleanText(typeof item === "string" ? item : field(record(item), ["name", "title", "skill", "institution", "schoolName"])), 30));
}

function numberField(obj: Record<string, unknown>, keys: string[]): number | null {
  const value = read(obj, keys);
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.round(value));
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return null;
}

export function normalizeProfile(data: unknown, postsData: unknown = []): PublicProfile | null {
  const obj = record(data);
  if (!obj) return null;

  // Some LinkedIn actors return a dataset row containing an error message,
  // including paywall/upgrade notices, even when the HTTP request succeeds.
  // Never reinterpret such rows as a real person's headline or About section.
  const providerFailure = [obj.error, obj.message, obj.errorMessage, obj.notice, obj.description, obj.headline, obj.about, obj.text]
    .filter((value): value is string => typeof value === "string")
    .join(" ");
  const collectorPaywall = /(?:this actor requires a paid apify plan|free.plan runs do not scrape|upgrade to any paid apify plan|plans start at \$\d+|apify plan.*(?:scrap|extract|upgrade))/i.test(providerFailure);
  const collectorError = /(?:^|\s)(?:actor run failed|actor failed|insufficient plan|subscription required|plan limit reached|rate limit exceeded)(?:\s|[.!:]|$)/i.test(
    [obj.error, obj.errorMessage, obj.message].filter((value): value is string => typeof value === "string").join(" ")
  );
  if (collectorPaywall || collectorError) return null;
  const experiences = records(obj, ["experience", "experiences", "positions"]).map((item) => ({
    role: field(item, ["role", "title", "position", "jobTitle"]),
    company: field(item, ["companyName", "company", "organization", "employer"]),
    description: field(item, ["description", "summary", "details"]),
  })).filter((item) => item.role || item.company || item.description).slice(0, 25);
  const educationObjects = records(obj, ["education", "educations"]).map((item) =>
    [field(item, ["degree", "degreeName"]), field(item, ["field", "fieldOfStudy"]), field(item, ["institution", "schoolName", "school"])].filter(Boolean).join(" · ")
  ).filter(Boolean).slice(0, 15);
  const certificationObjects = records(obj, ["certifications", "certificates", "licensesAndCertifications"]).map((item) =>
    [field(item, ["name", "title"]), field(item, ["institution", "issuer", "authority"])].filter(Boolean).join(" · ")
  ).filter(Boolean).slice(0, 15);
  const education = unique([...educationObjects, ...asList(read(obj, ["education", "educations"]))], 15);
  const certifications = unique([...certificationObjects, ...asList(read(obj, ["certifications", "certificates", "licensesAndCertifications"]))], 15);
  const posts = (Array.isArray(postsData) ? postsData : []).map(record)
    .filter((item): item is Record<string, unknown> => item !== null)
    .map((item) => ({
      text: field(item, ["text", "content", "commentary", "postText", "description"]),
      publishedAt: field(item, ["publishedAt", "postedAt", "date", "createdAt"]),
      url: field(item, ["url", "postUrl", "link"]),
      reactions: numberField(item, ["reactions", "reactionCount", "numLikes", "likes"]),
      comments: numberField(item, ["comments", "commentCount", "numComments"]),
      reposts: numberField(item, ["reposts", "repostCount", "numShares", "shares"]),
    }))
    .filter((item) => item.text.length >= 10).slice(0, 8);
  return {
    name: field(obj, ["fullName", "name", "displayName"]) || field(obj, ["firstName"]),
    headline: field(obj, ["headline", "title", "occupation", "currentJobTitle"]),
    about: field(obj, ["about", "summary", "description", "bio"]),
    experiences,
    education,
    certifications,
    skills: asList(read(obj, ["skills", "topSkills"])),
    posts,
  };
}

export function hasProfileEvidence(profile: PublicProfile | null): boolean {
  return Boolean(profile && (profile.headline.length >= 8 || profile.about.length >= 30 || profile.experiences.length || profile.skills.length >= 2 || profile.posts.length));
}

function excerpt(value: string): string {
  return cleanText(value, limits.item);
}

function dimension(key: string, label: string, weight: number, score: number | null, rationale: string, evidence: string[], action: string): EvidenceDimension {
  return {
    key, label, weight,
    score: score === null ? null : Math.max(0, Math.min(100, Math.round(score))),
    status: score === null ? "not_evaluated" : "evaluated",
    rationale, evidence: unique(evidence.map(excerpt), 4), action,
  };
}


const transitionCompetencies: Array<{ label: string; pattern: RegExp }> = [
  { label: "Atendimento e escuta de clientes", pattern: /atend|client|escut|suporte|customer|paciente/i },
  { label: "Relacionamento e comunicação", pattern: /relacion|comunic|apresenta[cç]|negocia|palestr|instrut|doc[eê]nc|educa/i },
  { label: "Vivência comercial e organização", pattern: /venda|comercial|meta|crm|carteira|planejam|organiza|prospe[cç]/i },
  { label: "Repertório em saúde e ciências", pattern: /sa[uú]de|farm[aá]c|biolog|qu[ií]mic|medicin|pesquisa|ci[eê]nc|laborat[oó]r/i },
  { label: "Aprendizado e desenvolvimento contínuo", pattern: /capacita|curso|treinam|formac|forma[cç][aã]o|certific|aprend|estud/i },
];

function careerHeadlineReview(profile: PublicProfile | null): CareerTransitionReview {
  const headline = cleanText(profile?.headline, 240);
  const verifiedText = [
    ...(profile?.experiences || []).map(item => [item.role,item.description].join(" ")),
    ...(profile?.skills || []), ...(profile?.education || []), ...(profile?.certifications || []),
    profile?.about || "",
  ].join(" ");
  // These signals describe what is documented, not suitability or hiring potential.
  const transferableStrengths = transitionCompetencies
    .filter(item => item.pattern.test(verifiedText))
    .map(item => item.label);
  const roleIsMentioned = /propagandist|representante farmac[eê]utic|visita[cç][aã]o m[eé]dic/i.test(headline);
  const ambitionIsClear = /transi[cç][aã]o|interesse|em forma[cç][aã]o|busco|busca|objetivo|rumo a|aspirant|trainee/i.test(headline);
  const hasHeadline = headline.length >= 8;
  const headlineStatus: CareerTransitionReview["headlineStatus"] = !hasHeadline
    ? "not_evaluated"
    : roleIsMentioned && ambitionIsClear
      ? "aligned"
      : roleIsMentioned
        ? "partially_aligned"
        : "needs_repositioning";

  const headlineLabel = headlineStatus === "aligned" ? "Objetivo de transição explícito"
    : headlineStatus === "partially_aligned" ? "Área de destino mencionada; intenção pode ficar mais clara"
      : headlineStatus === "needs_repositioning" ? "O título ainda não comunica a transição"
        : "Título não recuperado — sem avaliação";

  const explanation = headlineStatus === "aligned"
    ? "O título já comunica a direção para Propagandista Trainee. Confirme que expressões como 'experiência em' descrevem somente funções realmente exercidas."
    : headlineStatus === "partially_aligned"
      ? "O título menciona a área farmacêutica, mas pode explicitar que se trata de uma transição ou objetivo de carreira, sem assumir que a função já é exercida."
      : headlineStatus === "needs_repositioning"
        ? "O título público existe, porém não mostra ao leitor que a pessoa pretende migrar para Propagandista Trainee. Isso é uma oportunidade de comunicação, não uma avaliação de aptidão."
        : "O Manus não recuperou um título público verificável; oferecemos exemplos de escrita, mas não concluímos que o perfil esteja inadequado.";

  const careerEvidence = (profile?.experiences || []).map(item => [item.role, item.description].join(" ")).join(" ");
  // Only describe prior work as "experiência" when the work section has that evidence;
  // mentioning a skill in About or a course is not a verified previous position.
  const verifiedAnchor = /atend|client|suporte|customer|paciente/i.test(careerEvidence)
    ? "Experiência em atendimento"
    : /venda|comercial|meta|crm|carteira|prospec/i.test(careerEvidence)
      ? "Experiência comercial"
      : /relacion|comunic|apresenta|negocia|instrut/i.test(careerEvidence)
        ? "Experiência em comunicação e relacionamento"
        : "";
  const headlineSuggestions = [
    "Em transição para Propagandista Trainee | Interesse em saúde, comunicação e relacionamento",
    "Objetivo profissional: Propagandista Trainee | Desenvolvimento na indústria farmacêutica",
    verifiedAnchor
      ? verifiedAnchor + " | Transição de carreira para Propagandista Trainee"
      : "Transição para Propagandista Trainee | Aprendizado contínuo e relacionamento profissional",
  ];
  return {
    targetRole: "Propagandista Trainee",
    headlineStatus, headlineLabel, currentHeadline: headline,
    explanation,
    transferableStrengths,
    developmentPriorities: [
      "Deixe explícita no título a direção profissional sem apresentar a função desejada como cargo já exercido.",
      "Conecte experiências reais de outras áreas às competências úteis à rotina de propagandista, com exemplos e resultados documentados.",
      "No Sobre, explique de onde vem, por que escolheu essa transição e qual repertório pretende construir em saúde e comunicação ética.",
    ],
    headlineSuggestions,
    aboutSuggestion: "Minha trajetória até aqui inclui [experiência real comprovável]. Nela, desenvolvi [competência com exemplo concreto]. Estou direcionando minha carreira para oportunidades como Propagandista Trainee, buscando aprofundar conhecimentos sobre saúde, relacionamento profissional e comunicação responsável. Meu próximo passo é [ação concreta de desenvolvimento].",
    disclaimer: "Análise do posicionamento escrito para transição de carreira, não classificação de candidatura. Sugestões de título não atestam experiência nem qualificações.",
  };
}

export function assessProfile(profile: PublicProfile | null, manualContext: string) {
  const sourced = hasProfileEvidence(profile);
  const p = sourced ? profile! : null;
  const experiences = p?.experiences ?? [];
  const skills = p?.skills ?? [];
  const careerText = [p?.headline, p?.about, ...experiences.map((item) => item.role + " " + item.description), ...skills].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
  const matched = unique(roleTerms.filter((term) => careerText.includes(term)));
  const measurable = experiences.filter((item) => outcomeTerms.test(item.description));
  const headline = p?.headline ?? "";
  const about = p?.about ?? "";
  const posts = p?.posts ?? [];
  const education = [...(p?.education ?? []), ...(p?.certifications ?? [])];
  const careerTransition = careerHeadlineReview(p);
  const dimensions = [
    dimension("positioning", "Posicionamento para a transição", 20,
      headline || about
        ? 30 + (headline.length >= 30 ? 12 : headline ? 6 : 0)
          + (about.length >= 100 ? 16 : about ? 7 : 0)
          + (careerTransition.headlineStatus === "aligned" ? 24
            : careerTransition.headlineStatus === "partially_aligned" ? 14 : 0)
        : null,
      headline || about
        ? "Avalia se os textos públicos comunicam uma mudança de carreira rumo a Propagandista Trainee, sem medir adequação para contratação."
        : "Título e Sobre não recuperados; posicionamento de transição não avaliado.",
      [headline, about],
      "Explique na headline a transição para Propagandista Trainee; no Sobre, conecte competências transferíveis com experiências comprováveis."),
    dimension("evidence", "Experiências e resultados", 20, experiences.length ? 42 + Math.min(27, experiences.length * 8) + (measurable.length ? 18 : 0) : null,
      experiences.length ? "Experiências identificadas; resultados mensuráveis contam somente quando documentados." : "Experiências públicas não recuperadas.",
      experiences.slice(0, 3).map((item) => [item.role, item.company, item.description].filter(Boolean).join(" · ")),
      "Descreva experiências reais usando contexto, ação e resultado, sem inventar números."),
    dimension("role_fit", "Competências transferíveis para Propagandista", 20, careerText.length >= 30 ? 36 + Math.min(48, matched.length * 8) : null,
      careerText.length >= 30 ? "Sinais textuais de comunicação, relacionamento, saúde, organização e resultados; não é uma decisão de contratação." : "Dados profissionais insuficientes para avaliar competências transferíveis.",
      matched.length ? ["Sinais identificados: " + matched.join(", ")] : [headline],
      "Relacione experiências verdadeiras de atendimento, comunicação, aprendizado técnico ou relacionamento à atuação de propagandista."),
    dimension("communication", "Comunicação para a nova carreira", 15, headline || about ? 40 + (headline.length >= 30 ? 20 : 0) + (about.length >= 100 ? 24 : about ? 8 : 0) : null,
      headline || about ? "Leitura da organização e clareza da narrativa escrita disponível." : "Texto público insuficiente para examinar a comunicação escrita.",
      [headline, about], "Revise a legibilidade, retire jargões e dê exemplos concretos de sua comunicação."),
    dimension("content", "Conteúdo profissional", 10, posts.length ? 45 + Math.min(25, posts.length * 5) + (posts.some((item) => item.text.length > 250) ? 12 : 0) : null,
      posts.length ? "Somente as publicações públicas efetivamente recuperadas foram analisadas." : "Publicações não recuperadas. Isso não significa que a pessoa não publique ou se comunique mal.",
      posts.slice(0, 3).map((item) => item.text + (item.url ? " · Fonte: " + item.url : "")), "Se fizer sentido para sua carreira, compartilhe aprendizados e experiências reais, sem obrigação de publicar diariamente."),
    dimension("development", "Formação para a transição", 15, education.length || skills.length ? 43 + Math.min(30, education.length * 10) + Math.min(15, skills.length * 3) : null,
      education.length || skills.length ? "Formações, certificações e competências declaradas foram consideradas; ausência de registro não prova falta de qualificação." : "Formação e competências não recuperadas.",
      [...education.slice(0, 3), ...skills.slice(0, 2)], "Destaque estudos, formações e habilidades relevantes que você consegue comprovar."),
  ] satisfies EvidenceDimension[];

  const totalWeight = dimensions.reduce((sum, item) => sum + item.weight, 0);
  const evaluated = dimensions.filter((item): item is EvidenceDimension & { score: number } => item.score !== null);
  const evaluatedWeight = evaluated.reduce((sum, item) => sum + item.weight, 0);
  const scoreCoverage = Math.round(100 * evaluatedWeight / totalWeight);
  // Uma URL válida, dados manuais ou uma única seção recuperada não bastam para certificar a nota do LinkedIn.
  const overallScore = sourced && evaluated.length >= 4 && scoreCoverage >= 70 && (experiences.length > 0 || education.length > 0 || skills.length >= 3)
    ? Math.round(evaluated.reduce((sum, item) => sum + item.score * item.weight, 0) / evaluatedWeight)
    : null;
  const weak = [...evaluated].sort((a, b) => a.score - b.score);
  const strong = [...evaluated].sort((a, b) => b.score - a.score);
  const recommendations = unique([
    ...(careerTransition.headlineStatus === "aligned" ? [] : ["Atualize o título do LinkedIn para comunicar claramente a transição para Propagandista Trainee, sem alegar experiência que ainda não tem."]),
    "No Sobre do LinkedIn, conecte sua trajetória anterior ao objetivo de Propagandista Trainee usando exemplos reais.",
    ...weak.slice(0, 3).map((item) => item.action),
    ...dimensions.filter((item) => item.status === "not_evaluated").slice(0, 2).map((item) => "Complete os dados de " + item.label.toLowerCase() + " para permitir avaliação."),
  ], 6);
  const manual = cleanText(manualContext);
  const summary = sourced
    ? overallScore === null
      ? "A coleta trouxe algumas evidências públicas, mas ainda não existe cobertura suficiente para uma pontuação geral confiável. Use os pontos avaliados como orientação."
      : "Diagnóstico de desenvolvimento com " + scoreCoverage + "% de cobertura de evidências disponíveis. A nota reflete apenas os critérios avaliáveis, não mede empregabilidade ou potencial pessoal."
    : "Não foi possível verificar dados públicos suficientes do LinkedIn. As informações complementares podem orientar uma conversa de desenvolvimento, mas não permitem atribuir nota ao perfil.";
  return {
    profileName: p?.name || "",
    headline,
    careerTransition,
    overallScore,
    scoreCoverage: sourced ? scoreCoverage : 0,
    classification: overallScore === null ? "Dados insuficientes para nota geral" : overallScore >= 75 ? "Posicionamento bem evidenciado" : overallScore >= 55 ? "Boa base para desenvolver" : "Posicionamento em construção",
    summary,
    dimensions,
    strengths: sourced ? strong.slice(0, 3).map((item) => item.label + ": " + item.rationale) : [],
    gaps: weak.slice(0, 3).map((item) => item.label + ": " + item.action),
    recommendations: sourced ? recommendations : [
      "Confirme se o perfil é público e se a URL está correta.",
      "Descreva manualmente experiências, competências e resultados reais para receber orientações qualitativas.",
      "Experimente novamente quando a coleta pública estiver disponível.",
    ],
    nextBestAction: {
      title: sourced ? (weak[0]?.label || "Revisar apresentação profissional") : "Reunir evidências profissionais",
      reason: sourced ? (weak[0]?.rationale || "Mais informações tornarão o diagnóstico preciso.") : "Sem dados verificáveis, não é adequado atribuir nota ao LinkedIn.",
      actions: sourced ? recommendations.slice(0, 3) : [
        "Revise sua headline, Sobre e experiências no LinkedIn.",
        "Separe três exemplos reais de competências e resultados.",
        "Refaça a coleta para avaliar sua evolução.",
      ],
    },
    limitations: [
      ...(sourced ? [] : ["Perfil do LinkedIn não confirmado; leitura limitada às informações fornecidas pela pessoa."]),
      ...(posts.length ? [] : ["Publicações e engajamento não avaliados por falta de dados públicos recuperados."]),
      ...(overallScore === null ? ["Pontuação geral não atribuída por cobertura insuficiente ou origem somente manual."] : []),
      ...(manual && sourced ? ["Informações adicionais fornecidas manualmente não foram usadas para aumentar a pontuação."] : []),
    ],
    developmentPlan: buildDevelopmentPlan(recommendations, sourced),
  };
}

function buildDevelopmentPlan(recommendations: string[], hasData: boolean): DevelopmentWeek[] {
  const first = recommendations[0] || "Revise sua headline e o texto Sobre com exemplos reais.";
  return [
    { week: 1, title: "Diagnóstico e identidade", focus: "Entender a trajetória", actions: [hasData ? first : "Reúna dados verificáveis sobre sua trajetória.", "Liste três competências sustentadas por experiências reais.", "Defina um objetivo profissional em uma frase."] },
    { week: 2, title: "Perfil profissional", focus: "Dar clareza ao LinkedIn", actions: ["Reescreva headline e Sobre sem exageros.", "Descreva duas experiências usando contexto, ação e resultado.", "Revise competências e formações efetivamente comprovadas."] },
    { week: 3, title: "Relacionamento e repertório", focus: "Ampliar referências", actions: ["Conheça a rotina ética e técnica da carreira de propagandista.", "Acompanhe fontes confiáveis de saúde, comunicação e indústria farmacêutica.", "Amplie sua rede profissional com conexões relevantes e respeitosas."] },
    { week: 4, title: "Revisão e evolução", focus: "Consolidar aprendizados", actions: ["Revise as mudanças e peça feedback a alguém de confiança.", "Compare a clareza dos textos e a qualidade das evidências.", "Refaça o diagnóstico quando houver dados suficientes."] },
  ];
}
