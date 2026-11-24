import type { WebsiteArchitecture } from "@/lib/ai/schemas";

type Blueprint = Omit<WebsiteArchitecture, "basedOnVerifiedFactsOnly" | "rationale" | "basedOnIndustry">;

const DEFAULT_PALETTE = {
  primary: "#6D5EF6",
  secondary: "#0F172A",
  accent: "#38BDF8",
  background: "#F8FAFC",
  text: "#0F172A",
};

const BLUEPRINTS: Record<string, Blueprint> = {
  "real estate": {
    websiteType: "real_estate",
    pages: [
      { slug: "home", title: "Home", purpose: "Introduce the agency and featured properties." },
      { slug: "about", title: "About", purpose: "Company story using only verified facts." },
      { slug: "listings", title: "Property listings", purpose: "Searchable catalogue of properties." },
      { slug: "property", title: "Property details", purpose: "Single listing with gallery and enquiry." },
      { slug: "contact", title: "Contact", purpose: "Enquiry form and WhatsApp." },
    ],
    colourPalette: { ...DEFAULT_PALETTE, primary: "#1D4ED8" },
    designDirection: "Editorial real-estate layout with generous imagery and clear listing cards.",
    requiredFunctionality: ["Property listings", "Search and filters", "Enquiry form", "WhatsApp contact"],
    contentStructure: ["Hero", "Featured listings", "Services", "About", "Contact"],
  },
  restaurants: {
    websiteType: "restaurant",
    pages: [
      { slug: "home", title: "Home", purpose: "Atmosphere, location and primary call to action." },
      { slug: "menu", title: "Menu", purpose: "Food and drink sections." },
      { slug: "about", title: "About", purpose: "Verified history only." },
      { slug: "reservations", title: "Reservations", purpose: "Enquiry or booking request." },
      { slug: "location", title: "Location", purpose: "Map and hours if known." },
      { slug: "contact", title: "Contact", purpose: "Phone, email and form." },
    ],
    colourPalette: { ...DEFAULT_PALETTE, primary: "#B45309", accent: "#F59E0B" },
    designDirection: "Warm hospitality layout with strong photography placeholders.",
    requiredFunctionality: ["Menu sections", "Reservation enquiry", "Location block", "WhatsApp"],
    contentStructure: ["Hero", "Highlights", "Menu preview", "Visit us", "Contact"],
  },
  hotels: {
    websiteType: "hotel",
    pages: [
      { slug: "home", title: "Home", purpose: "Stay proposition and booking enquiry." },
      { slug: "rooms", title: "Rooms", purpose: "Room types without invented amenities." },
      { slug: "facilities", title: "Facilities", purpose: "Only list facilities that are verified." },
      { slug: "gallery", title: "Gallery", purpose: "Licensed or placeholder imagery." },
      { slug: "booking", title: "Booking enquiry", purpose: "Request a stay." },
      { slug: "contact", title: "Contact", purpose: "Reach the property." },
    ],
    colourPalette: { ...DEFAULT_PALETTE, primary: "#0F766E" },
    designDirection: "Calm hospitality aesthetic with large imagery and sparse copy.",
    requiredFunctionality: ["Room showcase", "Booking enquiry", "Gallery", "Map"],
    contentStructure: ["Hero", "Rooms", "Facilities", "Gallery", "Contact"],
  },
  construction: {
    websiteType: "construction",
    pages: [
      { slug: "home", title: "Home", purpose: "Capability overview." },
      { slug: "services", title: "Services", purpose: "Verified services only." },
      { slug: "projects", title: "Projects", purpose: "Project gallery if supplied later." },
      { slug: "about", title: "About", purpose: "Company profile from verified facts." },
      { slug: "contact", title: "Contact", purpose: "Quote request." },
    ],
    colourPalette: { ...DEFAULT_PALETTE, primary: "#B45309", secondary: "#1C1917" },
    designDirection: "Industrial, high-contrast layout with project grids.",
    requiredFunctionality: ["Services list", "Project gallery", "Quote form"],
    contentStructure: ["Hero", "Services", "Projects", "About", "Contact"],
  },
  schools: {
    websiteType: "school",
    pages: [
      { slug: "home", title: "Home", purpose: "Welcome and admissions CTA." },
      { slug: "about", title: "About", purpose: "Mission from verified copy only." },
      { slug: "programs", title: "Programs", purpose: "Courses that are known." },
      { slug: "admissions", title: "Admissions", purpose: "Enquiry process." },
      { slug: "facilities", title: "Facilities", purpose: "Only verified facilities." },
      { slug: "contact", title: "Contact", purpose: "Admissions contact." },
    ],
    colourPalette: { ...DEFAULT_PALETTE, primary: "#1D4ED8" },
    designDirection: "Trustworthy institutional layout with clear information hierarchy.",
    requiredFunctionality: ["Programs", "Admissions enquiry", "Facilities", "Contact"],
    contentStructure: ["Hero", "Programs", "Why us", "Admissions", "Contact"],
  },
  "beauty and cosmetics": {
    websiteType: "beauty",
    pages: [
      { slug: "home", title: "Home", purpose: "Brand and services snapshot." },
      { slug: "services", title: "Services", purpose: "Treatments that are verified." },
      { slug: "about", title: "About", purpose: "Studio story if known." },
      { slug: "contact", title: "Contact", purpose: "Booking enquiry." },
    ],
    colourPalette: { ...DEFAULT_PALETTE, primary: "#DB2777", accent: "#F9A8D4" },
    designDirection: "Soft, high-end salon aesthetic.",
    requiredFunctionality: ["Services", "Booking enquiry", "WhatsApp", "Gallery placeholders"],
    contentStructure: ["Hero", "Services", "About", "Contact"],
  },
  "fashion stores": {
    websiteType: "ecommerce",
    pages: [
      { slug: "home", title: "Home", purpose: "Seasonal merchandising." },
      { slug: "shop", title: "Products", purpose: "Catalogue demonstration." },
      { slug: "product", title: "Product details", purpose: "Single item layout." },
      { slug: "about", title: "About", purpose: "Brand story if verified." },
      { slug: "contact", title: "Contact", purpose: "Support and wholesale enquiry." },
    ],
    colourPalette: { ...DEFAULT_PALETTE, primary: "#111827", accent: "#C4B5FD" },
    designDirection: "Editorial retail layout with product grids.",
    requiredFunctionality: ["Catalogue", "Product detail", "Cart demonstration", "Contact"],
    contentStructure: ["Hero", "Collections", "Featured products", "About", "Contact"],
  },
};

