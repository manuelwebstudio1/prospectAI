import type { BusinessRecord, InspectionRecord, ResearchRecord } from "@/services/workspace/types";

export function scoreOpportunity(input: {
  business: BusinessRecord;
  inspection: InspectionRecord | null;
  research: ResearchRecord | null;
}): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 20;

  const status = input.business.website_status;
  if (status === "no_website") {
    score += 35;
    reasons.push("No website was verified from an authorized source plus HTTP inspection. A new site could be high value.");
  } else if (status === "poor_website") {
    score += 28;
    reasons.push("An existing site was reached but looks thin, parked, or not mobile-ready.");
  } else if (status === "unverified") {
    score += 12;
    reasons.push("Website status could not be verified. Missing directory URLs are not treated as proof of no website.");
  } else {
    score += 4;
    reasons.push("A functioning website was found, so the opportunity is lower unless the business wants a rebuild.");
  }

  const contacts = [input.business.phone, input.business.email, input.business.address].filter(Boolean).length;
  if (contacts >= 2) {
    score += 12;
    reasons.push("Enough public contact details exist to support outreach after approval.");
  } else if (contacts === 1) {
    score += 6;
    reasons.push("Some public contact details exist; others still need confirmation.");
  } else {
    reasons.push("Public contact details are incomplete, which lowers near-term conversion potential.");
  }

  if (input.inspection?.is_reachable) {
    score += 6;
    reasons.push("HTTP inspection produced evidence rather than a guess.");
  } else if (!input.business.website_url) {
    reasons.push("No URL was supplied by the discovery provider; inspection did not invent one.");
  }

  const report = input.research?.report;
  if (report?.services?.length) {
    score += 10;
    reasons.push("Research identified public services that a demo can reflect without inventing claims.");
  }
  if (report?.unknowns?.length) {
    score -= 4;
    reasons.push("Research recorded unknowns instead of fabricating facts.");
  } else if (input.research) {
    score += 4;
    reasons.push("A research report is on file.");
  }

  if (input.business.is_sample) {
    score = Math.min(score, 40);
    reasons.push("This is a labelled sample record, not a verified live business.");
  }

  const bounded = Math.max(0, Math.min(100, score));
  reasons.push("The score is an internal opportunity ranking, not a predicted chance of winning the client.");
  return { score: bounded, reasons };
}
