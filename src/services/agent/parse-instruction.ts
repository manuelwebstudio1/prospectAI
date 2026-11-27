import { BUSINESS_CATEGORIES, SUPPORTED_COUNTRIES } from "@/constants";
import { emptyEstimate, type AgentMode, type AgentPlan } from "@/services/agent/types";

const CITY_MAP: Array<{ match: RegExp; city: string; region: string | null; countryCode: string }> = [
  { match: /\baccra\b/i, city: "Accra", region: "Greater Accra", countryCode: "GH" },
  { match: /\bkumasi\b/i, city: "Kumasi", region: "Ashanti", countryCode: "GH" },
  { match: /\btema\b/i, city: "Tema", region: "Greater Accra", countryCode: "GH" },
  { match: /\btakoradi\b|\bsekondi\b/i, city: "Takoradi", region: "Western", countryCode: "GH" },
  { match: /\btamale\b/i, city: "Tamale", region: "Northern", countryCode: "GH" },
  { match: /\bcape coast\b/i, city: "Cape Coast", region: "Central", countryCode: "GH" },
  { match: /\bkoforidua\b/i, city: "Koforidua", region: "Eastern", countryCode: "GH" },
  { match: /\bsunyani\b/i, city: "Sunyani", region: "Bono", countryCode: "GH" },
  { match: /\bbolgatanga\b/i, city: "Bolgatanga", region: "Upper East", countryCode: "GH" },
  { match: /\bkasoa\b/i, city: "Kasoa", region: "Central", countryCode: "GH" },
  { match: /\blagos\b/i, city: "Lagos", region: null, countryCode: "NG" },
  { match: /\bnairobi\b/i, city: "Nairobi", region: null, countryCode: "KE" },
];

const INDUSTRY_ALIASES: Array<{ match: RegExp; industry: (typeof BUSINESS_CATEGORIES)[number] }> = [
  { match: /real estate|realtor|property|estate agenc/i, industry: "Real estate" },
  { match: /construction|contractor|builder|building firm/i, industry: "Construction companies" },
  { match: /building material/i, industry: "Building materials suppliers" },
  { match: /restaurant|eatery|food|dining|cafe/i, industry: "Restaurants" },
  { match: /hotel|hospitality|guest house|lodge/i, industry: "Hotels" },
  { match: /school|education|academy|university/i, industry: "Schools" },
  { match: /hospital|clinic|medical|health/i, industry: "Hospitals and clinics" },
  { match: /fashion|boutique|clothing/i, industry: "Fashion stores" },
  { match: /retail|shop|store|supermarket/i, industry: "Retail businesses" },
  { match: /logistics|freight|transport/i, industry: "Logistics companies" },
  { match: /auto|mechanic|car dealer|garage/i, industry: "Automotive businesses" },
  { match: /beauty|salon|cosmetic/i, industry: "Beauty and cosmetics" },
  { match: /travel|tour operat/i, industry: "Travel agencies" },
  { match: /lawyer|accountant|consultant|professional service/i, industry: "Professional services" },
];

function countryFromText(text: string, fallbackCode: string) {
  const lower = text.toLowerCase();
  const hit = SUPPORTED_COUNTRIES.find((item) => lower.includes(item.name.toLowerCase()));
  if (hit) return hit;
  return SUPPORTED_COUNTRIES.find((item) => item.code === fallbackCode) ?? SUPPORTED_COUNTRIES[0];
}

function extractLimit(text: string, fallback: number): number {
  const labelled = text.match(
    /\b(\d{1,4})\s*(?:real estate|businesses|companies|leads|restaurants|hotels|schools|clinics|shops|stores)?/i,
  );
  if (labelled) {
    const value = Number(labelled[1]);
    if (Number.isFinite(value) && value > 0) return Math.min(500, Math.max(10, value));
  }
  return fallback;
}

function websiteFilter(text: string): AgentPlan["websiteFilter"] {
  if (/without (a |professional )?website|no website|don't have .*website|do not have .*website/i.test(text)) {
    return "no_website";
  }
  if (/needs improvement|outdated|poor website|unprofessional/i.test(text)) {
    return "poor_website";
  }
  return "any";
}

