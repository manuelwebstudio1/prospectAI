"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand/logo";
import { adminNav } from "@/config/navigation";
import { cn } from "@/lib/utils";
import type { CurrentUser } from "@/types";

export function AdminShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-[248px] shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="px-4 py-4">
          <BrandLogo inverted />
          <p className="mt-2 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-muted">
            Platform admin
          </p>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 pb-4">
          {adminNav.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium",
                  active ? "bg-primary text-white" : "text-slate-300 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-2 px-3 pb-4">
          <Link href="/dashboard" className="block rounded-xl px-2.5 py-2 text-[13px] text-slate-300 hover:bg-white/5">
            Back to workspace
          </Link>
          <p className="truncate px-2.5 text-[11px] text-sidebar-muted">{user.email}</p>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4 sm:px-6 lg:hidden">
          <BrandLogo />
          <Link href="/dashboard" className="text-sm font-semibold text-primary">
            Workspace
          </Link>
        </header>
        <nav className="flex gap-2 overflow-x-auto border-b px-4 py-2 lg:hidden">
          {adminNav.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap text-sm text-muted-foreground hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
