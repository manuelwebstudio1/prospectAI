import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FeaturePage({
  icon: Icon,
  title,
  phase,
  description,
  bullets,
}: {
  icon: LucideIcon;
  title: string;
  phase: string;
  description: string;
  bullets: string[];
}) {
  return (
    <div className="mx-auto max-w-2xl animate-enter">
      <div className="surface-card p-8 sm:p-10">
        <span className="inline-flex items-center rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-primary">
          {phase}
        </span>
        <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        <ul className="mt-6 space-y-2 text-sm text-slate-600">
          {bullets.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard">Back to overview</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/settings">Workspace settings</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
