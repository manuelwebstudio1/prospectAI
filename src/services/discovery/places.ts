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

  try {
    const hits = await searchPlacesNew(env.googlePlacesKey, query, limit);
    return { mode: "places", query, hits };
  } catch (newError) {
    const hits = await searchPlacesLegacy(env.googlePlacesKey, query, limit);
    if (!hits.length) {
      const message = newError instanceof Error ? newError.message : "Places API request failed.";
      throw new Error(message);
    }
    return { mode: "places", query, hits };
  }
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
      const body = await response.text();
      throw new Error(`Google Places (New) error ${response.status}: ${body.slice(0, 240)}`);
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

async function searchPlacesLegacy(key: string, query: string, limit: number): Promise<PlaceHit[]> {
  const hits: PlaceHit[] = [];
  let pageToken: string | undefined;

  while (hits.length < limit) {
    const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    url.searchParams.set("query", query);
    url.searchParams.set("key", key);
    if (pageToken) url.searchParams.set("pagetoken", pageToken);

    const response = await fetch(url);
    const json = (await response.json()) as {
      status: string;
      error_message?: string;
      results?: Array<{
        place_id?: string;
        name?: string;
        formatted_address?: string;
        geometry?: { location?: { lat?: number; lng?: number } };
        types?: string[];
      }>;
      next_page_token?: string;
    };

    if (json.status !== "OK" && json.status !== "ZERO_RESULTS") {
      throw new Error(`Google Places error ${json.status}: ${json.error_message ?? "request failed"}`);
    }

    for (const place of json.results ?? []) {
      if (!place.name) continue;
      const details = place.place_id ? await fetchPlaceDetailsLegacy(key, place.place_id) : null;
      hits.push({
        name: place.name,
        address: place.formatted_address ?? null,
        city: null,
        region: null,
        country: null,
        phone: details?.phone ?? null,
        websiteUri: details?.website ?? null,
        latitude: place.geometry?.location?.lat ?? null,
        longitude: place.geometry?.location?.lng ?? null,
        placeId: place.place_id ?? null,
        types: place.types ?? [],
        source: "google_places",
      });
      if (hits.length >= limit) break;
    }

    if (!json.next_page_token || hits.length >= limit) break;
    pageToken = json.next_page_token;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return hits;
}

async function fetchPlaceDetailsLegacy(
  key: string,
  placeId: string,
): Promise<{ website: string | null; phone: string | null } | null> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "website,formatted_phone_number,international_phone_number");
  url.searchParams.set("key", key);
  const response = await fetch(url);
  if (!response.ok) return null;
  const json = (await response.json()) as {
    result?: { website?: string; formatted_phone_number?: string; international_phone_number?: string };
  };
  return {
    website: json.result?.website ?? null,
    phone: json.result?.formatted_phone_number ?? json.result?.international_phone_number ?? null,
  };
}