function classifyMode(text: string): { mode: AgentMode; queryKind: AgentPlan["queryKind"] } {
  if (/why .*score|explain .*score|opportunity score/i.test(text) && !/\bfind\b|\bdiscover\b|\bgenerate\b/i.test(text)) {
    return { mode: "query", queryKind: "score" };
  }
  if (/whose demos have been deployed|deployed (demos|websites)|show me .*deployed/i.test(text)) {
    return { mode: "query", queryKind: "deployed" };
  }
  if (
    /^(show|list|what is|status of)\b/i.test(text.trim()) &&
    !/\bfind\b|\bdiscover\b|\bgenerate\b|\bresearch\b/i.test(text)
  ) {
    return { mode: "query", queryKind: "status" };
  }
  if (
    /prepare outreach|draft (outreach|messages|emails)|outreach messages/i.test(text) &&
    !/\bfind\b|\bdiscover\b/i.test(text)
  ) {
    return { mode: "outreach_existing", queryKind: "none" };
  }
  if (/generate demos|generate websites|build demos/i.test(text) && !/\bfind\b|\bdiscover\b/i.test(text)) {
    return { mode: "generate_existing", queryKind: "none" };
  }
  if (/research (my |the )?(latest )?leads/i.test(text) && !/\bfind\b|\bdiscover\b/i.test(text)) {
    return { mode: "research_existing", queryKind: "none" };
  }
  return { mode: "campaign", queryKind: "none" };
}

export function parseInstruction(instruction: string): AgentPlan {
  const text = instruction.trim();
  const cityHit = CITY_MAP.find((item) => item.match.test(text));
  const country = countryFromText(text, cityHit?.countryCode ?? "GH");
  const industryHit = INDUSTRY_ALIASES.find((item) => item.match.test(text));
  const { mode, queryKind } = classifyMode(text);
  const wantsGenerate = /generate|demo website|website demo|demos for them|personalized website/i.test(text);
  const wantsOutreach = /outreach|prepare (personalized )?(messages|emails)|whatsapp-ready/i.test(text);
  const wantsResearch = /research/i.test(text) || wantsGenerate || wantsOutreach;
  const limit = extractLimit(text, mode === "campaign" ? 30 : 20);
  const filter = websiteFilter(text);

  const includeResearch = mode === "research_existing" || (mode === "campaign" && wantsResearch);
  const includeGenerate = mode === "generate_existing" || (mode === "campaign" && wantsGenerate);
  const includeOutreach = mode === "outreach_existing" || (mode === "campaign" && wantsOutreach);

  const missing: string[] = [];
  if (mode === "campaign") {
    if (!cityHit?.city) missing.push("city");
    if (!industryHit?.industry) missing.push("industry");
  }

  const estimatedCredits =
    mode === "query"
      ? emptyEstimate()
      : {
          discovery: mode === "campaign" ? limit : 0,
          research: includeResearch ? limit : 0,
          website_generation: includeGenerate ? limit : 0,
          outreach: includeOutreach ? limit : 0,
          total: 0,
        };
  estimatedCredits.total =
    estimatedCredits.discovery +
    estimatedCredits.research +
    estimatedCredits.website_generation +
    estimatedCredits.outreach;

  const subjectMatch = text.match(/why (?:did |does )?(.+?) (?:receive|get|score)/i);

  return {
    mode,
    objective: text.slice(0, 280) || "Run the client-acquisition workflow.",
    city: cityHit?.city ?? null,
    region: cityHit?.region ?? null,
    country: country.name,
    countryCode: country.code,
    industry: industryHit?.industry ?? null,
    limit,
    websiteFilter: filter,
    includeResearch,
    includeGenerate,
    includeOutreach,
    missing,
    estimatedCredits,
    queryKind,
    querySubject: subjectMatch?.[1]?.trim() ?? null,
  };
}

export const CONFIRMATION_CREDIT_THRESHOLD = 40;
