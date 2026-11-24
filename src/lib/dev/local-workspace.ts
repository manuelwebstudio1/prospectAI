import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  ActivityLogRecord,
  AiUsageRecord,
  BusinessRecord,
  CampaignJobRecord,
  CampaignRecord,
  InspectionRecord,
  LeadNoteRecord,
  LeadRecord,
  LocalSubscriptionRecord,
  OutreachEventRecord,
  OutreachMessageRecord,
  PaymentRecord,
  PlanOverride,
  PlatformSettings,
  ResearchRecord,
  WebhookEventRecord,
} from "@/services/workspace/types";
import type { DemoWebsiteRecord } from "@/services/demos/types";

export type CreditBucket = { remaining: number; allocated: number };

export type LocalCredits = {
  discovery: CreditBucket;
  research: CreditBucket;
  website_generation: CreditBucket;
  outreach: CreditBucket;
};

export type LocalWorkspace = {
  campaigns: CampaignRecord[];
  jobs: CampaignJobRecord[];
  businesses: BusinessRecord[];
  inspections: InspectionRecord[];
  leads: LeadRecord[];
  research: ResearchRecord[];
  demos: DemoWebsiteRecord[];
  outreach: OutreachMessageRecord[];
  outreachEvents: OutreachEventRecord[];
  notes: LeadNoteRecord[];
  payments: PaymentRecord[];
  subscription: LocalSubscriptionRecord | null;
  webhookEvents: WebhookEventRecord[];
  aiUsage: AiUsageRecord[];
  credits: LocalCredits;
  activityLogs: ActivityLogRecord[];
  suspendedUserIds: string[];
  platformSettings: PlatformSettings;
  planOverrides: Partial<Record<string, PlanOverride>>;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "workspace.json");

const defaultCredits = (): LocalCredits => ({
  discovery: { remaining: 10000, allocated: 10000 },
  research: { remaining: 2000, allocated: 2000 },
  website_generation: { remaining: -1, allocated: -1 },
  outreach: { remaining: 1000, allocated: 1000 },
});

const empty = (): LocalWorkspace => ({
  campaigns: [],
  jobs: [],
  businesses: [],
  inspections: [],
  leads: [],
  research: [],
  demos: [],
  outreach: [],
  outreachEvents: [],
  notes: [],
  payments: [],
  subscription: null,
  webhookEvents: [],
  aiUsage: [],
  credits: defaultCredits(),
  activityLogs: [],
  suspendedUserIds: [],
  platformSettings: { trial_days: 14, default_plan: "starter" },
  planOverrides: {},
});

let chain: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function normalizeCredits(raw: unknown): LocalCredits {
  const defaults = defaultCredits();
  if (!raw || typeof raw !== "object") return defaults;
  const value = raw as Record<string, unknown>;
  if ("discovery" in value) {
    return { ...defaults, ...(value as Partial<LocalCredits>) };
  }
  if ("remaining" in value && "allocated" in value) {
    return { ...defaults, discovery: value as CreditBucket };
  }
  return defaults;
}

async function readWorkspace(): Promise<LocalWorkspace> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalWorkspace>;
    return {
      ...empty(),
      ...parsed,
      research: parsed.research ?? [],
      demos: parsed.demos ?? [],
      outreach: parsed.outreach ?? [],
      outreachEvents: parsed.outreachEvents ?? [],
      notes: parsed.notes ?? [],
      payments: parsed.payments ?? [],
      subscription: parsed.subscription ?? null,
      webhookEvents: parsed.webhookEvents ?? [],
      aiUsage: parsed.aiUsage ?? [],
      credits: normalizeCredits(parsed.credits),
      activityLogs: parsed.activityLogs ?? [],
      suspendedUserIds: parsed.suspendedUserIds ?? [],
      platformSettings: parsed.platformSettings ?? { trial_days: 14, default_plan: "starter" },
      planOverrides: parsed.planOverrides ?? {},
    };
  } catch {
    return empty();
  }
}

async function writeWorkspace(data: LocalWorkspace) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

export function mutateLocalWorkspace<T>(
  fn: (workspace: LocalWorkspace) => T | Promise<T>,
): Promise<T> {
  return withLock(async () => {
    const workspace = await readWorkspace();
    const result = await fn(workspace);
    await writeWorkspace(workspace);
    return result;
  });
}

export function readLocalWorkspace(): Promise<LocalWorkspace> {
  return withLock(() => readWorkspace());
}
