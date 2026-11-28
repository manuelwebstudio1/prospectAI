export type PlanSlug = "starter" | "professional" | "agency";

export type SubscriptionPlan = {
  slug: PlanSlug;
  name: string;
  tagline: string;
  monthlyGhs: number;
  annualGhs: number;
  highlighted?: boolean;
  discoveryCredits: number;
  researchCredits: number;
  websiteCredits: number;
  outreachCredits: number;
  maxTeamMembers: number;
  features: string[];
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    slug: "starter",
    name: "Starter",
    tagline: "For independent freelancers getting their first pipeline.",
    monthlyGhs: 50,
    annualGhs: 500,
    discoveryCredits: 250,
    researchCredits: 100,
    websiteCredits: 10,
    outreachCredits: 50,
    maxTeamMembers: 1,
    features: [
      "250 business discoveries / month",
      "Website detection",
      "AI business research",
      "10 demo websites",
      "Basic lead management",
      "Email support",
    ],
  },
  {
    slug: "professional",
    name: "Professional",
    tagline: "For growing agencies that run campaigns every week.",
    monthlyGhs: 150,
    annualGhs: 1500,
    highlighted: true,
    discoveryCredits: 10000,
    researchCredits: 2000,
    websiteCredits: -1,
    outreachCredits: 1000,
    maxTeamMembers: 5,
    features: [
      "10,000 business discoveries / month",
      "Unlimited AI website generation",
      "Advanced AI research",
      "AI outreach assistance",
      "Campaign management",
      "Demo website management",
      "Analytics dashboard",
      "Up to 5 team members",
    ],
  },
  {
    slug: "agency",
    name: "Agency",
    tagline: "For established studios that need scale and control.",
    monthlyGhs: 350,
    annualGhs: 3500,
    discoveryCredits: 40000,
    researchCredits: 8000,
    websiteCredits: -1,
    outreachCredits: 5000,
    maxTeamMembers: 25,
    features: [
      "40,000 business discoveries / month",
      "Unlimited AI website generation",
      "Priority processing",
      "Advanced campaign management",
      "Team collaboration",
      "Advanced analytics",
      "Increased AI usage",
      "Priority support",
    ],
  },
];

export function getPlan(slug: PlanSlug): SubscriptionPlan {
  const plan = SUBSCRIPTION_PLANS.find((item) => item.slug === slug);
  if (!plan) throw new Error(`Unknown plan: ${slug}`);
  return plan;
}
