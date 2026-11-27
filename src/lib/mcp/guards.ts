import type { CurrentUser } from "@/types";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 40;
const buckets = new Map<string, { count: number; resetAt: number }>();

const BLOCKED_TOOLS = new Set([
  "send_outreach",
  "send_message",
  "send_email",
  "send_whatsapp",
  "charge_customer",
  "create_payment",
  "update_platform_settings",
  "delete_organization",
  "delete_workspace",
]);

export class McpAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "McpAuthorizationError";
  }
}

export function assertToolAllowed(name: string) {
  if (BLOCKED_TOOLS.has(name) || /^(send_|charge_|delete_org)/.test(name)) {
    throw new McpAuthorizationError(
      `${name} is not available to Grok Bot. External messages, payments and destructive account changes require a human in the ProspectAI UI.`,
    );
  }
}

export function assertRateLimit(user: CurrentUser) {
  const key = user.organizationId ?? user.id;
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  if (bucket.count >= MAX_PER_WINDOW) {
    throw new McpAuthorizationError("Rate limit exceeded for this workspace. Wait a minute and retry.");
  }
  bucket.count += 1;
}

export function requireOrganization(user: CurrentUser) {
  if (!user.organizationId) {
    throw new McpAuthorizationError("This connector token is not bound to a ProspectAI workspace.");
  }
  return user.organizationId;
}
