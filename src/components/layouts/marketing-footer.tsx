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
    <footer className="mt-8 text-[#5c564f]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-4">
        <div>
          <BrandLogo mark="bloom" />
          <p className="mt-4 max-w-xs text-sm leading-6">
            Find businesses. Build websites. Win clients. Built for developers and agencies across Ghana and beyond.
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#9a9289]">
              {column.title}
            </p>
            <ul className="space-y-2 text-sm">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-[#1c1917]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-[#e6ddd4] py-5 text-center text-xs text-[#9a9289]">
        © {new Date().getFullYear()} ProspectAI. All rights reserved.
      </div>
    </footer>
  );
}
