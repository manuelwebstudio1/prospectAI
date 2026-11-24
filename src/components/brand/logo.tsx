import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  inverted = false,
  withWordmark = true,
}: {
  className?: string;
  inverted?: boolean;
  withWordmark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#8b7cff] to-[#5b4ce8] text-sm font-bold text-white shadow-sm">
        P
      </span>
      {withWordmark ? (
        <span
          className={cn(
            "text-[15px] font-bold tracking-tight",
            inverted ? "text-white" : "text-foreground",
          )}
        >
          ProspectAI
        </span>
      ) : null}
    </div>
  );
}
