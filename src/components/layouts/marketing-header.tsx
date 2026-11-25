"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Mail, Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { CtaLink } from "@/components/marketing/cta-link";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
] as const;

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="marketing-canvas sticky top-0 z-50 px-3 pb-3 pt-4 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center gap-3 rounded-full bg-white px-3 py-2 shadow-[0_10px_40px_rgba(80,50,30,0.08)] ring-1 ring-black/5 sm:px-4 lg:grid lg:grid-cols-[1fr_auto_1fr]">
        <Link href="/" aria-label="ProspectAI home" className="shrink-0 pl-1">
          <BrandLogo mark="bloom" />
        </Link>
        <nav className="hidden items-center justify-center gap-7 text-[13.5px] text-[#3f3a36] lg:flex">
          {nav.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 whitespace-nowrap transition-colors hover:text-[#1c1917]",
                  active && "font-medium text-[#1c1917]",
                )}
              >
                {active ? <span className="h-1.5 w-1.5 rounded-full bg-[#e85a2a]" /> : null}
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center justify-end gap-1 lg:flex">
          <Link
            href="/contact"
            aria-label="Contact"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#3f3a36] transition-colors hover:bg-[#f6f1eb]"
          >
            <Mail className="h-4 w-4" />
          </Link>
          <CtaLink href="/register" variant="orange">
            Start a project
          </CtaLink>
        </div>
        <button
          type="button"
          className="ml-auto rounded-full p-2 text-[#1c1917] lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open ? (
        <div className="mx-auto mt-2 max-w-6xl rounded-3xl bg-white p-5 shadow-[0_10px_40px_rgba(80,50,30,0.08)] ring-1 ring-black/5 lg:hidden">
          <div className="flex flex-col gap-3 text-sm text-[#3f3a36]">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Link href="/contact" onClick={() => setOpen(false)}>
              Contact
            </Link>
            <Link href="/login" onClick={() => setOpen(false)}>
              Log in
            </Link>
            <div className="pt-2" onClick={() => setOpen(false)}>
              <CtaLink href="/register" variant="orange">
                Start a project
              </CtaLink>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
