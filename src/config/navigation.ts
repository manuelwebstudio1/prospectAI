import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  Building2,
  CreditCard,
  LayoutDashboard,
  Mail,
  Plug,
  Search,
  Settings,
  Sparkles,
  Target,
  Users,
  Globe,
  ScanSearch,
  Megaphone,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

export type NavSection = {
  id: string;
  title: string;
  items: NavItem[];
};

export const workspaceNav: NavSection[] = [
  {
    id: "workspace",
    title: "Workspace",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/agent", label: "AI Agent", icon: Bot },
      { href: "/dashboard/discovery", label: "Discover Businesses", icon: Search },
      { href: "/dashboard/campaigns", label: "Campaigns", icon: Target },
      { href: "/dashboard/leads", label: "All Leads", icon: Building2 },
      { href: "/dashboard/analyzer", label: "Website Analyzer", icon: ScanSearch },
      { href: "/dashboard/demos", label: "Demo Websites", icon: Globe },
      { href: "/dashboard/builder", label: "AI Website Builder", icon: Sparkles },
      { href: "/dashboard/outreach", label: "Outreach", icon: Megaphone },
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    id: "management",
    title: "Management",
    items: [
      { href: "/dashboard/team", label: "Team Members", icon: Users },
      { href: "/dashboard/integrations", label: "Integrations", icon: Plug },
      { href: "/dashboard/billing", label: "Billing & Plans", icon: CreditCard },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

export const adminNav: NavItem[] = [
  { href: "/admin", label: "Admin Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/plans", label: "Plans", icon: CreditCard },
  { href: "/admin/jobs", label: "Background Jobs", icon: Target },
  { href: "/admin/agent", label: "AI Agent", icon: Bot },
  { href: "/admin/usage", label: "AI usage", icon: Sparkles },
  { href: "/admin/integrations", label: "Integrations", icon: Plug },
  { href: "/admin/logs", label: "System logs", icon: ScanSearch },
  { href: "/admin/settings", label: "Platform Settings", icon: Settings },
];

export const quickActions = [
  {
    href: "/dashboard/agent",
    label: "Run AI Agent",
    description: "Give a natural-language acquisition instruction",
    icon: Bot,
  },
  {
    href: "/dashboard/discovery",
    label: "Discover Businesses",
    description: "Find new business opportunities",
    icon: Search,
  },
  {
    href: "/dashboard/builder",
    label: "Generate Website",
    description: "Create an AI demo website",
    icon: Sparkles,
  },
  {
    href: "/dashboard/leads",
    label: "View Leads",
    description: "Manage and track your prospects",
    icon: Building2,
  },
  {
    href: "/dashboard/campaigns?new=1",
    label: "Create Campaign",
    description: "Set up a new discovery campaign",
    icon: Mail,
  },
] as const;
