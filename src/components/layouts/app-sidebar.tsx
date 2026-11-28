"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, HelpCircle, Shield } from "lucide-react";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { BrandLogo } from "@/components/brand/logo";
import { workspaceNav } from "@/config/navigation";
import { cn, initialsFromName } from "@/lib/utils";
import type { CurrentUser, PlanUsage } from "@/types";

export function AppSidebar({
  user,
  plan,
}: {
  user: CurrentUser;
  plan: PlanUsage;
}) {
  const pathname = usePathname();
  const creditPct = plan.creditsTotal
    ? Math.min(100, Math.round((plan.creditsUsed / plan.creditsTotal) * 100))
    : 0;

  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-[#eadfd6] bg-[#fbf8f4] text-[#1c1917]">
      <div className="flex items-center gap-2 px-4 py-4">
        <BrandLogo />
      </div>

      <button
        type="button"
        className="mx-3 mb-4 flex items-center justify-between rounded-xl border border-[#eadfd6] bg-white px-3 py-2.5 text-left"
      >
        <span>
          <span className="block text-sm font-semibold">{user.organizationName ?? "My Workspace"}</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9a9289]">
            {plan.planName} plan
          </span>
        </span>
        <ChevronDown className="h-4 w-4 text-[#9a9289]" />
      </button>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {workspaceNav.map((section) => (
          <div key={section.id} className="mb-5">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9a9289]">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      prefetch
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-colors",
                        active
                          ? "bg-[#e85a2a] text-white shadow-sm"
                          : "text-[#3f3a36] hover:bg-[#f3ebe3] hover:text-[#1c1917]",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-auto space-y-3 px-3 pb-4">
        {isPlatformAdmin(user) ? (
          <Link
            href="/admin"
            className="flex items-center gap-2.5 rounded-xl bg-[#f3ebe3] px-2.5 py-2 text-[13px] font-semibold text-[#1c1917] hover:bg-[#eadfd6]"
          >
            <Shield className="h-4 w-4 text-[#e85a2a]" />
            Platform console
          </Link>
        ) : null}
        <div className="rounded-2xl border border-[#eadfd6] bg-white p-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-[#9a9289]">Plan: {plan.planName}</span>
            <Link href="/dashboard/billing" className="font-semibold text-[#e85a2a] hover:text-[#cf4f24]">
              Upgrade
            </Link>
          </div>
          <p className="text-[11px] text-[#9a9289]">
            Credits {plan.creditsUsed.toLocaleString()} / {plan.creditsTotal.toLocaleString()}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f3ebe3]">
            <div className="h-full rounded-full bg-[#e85a2a]" style={{ width: `${creditPct}%` }} />
          </div>
          <p className="mt-1 text-right text-[11px] text-[#9a9289]">{creditPct}%</p>
        </div>

        <Link
          href="/contact"
          className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-[13px] text-[#3f3a36] hover:bg-[#f3ebe3]"
        >
          <HelpCircle className="h-4 w-4" />
          Help Centre
        </Link>

        <div className="flex items-center gap-2.5 rounded-xl border border-[#eadfd6] bg-white px-2.5 py-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e85a2a] text-xs font-bold text-white">
            {initialsFromName(user.fullName)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{user.fullName}</span>
            <span className="block truncate text-[11px] text-[#9a9289]">{user.email}</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
