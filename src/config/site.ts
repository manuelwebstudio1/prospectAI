export const siteConfig = {
  name: "ProspectAI",
  tagline: "Find Businesses. Build Websites. Win Clients.",
  description:
    "ProspectAI is an AI-powered client acquisition platform that discovers businesses without professional websites, researches their operations, generates personalized demo websites, and helps developers win more clients.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  locale: "en-GH",
  supportEmail: "hello@prospectai.com",
} as const;

export const marketingNav = [
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;
