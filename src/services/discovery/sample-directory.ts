import type { PlaceHit } from "@/services/workspace/types";

/**
 * Labelled development directory. These are fixtures, not verified businesses.
 * Used only when GOOGLE_PLACES_API_KEY is missing.
 */
const FIXTURES: Omit<PlaceHit, "city" | "region" | "country" | "source">[] = [
  { name: "Harbour Sample Studio", address: "12 Sample Street", phone: null, websiteUri: null, latitude: null, longitude: null, placeId: "sample-harbour", types: [] },
  { name: "Oak Demo Kitchen", address: "4 Fixture Avenue", phone: "+233000000001", websiteUri: "https://example.com", latitude: null, longitude: null, placeId: "sample-oak", types: [] },
  { name: "Cedar Test Pharmacy", address: "88 Directory Lane", phone: null, websiteUri: null, latitude: null, longitude: null, placeId: "sample-cedar", types: [] },
  { name: "North Ridge Sample Salon", address: "3 Preview Close", phone: "+233000000002", websiteUri: null, latitude: null, longitude: null, placeId: "sample-ridge", types: [] },
  { name: "Orbit Demo Logistics", address: "17 Sample Industrial Area", phone: null, websiteUri: "https://example.org", latitude: null, longitude: null, placeId: "sample-orbit", types: [] },
  { name: "Lantern Sample Suites", address: "9 Fixture Road", phone: null, websiteUri: null, latitude: null, longitude: null, placeId: "sample-lantern", types: [] },
  { name: "Willow Demo Clinic", address: "21 Sample Medical Plaza", phone: "+233000000003", websiteUri: null, latitude: null, longitude: null, placeId: "sample-willow", types: [] },
  { name: "Canvas Test Fashion House", address: "5 Directory Mall", phone: null, websiteUri: "https://example.net", latitude: null, longitude: null, placeId: "sample-canvas", types: [] },
  { name: "Quarry Sample Construction", address: "44 Fixture Yard", phone: null, websiteUri: null, latitude: null, longitude: null, placeId: "sample-quarry", types: [] },
  { name: "Compass Demo Travel", address: "2 Sample Arcade", phone: null, websiteUri: null, latitude: null, longitude: null, placeId: "sample-compass", types: [] },
  { name: "Anvil Sample Auto Works", address: "18 Directory Mechanic Line", phone: "+233000000004", websiteUri: null, latitude: null, longitude: null, placeId: "sample-anvil", types: [] },
  { name: "Ledger Demo Advisors", address: "6 Fixture Chambers", phone: null, websiteUri: "https://www.iana.org", latitude: null, longitude: null, placeId: "sample-ledger", types: [] },
  { name: "Pebble Sample School", address: "30 Sample Campus", phone: null, websiteUri: null, latitude: null, longitude: null, placeId: "sample-pebble", types: [] },
  { name: "Mariner Demo Hotel", address: "1 Fixture Waterfront", phone: null, websiteUri: null, latitude: null, longitude: null, placeId: "sample-mariner", types: [] },
  { name: "Silo Sample Supplies", address: "55 Directory Warehouse", phone: null, websiteUri: null, latitude: null, longitude: null, placeId: "sample-silo", types: [] },
  { name: "Atlas Demo Realty", address: "8 Sample Estates", phone: "+233000000005", websiteUri: null, latitude: null, longitude: null, placeId: "sample-atlas", types: [] },
  { name: "Kindling Sample Bakery", address: "14 Fixture Market", phone: null, websiteUri: null, latitude: null, longitude: null, placeId: "sample-kindling", types: [] },
  { name: "Nimbus Demo Logistics Hub", address: "71 Sample Ring Road", phone: null, websiteUri: null, latitude: null, longitude: null, placeId: "sample-nimbus", types: [] },
  { name: "Harborline Test Clinic", address: "19 Directory Health Park", phone: null, websiteUri: "https://example.edu", latitude: null, longitude: null, placeId: "sample-harborline", types: [] },
  { name: "Fieldstone Sample Motors", address: "27 Fixture Motorway", phone: null, websiteUri: null, latitude: null, longitude: null, placeId: "sample-fieldstone", types: [] },
];

export const SAMPLE_DIRECTORY_CAP = 20;

export function searchSampleDirectory(input: {
  city: string;
  region?: string | null;
  country: string;
  industry: string;
  limit: number;
}): PlaceHit[] {
  const take = Math.min(Math.max(input.limit, 1), SAMPLE_DIRECTORY_CAP);
  return FIXTURES.slice(0, take).map((fixture, index) => ({
    ...fixture,
    name: `${fixture.name} (${input.industry})`,
    city: input.city,
    region: input.region ?? null,
    country: input.country,
    source: "sample_directory" as const,
    placeId: `${fixture.placeId}-${input.city.toLowerCase().replace(/\s+/g, "-")}-${index}`,
    types: [input.industry.toLowerCase()],
  }));
}
