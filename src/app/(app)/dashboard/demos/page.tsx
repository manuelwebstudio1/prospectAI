import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyPreviewButton } from "@/components/demos/copy-preview-button";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/session";
import { listDemos } from "@/services/workspace/repository";

export const metadata: Metadata = { title: "Demo websites" };

export default async function DemosPage() {
  const user = await getCurrentUser();
  if (!user?.organizationId) redirect("/login");
  const demos = await listDemos(user.organizationId);

  return (
    <div className="space-y-5 animate-enter">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Unofficial demo websites</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every preview is a ProspectAI demonstration, not an official client site. Public links expire after 30 days.
        </p>
      </div>
      {demos.length === 0 ? (
        <div className="surface-card px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No demos yet. Compile research on a lead, then generate an unofficial preview from the architect brief.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/builder">Open architect briefs</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {demos.map((demo) => (
            <article key={demo.id} className="surface-card flex flex-col p-5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{demo.business_name}</h2>
                  <p className="text-xs text-muted-foreground">{demo.template_key.replaceAll("_", " ")}</p>
                </div>
                <Badge variant={demo.status === "ready" ? "success" : "warning"}>{demo.status}</Badge>
              </div>
              <div className="mb-4 h-24 rounded-xl" style={{ background: `linear-gradient(135deg, ${demo.palette.primary}, ${demo.palette.secondary})` }} />
              <p className="line-clamp-2 text-sm text-muted-foreground">{demo.content.subhead}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {demo.is_sample ? <Badge variant="warning">Sample records</Badge> : null}
                <Badge variant="muted">Unofficial</Badge>
                {demo.content.copyMode === "ai" ? <Badge>AI copy</Badge> : <Badge variant="secondary">Deterministic copy</Badge>}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Expires {demo.expires_at.slice(0, 10)}</p>
              <p className="mt-2 break-all text-[11px] text-muted-foreground">
                {`${env.appUrl.replace(/\/$/, "")}${demo.preview_path}`}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link href={`/dashboard/demos/${demo.id}`}>Manage</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={demo.preview_path} target="_blank">
                    Open preview
                  </Link>
                </Button>
                <CopyPreviewButton path={demo.preview_path} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
