import type { Metadata } from "next";
import { getAiStatus } from "@/lib/ai/provider";
import { integrationStatus } from "@/lib/env";
import { adminListAgentJobs } from "@/services/agent/store";
import { listAiUsage } from "@/services/admin/store";
import { getGrokBotConnectorStatus } from "@/lib/mcp/status";
import { GrokBotStatus } from "@/components/admin/grok-bot-status";

export const metadata: Metadata = { title: "Admin AI agent" };

export default async function AdminAgentPage() {
  const [jobs, usage, integrations, grokBot] = await Promise.all([
    adminListAgentJobs(),
    listAiUsage(),
    Promise.resolve(integrationStatus()),
    getGrokBotConnectorStatus(),
  ]);
  const ai = getAiStatus();
  const counts = {
    total: jobs.length,
    queued: jobs.filter((item) => item.status === "queued" || item.status === "running").length,
    completed: jobs.filter((item) => item.status === "completed").length,
    failed: jobs.filter((item) => item.status === "failed").length,
    discovered: jobs.reduce((sum, item) => sum + item.counters.discovered, 0),
    demos: jobs.reduce((sum, item) => sum + item.counters.generated, 0),
    drafts: jobs.reduce((sum, item) => sum + item.counters.outreachDrafts, 0),
  };

  return (
    <div className="space-y-6 animate-enter">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Autonomous agent</h1>
        <p className="text-sm text-muted-foreground">
          Platform-wide job monitoring. Provider keys stay in environment variables and are never shown here.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Executions", counts.total],
          ["Active", counts.queued],
          ["Completed", counts.completed],
          ["Failed", counts.failed],
          ["Businesses discovered", counts.discovered],
          ["Demos generated", counts.demos],
          ["Outreach drafts", counts.drafts],
          ["AI log rows", usage.length],
        ].map(([label, value]) => (
          <div key={String(label)} className="surface-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold tabular">{value}</p>
          </div>
        ))}
      </div>

      <GrokBotStatus status={grokBot} />

      <section className="surface-card p-5 space-y-3">
        <h2 className="font-semibold">Optional HTTP model adapters</h2>
        <p className="text-sm">
          Active adapter: <span className="font-medium">{ai.provider}</span>
          {ai.configured ? ` · ${ai.model}` : " · none (records-only compilation)"}
        </p>
        <p className="text-sm text-muted-foreground">
          These adapters are independent of Grok Bot. OpenAI: {integrations.openai ? "configured" : "not set"}. Optional
          xAI HTTP adapter: {integrations.xaiAdapter ? "enabled" : "disabled"}. Unattended worker:{" "}
          {integrations.workerCron ? "authorized" : "not set"}.
        </p>
      </section>

      {jobs.length === 0 ? (
        <p className="surface-card p-6 text-sm text-muted-foreground">No autonomous jobs have been recorded yet.</p>
      ) : (
        <ul className="surface-card divide-y">
          {jobs.map((job) => (
            <li key={job.id} className="px-4 py-3 text-sm">
              <p className="font-medium">
                {job.status} · {job.plan.mode} · {job.plan.city ?? "workspace"}
              </p>
              <p className="text-xs text-muted-foreground">
                {job.created_at.slice(0, 19).replace("T", " ")}
                {job.last_error ? ` · ${job.last_error}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
