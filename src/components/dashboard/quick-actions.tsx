import Link from "next/link";
import { Plus } from "lucide-react";
import { quickActions } from "@/config/navigation";

export function QuickActions() {
  return (
    <article className="surface-card p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <span className="text-primary">⚡</span> Quick Actions
      </h2>
      <div className="space-y-2">
        {quickActions.map((action) => {
          const Icon = action.icon;
          const isCreate = action.label.startsWith("Create");
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 transition-colors hover:bg-muted/70"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-primary">
                {isCreate ? <Plus className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <span>
                <span className="block text-sm font-semibold">{action.label}</span>
                <span className="text-xs text-muted-foreground">{action.description}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </article>
  );
}
