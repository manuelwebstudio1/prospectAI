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
  mark = "bloom",
}: {
  className?: string;
  inverted?: boolean;
  withWordmark?: boolean;
  mark?: "letter" | "bloom";
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {mark === "letter" ? (
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e85a2a] text-sm font-bold text-white shadow-sm">
          P
        </span>
      ) : (
        <BloomMark />
      )}
      {withWordmark ? (
        <span
          className={cn(
            "text-[15px] font-semibold tracking-tight",
            inverted ? "text-white" : "text-[#1c1917]",
          )}
        >
          ProspectAI
        </span>
      ) : null}
    </div>
  );
}
