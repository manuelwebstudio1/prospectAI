import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageIntro({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: ReactNode;
  description: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn(align === "center" && "mx-auto max-w-3xl text-center")}>
      {eyebrow ? (
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#eadfd6] bg-white/80 px-3.5 py-1 text-sm text-[#3f3a36] shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[#e85a2a]" />
          {eyebrow}
        </p>
      ) : null}
      <h1 className="font-display text-4xl leading-[1.12] tracking-[-0.03em] text-[#1c1917] sm:text-5xl">
        {title}
      </h1>
      <p className={cn("mt-4 text-base leading-7 text-[#6f6a64] sm:text-lg", align === "center" && "mx-auto max-w-2xl")}>
        {description}
      </p>
    </div>
  );
}
