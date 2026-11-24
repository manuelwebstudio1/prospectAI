import Link from "next/link";
import type { RecentDemo } from "@/types";

const tones: Record<RecentDemo["thumbnailTone"], string> = {
  dark: "from-slate-800 to-slate-950",
  rose: "from-rose-200 to-fuchsia-300",
  amber: "from-amber-200 to-orange-300",
};

export function RecentDemos({ items }: { items: RecentDemo[] }) {
  return (
    <article className="surface-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Recent Demo Websites</h2>
        <Link href="/dashboard/demos" className="text-xs font-semibold text-primary">
          View All →
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No demos yet. Generate a website after researching a lead.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <Link key={item.id} href="/dashboard/demos" className="group">
              <div className={`h-20 rounded-xl bg-gradient-to-br ${tones[item.thumbnailTone]} ring-1 ring-black/5`} />
              <p className="mt-2 text-xs font-semibold group-hover:text-primary">{item.businessName}</p>
              <p className="text-[11px] text-muted-foreground">Created {item.createdAt}</p>
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
