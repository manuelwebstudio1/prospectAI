import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DemoControls } from "@/components/demos/demo-controls";
import { getCurrentUser } from "@/lib/auth/session";
import { getDemo } from "@/services/workspace/repository";

export const metadata: Metadata = { title: "Demo website" };

export default async function DemoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user?.organizationId) redirect("/login");
  const demo = await getDemo(user.organizationId, id);
  if (!demo) notFound();

  return (
    <div className="space-y-5 animate-enter">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{demo.business_name}</h1>
          <p className="text-sm text-muted-foreground">Unofficial ProspectAI demonstration · {demo.demo_id}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="warning">Unofficial</Badge>
            {demo.is_sample ? <Badge variant="warning">Sample records</Badge> : null}
            <Badge variant="secondary">{demo.template_key.replaceAll("_", " ")}</Badge>
            <Badge variant={demo.content.copyMode === "ai" ? "default" : "muted"}>{demo.content.copyMode} copy</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/demos">All demos</Link>
          </Button>
          <Button asChild>
            <Link href={demo.preview_path} target="_blank">
              Open public preview
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="surface-card overflow-hidden p-2">
          <iframe
            title={`Unofficial demo for ${demo.business_name}`}
            src={`${demo.preview_path}?v=${encodeURIComponent(demo.updated_at)}`}
            className="h-[720px] w-full rounded-xl border bg-white"
          />
        </div>
        <aside className="surface-card p-5">
          <DemoControls demo={demo} />
        </aside>
      </div>
    </div>
  );
}
