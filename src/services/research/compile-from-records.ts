import type { ResearchReport } from "@/lib/ai/schemas";
import type { BusinessRecord, InspectionRecord } from "@/services/workspace/types";

export type ResearchFacts = {
  business: BusinessRecord;
  inspection: InspectionRecord | null;
  userNotes: string | null;
};

function locationOf(business: BusinessRecord): string | null {
  const parts = [business.address, business.city, business.region, business.country].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

export function compileResearchFromRecords(facts: ResearchFacts): ResearchReport {
  const { business, inspection, userNotes } = facts;
  const unknowns: string[] = [];
  if (!business.industry) unknowns.push("industry");
  if (!userNotes) unknowns.push("business description");
  unknowns.push("services");
  unknowns.push("products");
  unknowns.push("social media profiles");
  if (!business.email) unknowns.push("email");
  if (!business.phone) unknowns.push("phone");
  if (!business.address) unknowns.push("street address");
  if (!inspection?.url && !business.website_url) unknowns.push("official website URL");

  const caveats = [
    "This report restates discovered records only. Missing fields are unknown, not negative proof.",
    "Services, products, testimonials, certifications and achievements were not invented.",
  ];
  if (business.is_sample) {
    caveats.push("The underlying business record is labelled sample data, not a verified real-world business.");
  }
  if (userNotes?.trim()) {
    caveats.push("Additional notes were supplied by the workspace user and are labelled as user-supplied.");
  }

  const websiteNeed =
    business.website_status === "good_website"
      ? "A reachable website is already on file. A demo would need a clear reason beyond “no site found”."
      : business.website_status === "poor_website"
        ? "A website is on file but inspection flagged quality issues. A replacement demo may be useful."
        : business.website_status === "no_website"
          ? "The current classification is no website. Confirm before outreach; directory gaps are not proof."
          : "Website presence is unverified. Do not claim the business has no website.";

  return {
    businessName: business.name,
    industry: business.industry,
    location: locationOf(business),
    description: userNotes?.trim() || null,
    services: [],
    products: [],
    publicContacts: {
      phone: business.phone,
      email: business.email,
      website: business.website_url,
      address: business.address,
    },
    socialMedia: {},
    onlinePresenceNotes: inspection
      ? `Inspection ${inspection.verification_status} via ${inspection.evidence_source ?? "unknown source"} (confidence ${inspection.confidence ?? "n/a"}).`
      : "No inspection record is stored.",
    websiteNeed,
    unknowns,
    caveats,
  };
}
