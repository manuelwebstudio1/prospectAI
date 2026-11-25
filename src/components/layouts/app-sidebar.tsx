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
    <aside className="flex h-full w-[248px] shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-4 py-4">
        <BrandLogo inverted />
      </div>

      <button
        type="button"
        className="mx-3 mb-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left"
      >
        <span>
          <span className="block text-sm font-semibold">{user.organizationName ?? "My Workspace"}</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted">
            {plan.planName} plan
          </span>
        </span>
        <ChevronDown className="h-4 w-4 text-sidebar-muted" />
      </button>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {workspaceNav.map((section) => (
          <div key={section.id} className="mb-5">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-muted">
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
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-colors",
                        active
                          ? "bg-primary text-white shadow-sm"
                          : "text-slate-300 hover:bg-white/5 hover:text-white",
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
            className="flex items-center gap-2.5 rounded-xl bg-white/10 px-2.5 py-2 text-[13px] font-semibold text-white hover:bg-white/15"
          >
            <Shield className="h-4 w-4" />
            Platform console
          </Link>
        ) : null}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-sidebar-muted">Plan: {plan.planName}</span>
            <Link href="/dashboard/billing" className="font-semibold text-violet-300 hover:text-white">
              Upgrade
            </Link>
          </div>
          <p className="text-[11px] text-sidebar-muted">
            Credits {plan.creditsUsed.toLocaleString()} / {plan.creditsTotal.toLocaleString()}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-primary" style={{ width: `${creditPct}%` }} />
          </div>
          <p className="mt-1 text-right text-[11px] text-sidebar-muted">{creditPct}%</p>
        </div>

        <Link
          href="/contact"
          className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-[13px] text-slate-300 hover:bg-white/5"
        >
          <HelpCircle className="h-4 w-4" />
          Help Centre
        </Link>

        <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold">
            {initialsFromName(user.fullName)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{user.fullName}</span>
            <span className="block truncate text-[11px] text-sidebar-muted">{user.email}</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
