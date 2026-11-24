import { assertPublicHttpUrl, assertResolvesPublic, normalizeWebsiteUrl } from "@/lib/security/ssrf";
import type { WebsiteStatus } from "@/types";

export type InspectionResult = {
  url: string | null;
  finalUrl: string | null;
  verificationStatus: WebsiteStatus;
  httpStatus: number | null;
  isReachable: boolean;
  redirectUrl: string | null;
  mobileScore: number | null;
  performanceScore: number | null;
  seoScore: number | null;
  confidence: number;
  evidenceSource: string;
  evidence: Record<string, unknown>;
};

const FETCH_TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 5;
const USER_AGENT = "ProspectAI-WebsiteInspector/1.0 (+https://prospectai.com)";

function nameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !["the", "and", "ltd", "limited", "company"].includes(token));
}

function scoreNameMatch(businessName: string, haystack: string): number {
  const tokens = nameTokens(businessName);
  if (!tokens.length) return 0;
  const text = haystack.toLowerCase();
  const hits = tokens.filter((token) => text.includes(token));
  return hits.length / tokens.length;
}

async function safeGet(start: string): Promise<{
  response: Response;
  finalUrl: URL;
  redirects: string[];
  elapsedMs: number;
  body: string;
}> {
  let current = assertPublicHttpUrl(start);
  await assertResolvesPublic(current);
  const redirects: string[] = [];
  const started = Date.now();

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(current, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
        },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) {
          return { response, finalUrl: current, redirects, elapsedMs: Date.now() - started, body: "" };
        }
        const next = assertPublicHttpUrl(new URL(location, current).toString());
        await assertResolvesPublic(next);
        redirects.push(next.toString());
        current = next;
        continue;
      }

      const contentType = response.headers.get("content-type") ?? "";
      const body = contentType.includes("text") || contentType.includes("html") || !contentType
        ? (await response.text()).slice(0, 80_000)
        : "";
      return { response, finalUrl: current, redirects, elapsedMs: Date.now() - started, body };
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("Too many redirects.");
}

export async function inspectWebsite(input: {
  businessName: string;
  sourceUrl: string | null;
  isSample?: boolean;
}): Promise<InspectionResult> {
  const normalized = normalizeWebsiteUrl(input.sourceUrl);

  if (!normalized) {
    return {
      url: null,
      finalUrl: null,
      verificationStatus: input.isSample ? "no_website" : "unverified",
      httpStatus: null,
      isReachable: false,
      redirectUrl: null,
      mobileScore: null,
      performanceScore: null,
      seoScore: null,
      confidence: input.isSample ? 0.35 : 0.2,
      evidenceSource: input.isSample ? "sample_fixture" : "authorized_source_without_url",
      evidence: {
        note: input.isSample
          ? "Sample fixture has no website URL. This is not a verified absence of a real-world website."
          : "No website URL was supplied by an authorized data source. Missing from a directory is not proof that the business has no website.",
      },
    };
  }

  try {
    const fetched = await safeGet(normalized);
    const html = fetched.body;
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch?.[1]?.trim() ?? "";
    const hasViewport = /name=["']viewport["']/i.test(html);
    const textLength = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
    const parked = /domain is for sale|buy this domain|parked free|coming soon/i.test(html);
    const nameMatch = Math.max(scoreNameMatch(input.businessName, title), scoreNameMatch(input.businessName, html.slice(0, 4000)));
    const reachable = fetched.response.ok;
    const mobileScore = hasViewport ? 80 : 30;
    const performanceScore = fetched.elapsedMs < 1200 ? 80 : fetched.elapsedMs < 3000 ? 55 : 30;
    const seoScore = title ? 70 : 25;

    let status: WebsiteStatus = "unverified";
    let confidence = 0.45;
    if (!reachable) {
      status = "unverified";
      confidence = 0.4;
    } else if (parked || textLength < 400) {
      status = "poor_website";
      confidence = 0.7;
    } else if (!hasViewport || !title) {
      status = "poor_website";
      confidence = 0.65;
    } else if (nameMatch >= 0.34) {
      status = "good_website";
      confidence = 0.82;
    } else {
      status = "unverified";
      confidence = 0.5;
    }

    return {
      url: normalized,
      finalUrl: fetched.finalUrl.toString(),
      verificationStatus: status,
      httpStatus: fetched.response.status,
      isReachable: reachable,
      redirectUrl: fetched.redirects.at(-1) ?? null,
      mobileScore,
      performanceScore,
      seoScore,
      confidence,
      evidenceSource: input.isSample ? "sample_fixture_http" : "http_inspection",
      evidence: {
        title: title || null,
        hasViewport,
        textLength,
        parked,
        nameMatch,
        elapsedMs: fetched.elapsedMs,
        redirects: fetched.redirects,
        sample: Boolean(input.isSample),
      },
    };
  } catch (error) {
    return {
      url: normalized,
      finalUrl: null,
      verificationStatus: "unverified",
      httpStatus: null,
      isReachable: false,
      redirectUrl: null,
      mobileScore: null,
      performanceScore: null,
      seoScore: null,
      confidence: 0.3,
      evidenceSource: "http_inspection_failed",
      evidence: {
        error: error instanceof Error ? error.message : "Inspection failed",
        note: "A failed fetch is not evidence that the business has no website.",
      },
    };
  }
}
