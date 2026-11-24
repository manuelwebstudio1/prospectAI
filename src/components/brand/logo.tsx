import { cn } from "@/lib/utils";

function BloomMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("h-6 w-6 text-[#e85a2a]", className)}
      aria-hidden
    >
      {Array.from({ length: 8 }, (_, i) => (
        <ellipse
          key={i}
          cx="16"
          cy="7.35"
          rx="3.05"
          ry="5.85"
          fill="currentColor"
          transform={`rotate(${i * 45} 16 16)`}
        />
      ))}
    </svg>
  );
}

export function BrandLogo({
  className,
  inverted = false,
  withWordmark = true,
  mark = "letter",
}: {
  className?: string;
  inverted?: boolean;
  withWordmark?: boolean;
  mark?: "letter" | "bloom";
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {mark === "bloom" ? (
        <BloomMark />
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#8b7cff] to-[#5b4ce8] text-sm font-bold text-white shadow-sm">
          P
        </span>
      )}
      {withWordmark ? (
        <span
          className={cn(
            "text-[15px] tracking-tight",
            mark === "bloom" ? "font-semibold" : "font-bold",
            inverted ? "text-white" : "text-foreground",
          )}
        >
          ProspectAI
        </span>
      ) : null}
    </div>
  );
}
