import { env } from "@/lib/env";
import type { PlaceHit } from "@/services/workspace/types";
import { searchSampleDirectory, SAMPLE_DIRECTORY_CAP } from "@/services/discovery/sample-directory";
import { buildSearchQuery } from "@/services/discovery/normalize";

export type DiscoverySourceResult = {
  mode: "places" | "sample";
  query: string;
  hits: PlaceHit[];
};

type HunterInput = {
  country: string;
  region?: string | null;
  city: string;
  industry: string;
  customCategory?: string | null;
  discoveryLimit: number;
};

export async function huntBusinesses(input: HunterInput): Promise<DiscoverySourceResult> {
  const query = buildSearchQuery(input);
  const limit = Math.min(Math.max(input.discoveryLimit, 1), 200);

  if (!env.googlePlacesKey) {
    return {
      mode: "sample",
      query,
      hits: searchSampleDirectory({
        city: input.city,
        region: input.region,
        country: input.country,
        industry: input.customCategory?.trim() || input.industry,
        limit: Math.min(limit, SAMPLE_DIRECTORY_CAP),
      }),
    };
  }

  const hits = await searchPlacesNew(env.googlePlacesKey, query, limit);
  return { mode: "places", query, hits };
}

async function searchPlacesNew(key: string, query: string, limit: number): Promise<PlaceHit[]> {
  const hits: PlaceHit[] = [];
  let pageToken: string | undefined;

  while (hits.length < limit) {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.location,places.types,nextPageToken",
      },
      body: JSON.stringify({
        textQuery: query,
        pageSize: Math.min(20, limit - hits.length),
        pageToken,
      }),
    });

    if (!response.ok) {
      throw placesNewError(response.status, await response.text());
    }

    const json = (await response.json()) as {
      places?: Array<{
        id?: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        nationalPhoneNumber?: string;
        internationalPhoneNumber?: string;
        websiteUri?: string;
        location?: { latitude?: number; longitude?: number };
        types?: string[];
      }>;
      nextPageToken?: string;
    };

    for (const place of json.places ?? []) {
      if (!place.displayName?.text) continue;
      hits.push({
        name: place.displayName.text,
        address: place.formattedAddress ?? null,
        city: null,
        region: null,
        country: null,
        phone: place.nationalPhoneNumber ?? place.internationalPhoneNumber ?? null,
        websiteUri: place.websiteUri ?? null,
        latitude: place.location?.latitude ?? null,
        longitude: place.location?.longitude ?? null,
        placeId: place.id ?? null,
        types: place.types ?? [],
        source: "google_places",
      });
      if (hits.length >= limit) break;
    }

    if (!json.nextPageToken || hits.length >= limit) break;
    pageToken = json.nextPageToken;
  }

  return hits;
}

function placesNewError(status: number, body: string) {
  let detail = body.slice(0, 280);
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string; status?: string } };
    detail = parsed.error?.message ?? parsed.error?.status ?? detail;
  } catch {
    // Keep the raw body when Google does not return JSON.
  }
  return new Error(
    `Google Places (New) error ${status}: ${detail}. Enable "Places API (New)" for this Google Cloud project, turn on billing, and allow Places API (New) on the key. Do not restrict the key to HTTP referrers — ProspectAI calls Google from the server.`,
  );
}
