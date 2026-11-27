import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServiceClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { mutateLocalWorkspace, readLocalWorkspace } from "@/lib/dev/local-workspace";
import { sha256Hex } from "@/lib/mcp/crypto";
import type { CurrentUser } from "@/types";

export type McpOAuthClient = {
  client_id: string;
  client_secret_hash: string | null;
  client_name: string;
  redirect_uris: string[];
  token_endpoint_auth_method: string;
  created_at: string;
};

export type McpToolLog = {
  id: string;
  organization_id: string | null;
  user_id: string | null;
  client_id: string | null;
  tool_name: string;
  ok: boolean;
  error: string | null;
  created_at: string;
};

export type McpConnectionEvent = {
  id: string;
  event_type: string;
  client_id: string | null;
  client_name: string | null;
  detail: string | null;
  created_at: string;
};

type McpLocal = {
  mcpClients: McpOAuthClient[];
  mcpCodes: Array<{
    code_hash: string;
    client_id: string;
    user_id: string;
    organization_id: string;
    redirect_uri: string;
    code_challenge: string;
    expires_at: string;
  }>;
  mcpTokens: Array<{
    token_hash: string;
    client_id: string;
    user_id: string;
    organization_id: string;
    expires_at: string;
    revoked_at: string | null;
  }>;
  mcpToolLogs: McpToolLog[];
  mcpEvents: McpConnectionEvent[];
};

declare module "@/lib/dev/local-workspace" {
  // extended at runtime via normalize
}

function nowIso() {
  return new Date().toISOString();
}

async function db() {
  return (await createSupabaseServiceClient()) ?? (await createSupabaseServerClient());
}

function localSlice(workspace: Awaited<ReturnType<typeof readLocalWorkspace>>): McpLocal {
  const extra = workspace as typeof workspace & Partial<McpLocal>;
  extra.mcpClients ??= [];
  extra.mcpCodes ??= [];
  extra.mcpTokens ??= [];
  extra.mcpToolLogs ??= [];
  extra.mcpEvents ??= [];
  return extra as McpLocal;
}

export async function saveOAuthClient(client: McpOAuthClient) {
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      const slice = localSlice(workspace);
      const index = slice.mcpClients.findIndex((item) => item.client_id === client.client_id);
      if (index >= 0) slice.mcpClients[index] = client;
      else slice.mcpClients.push(client);
    });
    return;
  }
  const supabase = await db();
  const { error } = await supabase!.from("mcp_oauth_clients").upsert(
    {
      client_id: client.client_id,
      client_secret_hash: client.client_secret_hash,
      client_name: client.client_name,
      redirect_uris: client.redirect_uris,
      token_endpoint_auth_method: client.token_endpoint_auth_method,
    },
    { onConflict: "client_id" },
  );
  if (error) throw new Error(error.message);
}

export async function getOAuthClient(clientId: string): Promise<McpOAuthClient | null> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return localSlice(workspace).mcpClients.find((item) => item.client_id === clientId) ?? null;
  }
  const supabase = await db();
  const { data } = await supabase!.from("mcp_oauth_clients").select("*").eq("client_id", clientId).maybeSingle();
  if (!data) return null;
  return {
    client_id: String(data.client_id),
    client_secret_hash: (data.client_secret_hash as string | null) ?? null,
    client_name: String(data.client_name ?? "Custom connector"),
    redirect_uris: Array.isArray(data.redirect_uris) ? (data.redirect_uris as string[]) : [],
    token_endpoint_auth_method: String(data.token_endpoint_auth_method ?? "none"),
    created_at: String(data.created_at),
  };
}

export async function saveAuthCode(input: {
  code: string;
  clientId: string;
  userId: string;
  organizationId: string;
  redirectUri: string;
  codeChallenge: string;
  expiresAt: string;
}) {
  const row = {
    code_hash: sha256Hex(input.code),
    client_id: input.clientId,
    user_id: input.userId,
    organization_id: input.organizationId,
    redirect_uri: input.redirectUri,
    code_challenge: input.codeChallenge,
    expires_at: input.expiresAt,
  };
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      localSlice(workspace).mcpCodes.push(row);
    });
    return;
  }
  const supabase = await db();
  const { error } = await supabase!.from("mcp_oauth_codes").insert(row);
  if (error) throw new Error(error.message);
}

export async function consumeAuthCode(code: string) {
  const hash = sha256Hex(code);
  if (!isSupabaseConfigured()) {
    return mutateLocalWorkspace((workspace) => {
      const slice = localSlice(workspace);
      const index = slice.mcpCodes.findIndex((item) => item.code_hash === hash);
      if (index < 0) return null;
      const [row] = slice.mcpCodes.splice(index, 1);
      return row;
    });
  }
  const supabase = await db();
  const { data } = await supabase!.from("mcp_oauth_codes").select("*").eq("code_hash", hash).maybeSingle();
  if (!data) return null;
  await supabase!.from("mcp_oauth_codes").delete().eq("code_hash", hash);
  return {
    code_hash: hash,
    client_id: String(data.client_id),
    user_id: String(data.user_id),
    organization_id: String(data.organization_id),
    redirect_uri: String(data.redirect_uri),
    code_challenge: String(data.code_challenge),
    expires_at: String(data.expires_at),
  };
}

