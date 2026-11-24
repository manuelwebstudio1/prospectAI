export function PlaceholderImage({
  label,
  className = "",
  tone = "slate",
}: {
  label: string;
  className?: string;
  tone?: "slate" | "warm" | "teal" | "rose" | "navy";
}) {
  const tones = {
    slate: "from-slate-700 to-slate-900",
    warm: "from-amber-700 to-stone-900",
    teal: "from-teal-700 to-slate-900",
    rose: "from-rose-400 to-violet-800",
    navy: "from-indigo-800 to-slate-950",
  };
  return (
    <div className={`relative flex overflow-hidden bg-gradient-to-br ${tones[tone]} ${className}`}>
      <span className="absolute bottom-2 left-2 rounded bg-black/55 px-2 py-1 text-[10px] font-medium leading-snug text-white">
        Placeholder — not this business’s {label}
      </span>
    </div>
  );
}
