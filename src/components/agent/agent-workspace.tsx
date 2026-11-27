"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bot, Pause, Play, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import type { AgentActivityRecord, AgentJobRecord, AgentTaskRecord } from "@/services/agent/types";
import type { AgentPlan } from "@/services/agent/types";

const EXAMPLES = [
  "Find 20 construction companies in Kumasi without professional websites and generate demos for them.",
  "Find 15 real estate businesses in Accra, Ghana, that do not have professional websites. Research each business and prepare outreach messages.",
  "Research my latest leads.",
  "Generate demos for my highest-scoring opportunities.",
  "Show me businesses whose demos have been deployed.",
  "Prepare outreach messages for my latest prospects.",
];

type JobRow = { job: AgentJobRecord; tasks: AgentTaskRecord[] };

function statusBadge(status: string) {
  if (status === "running") return <Badge variant="success">Running</Badge>;
  if (status === "queued") return <Badge variant="warning">Queued</Badge>;
  if (status === "paused") return <Badge variant="warning">Paused</Badge>;
  if (status === "failed") return <Badge variant="destructive">Failed</Badge>;
  if (status === "completed") return <Badge variant="success">Completed</Badge>;
  if (status === "cancelled") return <Badge variant="muted">Cancelled</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

function jobProgress(tasks: AgentTaskRecord[]) {
  if (!tasks.length) return 0;
  return Math.round(tasks.reduce((sum, item) => sum + item.progress, 0) / tasks.length);
}

export function AgentWorkspace({
  placesConfigured,
  aiConfigured,
  aiProvider,
  workerConfigured,
}: {
  placesConfigured: boolean;
  aiConfigured: boolean;
  aiProvider: string;
  workerConfigured: boolean;
}) {
  const [instruction, setInstruction] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activity, setActivity] = useState<AgentActivityRecord[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const selected = jobs.find((item) => item.job.id === selectedId) ?? jobs[0] ?? null;
  const active = selected && (selected.job.status === "queued" || selected.job.status === "running");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/agent/jobs");
    if (!response.ok) return;
    const json = (await response.json()) as { jobs: JobRow[] };
    setJobs(json.jobs ?? []);
    const focus = selectedId ?? json.jobs?.[0]?.job.id;
    if (focus) {
      const detail = await fetch(`/api/agent/jobs/${focus}`);
      if (detail.ok) {
        const bundle = (await detail.json()) as { activity: AgentActivityRecord[] };
        setActivity(bundle.activity ?? []);
      }
    }
  }, [selectedId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!active || !selected) return;
    let cancelled = false;
    async function loop() {
      while (!cancelled) {
        try {
          await fetch("/api/agent/tick", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobId: selected!.job.id }),
          });
          if (!cancelled) await refresh();
        } catch {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    }
    void loop();
    return () => {
      cancelled = true;
    };
  }, [active, selected?.job.id, selected?.job.status, refresh]);

  async function submit() {
    setPending(true);
    setNotice(null);
    try {
      const response = await fetch("/api/agent/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction, confirmed }),
      });
      const json = (await response.json()) as {
        type?: string;
        error?: string;
        answer?: string;
        job?: AgentJobRecord;
        plan?: AgentPlan;
      };
      if (json.type === "conversation") {
        setNotice(json.answer ?? json.error ?? "Done.");
        return;
      }
      if (!response.ok) {
        setNotice(json.error ?? "Could not start the job.");
        return;
      }
      if (json.job) {
        setSelectedId(json.job.id);
        setInstruction("");
        setConfirmed(false);
        await refresh();
      }
    } finally {
      setPending(false);
    }
  }

  async function control(action: "pause" | "resume" | "cancel" | "retry") {
    if (!selected) return;
    await fetch(`/api/agent/jobs/${selected.job.id}/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await refresh();
  }

  const counters = selected?.job.counters;
  const currentTask = useMemo(
    () => selected?.tasks.find((item) => item.status === "running" || item.status === "queued" || item.status === "retrying"),
    [selected],
  );

  return (
    <div className="space-y-6 animate-enter">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Autonomous agent</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Agent Command Center</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Give a high-level instruction. The orchestrator plans discovery, research, scoring, demos, deployment and
          outreach drafts — without sending messages until you approve them.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="surface-card px-4 py-3 text-sm">
          <p className="text-muted-foreground">Business discovery</p>
          <p className="mt-1 font-semibold">{placesConfigured ? "Google Places connected" : "Sample directory only"}</p>
        </div>
        <div className="surface-card px-4 py-3 text-sm">
          <p className="text-muted-foreground">AI provider</p>
          <p className="mt-1 font-semibold">
            {aiConfigured ? `${aiProvider} configured` : `${aiProvider} not configured — structured fallbacks only`}
          </p>
        </div>
        <div className="surface-card px-4 py-3 text-sm">
          <p className="text-muted-foreground">Background worker</p>
          <p className="mt-1 font-semibold">
            {workerConfigured ? "Cron worker authorized" : "Runs while this page is open until CRON_SECRET is set"}
          </p>
        </div>
      </div>

      <section className="surface-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Bot className="size-5 text-primary" />
          <h2 className="font-semibold">Instruction</h2>
        </div>
        <Textarea
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
          placeholder="Find 30 construction companies in Kumasi without professional websites and generate demos for them."
          className="min-h-32"
        />
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
              onClick={() => setInstruction(example)}
            >
              {example.length > 72 ? `${example.slice(0, 72)}…` : example}
            </button>
          ))}
        </div>
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input type="checkbox" className="mt-1" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
          I understand this may use a substantial number of plan credits.
        </label>
        {notice ? <p className="whitespace-pre-wrap rounded-xl bg-muted/60 px-4 py-3 text-sm">{notice}</p> : null}
        <Button onClick={() => void submit()} disabled={pending || instruction.trim().length < 8}>
          {pending ? "Starting…" : "Start execution"}
        </Button>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-4">
          <h2 className="font-semibold">Active tasks</h2>
          {!selected ? (
            <p className="surface-card p-6 text-sm text-muted-foreground">No agent jobs yet. Submit an instruction to create one.</p>
          ) : (
            <div className="space-y-4">
              <div className="surface-card p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{selected.job.plan.objective}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{selected.job.instruction}</p>
                  </div>
                  {statusBadge(selected.job.status)}
                </div>
                <Progress value={jobProgress(selected.tasks)} />
                <p className="text-xs text-muted-foreground">
                  {currentTask ? currentTask.title : "Waiting for the next step."}
                  {selected.job.last_error ? ` · ${selected.job.last_error}` : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => void control("pause")} disabled={!active}>
                    <Pause className="size-3.5" /> Pause
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void control("resume")} disabled={selected.job.status !== "paused" && selected.job.status !== "failed"}>
                    <Play className="size-3.5" /> Resume
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void control("retry")} disabled={selected.job.status !== "failed"}>
                    <RotateCcw className="size-3.5" /> Retry
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void control("cancel")} disabled={selected.job.status === "cancelled" || selected.job.status === "completed"}>
                    <Square className="size-3.5" /> Cancel
                  </Button>
                  {selected.job.campaign_id ? (
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/dashboard/campaigns/${selected.job.campaign_id}`}>View campaign</Link>
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  ["Discovered", counters?.discovered ?? 0],
                  ["Researched", counters?.researched ?? 0],
                  ["Analyzed", counters?.analyzed ?? 0],
                  ["Demos", counters?.generated ?? 0],
                  ["Deployed", counters?.deployed ?? 0],
                  ["Drafts", counters?.outreachDrafts ?? 0],
                ].map(([label, value]) => (
                  <div key={String(label)} className="surface-card px-3 py-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-1 text-xl font-bold tabular">{value}</p>
                  </div>
                ))}
              </div>

              <ul className="surface-card divide-y">
                {selected.tasks.map((task) => (
                  <li key={task.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.agent}
                        {task.last_error ? ` · ${task.last_error}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs tabular text-muted-foreground">{task.progress}%</span>
                      {statusBadge(task.status)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <h2 className="font-semibold">Activity feed</h2>
          <div className="surface-card max-h-[520px] overflow-y-auto divide-y">
            {activity.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">Events appear here as the agent works.</p>
            ) : (
              activity.map((item) => (
                <p key={item.id} className={`px-4 py-3 text-sm ${item.level === "error" ? "text-red-700" : item.level === "warn" ? "text-amber-800" : ""}`}>
                  <span className="block text-[11px] text-muted-foreground">{item.created_at.slice(11, 19)}</span>
                  {item.message}
                </p>
              ))
            )}
          </div>
          <h2 className="font-semibold">Recent jobs</h2>
          <ul className="surface-card divide-y">
            {jobs.map((row) => (
              <li key={row.job.id}>
                <button
                  type="button"
                  className={`block w-full px-4 py-3 text-left text-sm hover:bg-muted/50 ${selected?.job.id === row.job.id ? "bg-muted/70" : ""}`}
                  onClick={() => setSelectedId(row.job.id)}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="line-clamp-2 font-medium">{row.job.plan.objective}</span>
                    {statusBadge(row.job.status)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Outreach drafts stay in{" "}
            <Link href="/dashboard/outreach" className="font-medium text-primary underline-offset-2 hover:underline">
              Outreach
            </Link>
            . Demos live under{" "}
            <Link href="/dashboard/demos" className="font-medium text-primary underline-offset-2 hover:underline">
              Demo Websites
            </Link>
            .
          </p>
        </aside>
      </div>
    </div>
  );
}