export async function saveAccessToken(input: {
  token: string;
  clientId: string;
  userId: string;
  organizationId: string;
  expiresAt: string;
}) {
  const row = {
    token_hash: sha256Hex(input.token),
    client_id: input.clientId,
    user_id: input.userId,
    organization_id: input.organizationId,
    expires_at: input.expiresAt,
    revoked_at: null as string | null,
  };
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      localSlice(workspace).mcpTokens.push(row);
    });
    return;
  }
  const supabase = await db();
  const { error } = await supabase!.from("mcp_oauth_tokens").insert({
    token_hash: row.token_hash,
    client_id: row.client_id,
    user_id: row.user_id,
    organization_id: row.organization_id,
    expires_at: row.expires_at,
  });
  if (error) throw new Error(error.message);
}

export async function resolveAccessToken(token: string) {
  const hash = sha256Hex(token);
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    const row = localSlice(workspace).mcpTokens.find((item) => item.token_hash === hash && !item.revoked_at);
    if (!row) return null;
    if (new Date(row.expires_at).getTime() < Date.now()) return null;
    return row;
  }
  const supabase = await db();
  const { data } = await supabase!.from("mcp_oauth_tokens").select("*").eq("token_hash", hash).is("revoked_at", null).maybeSingle();
  if (!data) return null;
  if (new Date(String(data.expires_at)).getTime() < Date.now()) return null;
  return {
    token_hash: hash,
    client_id: String(data.client_id),
    user_id: String(data.user_id),
    organization_id: String(data.organization_id),
    expires_at: String(data.expires_at),
    revoked_at: null,
  };
}

export async function loadUserForToken(userId: string, organizationId: string): Promise<CurrentUser | null> {
  if (!isSupabaseConfigured()) {
    return {
      id: userId,
      email: "local@prospectai.com",
      fullName: "Local operator",
      avatarUrl: null,
      organizationId,
      organizationName: "Local workspace",
      onboardingCompleted: true,
      platformRole: "user",
      isSample: true,
    };
  }
  const supabase = await db();
  const { data } = await supabase!
    .from("profiles")
    .select("id, full_name, email, avatar_url, organization_id, onboarding_completed, platform_role, organizations(name)")
    .eq("id", userId)
    .maybeSingle();
  if (!data) return null;
  const organization = Array.isArray(data.organizations) ? data.organizations[0] : data.organizations;
  const orgId = (data.organization_id as string | null) ?? organizationId;
  if (orgId !== organizationId) return null;
  return {
    id: String(data.id),
    email: String(data.email ?? ""),
    fullName: String(data.full_name ?? "there"),
    avatarUrl: (data.avatar_url as string | null) ?? null,
    organizationId: orgId,
    organizationName: organization?.name ?? null,
    onboardingCompleted: Boolean(data.onboarding_completed),
    platformRole: (data.platform_role as CurrentUser["platformRole"]) ?? "user",
    isSample: false,
  };
}

export async function logToolCall(entry: Omit<McpToolLog, "id" | "created_at">) {
  const row: McpToolLog = { ...entry, id: crypto.randomUUID(), created_at: nowIso() };
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      localSlice(workspace).mcpToolLogs.unshift(row);
    });
    return;
  }
  const supabase = await db();
  await supabase?.from("mcp_tool_logs").insert({
    organization_id: row.organization_id,
    user_id: row.user_id,
    client_id: row.client_id,
    tool_name: row.tool_name,
    ok: row.ok,
    error: row.error,
  });
}

export async function logConnectionEvent(entry: Omit<McpConnectionEvent, "id" | "created_at">) {
  const row: McpConnectionEvent = { ...entry, id: crypto.randomUUID(), created_at: nowIso() };
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      localSlice(workspace).mcpEvents.unshift(row);
    });
    return;
  }
  const supabase = await db();
  await supabase?.from("mcp_connection_events").insert({
    event_type: row.event_type,
    client_id: row.client_id,
    client_name: row.client_name,
    detail: row.detail,
  });
}

export async function listToolLogs(limit = 20): Promise<McpToolLog[]> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return localSlice(workspace).mcpToolLogs.slice(0, limit);
  }
  const supabase = await db();
  const { data } = await supabase!.from("mcp_tool_logs").select("*").order("created_at", { ascending: false }).limit(limit);
  return (data ?? []).map((row) => ({
    id: String(row.id),
    organization_id: (row.organization_id as string | null) ?? null,
    user_id: (row.user_id as string | null) ?? null,
    client_id: (row.client_id as string | null) ?? null,
    tool_name: String(row.tool_name),
    ok: Boolean(row.ok),
    error: (row.error as string | null) ?? null,
    created_at: String(row.created_at),
  }));
}

export async function listConnectionEvents(limit = 20): Promise<McpConnectionEvent[]> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return localSlice(workspace).mcpEvents.slice(0, limit);
  }
  const supabase = await db();
  const { data } = await supabase!.from("mcp_connection_events").select("*").order("created_at", { ascending: false }).limit(limit);
  return (data ?? []).map((row) => ({
    id: String(row.id),
    event_type: String(row.event_type),
    client_id: (row.client_id as string | null) ?? null,
    client_name: (row.client_name as string | null) ?? null,
    detail: (row.detail as string | null) ?? null,
    created_at: String(row.created_at),
  }));
}
