export function normalizeBusinessName(name: string): string {
  return name.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 ? digits : phone.trim();
}

export function countryName(code: string): string {
  const map: Record<string, string> = {
    GH: "Ghana",
    NG: "Nigeria",
    US: "United States",
    GB: "United Kingdom",
    KE: "Kenya",
    ZA: "South Africa",
  };
  return map[code] ?? code;
}

export function buildSearchQuery(input: {
  industry: string;
  customCategory?: string | null;
  city: string;
  region?: string | null;
  country: string;
}): string {
  const category = input.customCategory?.trim() || input.industry;
  const place = [input.city, input.region, countryName(input.country)].filter(Boolean).join(", ");
  return `${category} in ${place}`;
}
