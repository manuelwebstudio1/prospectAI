import { describe, expect, it } from "vitest";
import { parseInstruction, CONFIRMATION_CREDIT_THRESHOLD } from "@/services/agent/parse-instruction";
import { scoreOpportunity } from "@/services/agent/score";
import { buildTaskList } from "@/services/agent/create-job";
import type { BusinessRecord, InspectionRecord, ResearchRecord } from "@/services/workspace/types";

function business(overrides: Partial<BusinessRecord> = {}): BusinessRecord {
  return {
    id: "biz-1",
    organization_id: "org-1",
    campaign_id: "camp-1",
    name: "Golden Homes Limited",
    normalized_name: "golden homes limited",
    industry: "Real estate",
    category: "Real estate",
    country: "GH",
    region: "Greater Accra",
    city: "Accra",
    address: "Osu",
    latitude: null,
    longitude: null,
    phone: "0240000000",
    email: null,
    website_url: null,
    website_status: "unverified",
    source: "google_places",
    external_place_id: "abc",
    is_sample: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("parseInstruction", () => {
  it("extracts a Kumasi construction campaign with demos", () => {
    const plan = parseInstruction(
      "Find 30 construction companies in Kumasi without professional websites and generate demos for them.",
    );
    expect(plan.mode).toBe("campaign");
    expect(plan.city).toBe("Kumasi");
    expect(plan.region).toBe("Ashanti");
    expect(plan.countryCode).toBe("GH");
    expect(plan.industry).toBe("Construction companies");
    expect(plan.limit).toBe(30);
    expect(plan.websiteFilter).toBe("no_website");
    expect(plan.includeGenerate).toBe(true);
    expect(plan.includeResearch).toBe(true);
    expect(plan.missing).toEqual([]);
  });

  it("asks for missing industry instead of inventing one", () => {
    const plan = parseInstruction("Find businesses without websites in Accra.");
    expect(plan.city).toBe("Accra");
    expect(plan.missing).toContain("industry");
  });

  it("classifies outreach on existing leads without auto-send intent", () => {
    const plan = parseInstruction("Prepare outreach messages for my latest prospects.");
    expect(plan.mode).toBe("outreach_existing");
    expect(plan.includeOutreach).toBe(true);
    expect(plan.includeGenerate).toBe(false);
  });

  it("treats deployed-demo questions as conversation, not a job", () => {
    const plan = parseInstruction("Show me businesses whose demos have been deployed.");
    expect(plan.mode).toBe("query");
    expect(plan.queryKind).toBe("deployed");
    expect(plan.estimatedCredits.total).toBe(0);
  });

  it("flags large campaigns for confirmation", () => {
    const plan = parseInstruction(
      "Find 50 real estate businesses in Accra, Ghana, that do not have professional websites. Research each business, generate personalized website demos and prepare outreach messages.",
    );
    expect(plan.estimatedCredits.total).toBeGreaterThanOrEqual(CONFIRMATION_CREDIT_THRESHOLD);
  });
});

describe("buildTaskList", () => {
  it("orders specialized agents for a full campaign", () => {
    const plan = parseInstruction(
      "Find 20 construction companies in Kumasi without professional websites and generate demos for them.",
    );
    const tasks = buildTaskList("job-1", "org-1", plan);
    expect(tasks.map((item) => item.agent)).toEqual([
      "discovery",
      "inspection",
      "research",
      "score",
      "generate",
      "deploy",
      "report",
    ]);
  });
});

describe("scoreOpportunity", () => {
  it("does not treat an unverified missing URL as a guaranteed no-website win", () => {
    const unverified = scoreOpportunity({
      business: business({ website_status: "unverified", website_url: null }),
      inspection: {
        id: "ins-1",
        business_id: "biz-1",
        organization_id: "org-1",
        url: null,
        verification_status: "unverified",
        http_status: null,
        is_reachable: false,
        redirect_url: null,
        mobile_score: null,
        performance_score: null,
        seo_score: null,
        evidence: { note: "Missing from a directory is not proof that the business has no website." },
        evidence_source: "authorized_source_without_url",
        confidence: 0.2,
        inspected_at: new Date().toISOString(),
      } satisfies InspectionRecord,
      research: null,
    });
    const none = scoreOpportunity({
      business: business({ website_status: "no_website" }),
      inspection: null,
      research: null,
    });
    expect(unverified.score).toBeLessThan(none.score);
    expect(unverified.reasons.join(" ")).toMatch(/not treated as proof/i);
    expect(none.reasons.join(" ")).toMatch(/not a predicted chance/i);
  });

  it("caps labelled sample businesses", () => {
    const scored = scoreOpportunity({
      business: business({ is_sample: true, website_status: "no_website" }),
      inspection: null,
      research: {
        id: "r1",
        business_id: "biz-1",
        organization_id: "org-1",
        report: {
          businessName: "Golden Homes Limited",
          industry: "Real estate",
          location: "Accra",
          description: null,
          services: ["Sales"],
          products: [],
          publicContacts: { phone: "0240000000", email: null, website: null, address: "Osu" },
          socialMedia: {},
          onlinePresenceNotes: null,
          websiteNeed: null,
          unknowns: ["Owner confirmed hours"],
          caveats: [],
        },
        architecture: {
          websiteType: "brochure",
          rationale: "Public facts only",
          pages: [{ slug: "home", title: "Home", purpose: "Overview" }],
          colourPalette: {
            primary: "#e85a2a",
            secondary: "#1c1917",
            accent: "#e85a2a",
            background: "#f6f1eb",
            text: "#1c1917",
          },
          designDirection: "clean",
          requiredFunctionality: ["contact"],
          contentStructure: ["hero"],
          basedOnIndustry: "Real estate",
          basedOnVerifiedFactsOnly: true,
        },
        research_mode: "records_only",
        architect_mode: "blueprint",
        model: null,
        created_at: new Date().toISOString(),
      } satisfies ResearchRecord,
    });
    expect(scored.score).toBeLessThanOrEqual(40);
  });
});