const FALLBACK: Blueprint = {
  websiteType: "professional_services",
  pages: [
    { slug: "home", title: "Home", purpose: "Positioning and primary CTA." },
    { slug: "about", title: "About", purpose: "Verified company facts only." },
    { slug: "services", title: "Services", purpose: "Known services; omit if unknown." },
    { slug: "contact", title: "Contact", purpose: "Enquiry form and known contact channels." },
  ],
  colourPalette: DEFAULT_PALETTE,
  designDirection: "Clean professional services layout with restrained colour and clear hierarchy.",
  requiredFunctionality: ["Services", "Enquiry form", "WhatsApp if a phone is known", "Location if known"],
  contentStructure: ["Hero", "Services", "About", "Contact"],
};

function normalizeIndustry(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/companies|stores|businesses/g, "").replace(/\s+/g, " ").trim();
}

export function blueprintForIndustry(industry: string | null | undefined): Blueprint & { key: string } {
  const needle = normalizeIndustry(industry);
  const match =
    Object.entries(BLUEPRINTS).find(([key]) => needle.includes(key) || key.includes(needle))?.[1] ?? FALLBACK;
  return { ...match, key: needle || "unspecified" };
}

export function architectureFromIndustry(industry: string | null | undefined): WebsiteArchitecture {
  const blueprint = blueprintForIndustry(industry);
  return {
    websiteType: blueprint.websiteType,
    rationale:
      industry
        ? `Recommended structure for the verified industry category “${industry}”. This is a template recommendation, not a claim about unpublished services.`
        : "Industry is unknown, so a generic professional-services structure is recommended until the user supplies a category.",
    pages: blueprint.pages,
    colourPalette: blueprint.colourPalette,
    designDirection: blueprint.designDirection,
    requiredFunctionality: blueprint.requiredFunctionality,
    contentStructure: blueprint.contentStructure,
    basedOnIndustry: industry ?? null,
    basedOnVerifiedFactsOnly: true,
  };
}
