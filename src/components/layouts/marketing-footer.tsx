import Link from "next/link";
import { BrandLogo } from "@/components/brand/logo";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/features", label: "Features" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Log in" },
      { href: "/register", label: "Create workspace" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0b0e1c] text-slate-400">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <BrandLogo inverted />
          <p className="mt-4 max-w-xs text-sm leading-6">
            Find businesses. Build websites. Win clients. Built for developers and agencies across Ghana and beyond.
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {column.title}
            </p>
            <ul className="space-y-2 text-sm">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} ProspectAI. All rights reserved.
      </div>
    </footer>
  );
}
