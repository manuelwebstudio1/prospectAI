import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function CtaLink({
  href,
  children,
  variant = "dark",
  size = "md",
}: {
  href: string;
  children: ReactNode;
  variant?: "dark" | "orange";
  size?: "md" | "lg";
}) {
  const large = size === "lg";
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center font-medium text-white transition-colors",
        large ? "gap-3 rounded-full py-2.5 pl-7 pr-2 text-base" : "gap-2 rounded-full py-2 pl-4 pr-1.5 text-sm",
        variant === "orange" ? "bg-[#e85a2a] hover:bg-[#cf4f24]" : "bg-[#171717] hover:bg-black",
      )}
    >
      {children}
      <span
        className={cn(
          "flex items-center justify-center rounded-full",
          large ? "h-9 w-9" : "h-7 w-7",
          variant === "orange" ? "bg-white/20" : "bg-white/10",
        )}
      >
        <ArrowRight className={large ? "h-4 w-4" : "h-3.5 w-3.5"} />
      </span>
    </Link>
  );
}
