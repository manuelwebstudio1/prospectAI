import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/session";
import { listDemos, listResearchBriefs } from "@/services/workspace/repository";
import { getAiStatus } from "@/lib/ai/provider";
import { GenerateDemoButton } from "@/components/demos/generate-button";

export const metadata: Metadata = { title: "AI website builder" };

export default async function BuilderPage() {
  const user = await getCurrentUser();
  if (!user?.organizationId) redirect("/login");
  const [briefs, demos] = await Promise.all([
    listResearchBriefs(user.organizationId),
    listDemos(user.organizationId),
  ]);
  const ai = getAiStatus();

  return (
    <div className="space-y-5 animate-enter">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Website architect briefs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate an unofficial demo from a research brief. Copy uses verified facts only; missing details stay unknown.
          {ai.configured ? ` Active model: ${ai.provider} / ${ai.model}.` : " AI is not configured — briefs use industry blueprints and deterministic copy."}
        </p>
      </div>
      {briefs.length === 0 ? (
        <div className="surface-card px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No briefs yet. Open a lead and run research to generate an architecture.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/leads">View leads</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {briefs.map((brief) => (
            <article key={brief.id} className="surface-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{brief.businessName}</h2>
                  <p className="text-xs text-muted-foreground">{brief.architecture?.websiteType ?? "unspecified"}</p>
                </div>
                <Badge variant={brief.architect_mode === "ai" ? "default" : "secondary"}>
                  {brief.architect_mode}
                </Badge>
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                {brief.architecture?.rationale ?? "No rationale stored."}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {(brief.architecture?.pages ?? []).map((page) => page.title).join(" · ") || "No pages yet"}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <GenerateDemoButton
                  researchId={brief.id}
                  leadId={brief.leadId}
                  label={demos.some((demo) => demo.research_id === brief.id || demo.business_id === brief.business_id) ? "Regenerate unofficial demo" : "Generate unofficial demo"}
                />
                {demos
                  .filter((demo) => demo.research_id === brief.id || demo.business_id === brief.business_id)
                  .slice(0, 1)
                  .map((demo) => (
                    <Button key={demo.id} asChild variant="outline">
                      <Link href={`/dashboard/demos/${demo.id}`}>View demo</Link>
                    </Button>
                  ))}
                <Button asChild variant="ghost">
                  <Link href={brief.leadId ? `/dashboard/leads/${brief.leadId}` : "/dashboard/leads"}>
                    Open research
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
