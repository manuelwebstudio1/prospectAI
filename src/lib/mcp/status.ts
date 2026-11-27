import { env, isSupabaseConfigured } from "@/lib/env";
import { MCP_TOOLS } from "@/lib/mcp/tools";
import { listConnectionEvents, listToolLogs } from "@/lib/mcp/store";
import { mcpResourceUrl } from "@/lib/mcp/oauth";

export async function getGrokBotConnectorStatus() {
  const [events, logs] = await Promise.all([listConnectionEvents(10), listToolLogs(10)]);
  const lastToken = events.find((item) => item.event_type === "token_issued");
  const lastInit = events.find((item) => item.event_type === "mcp_initialize");
  const lastError = logs.find((item) => !item.ok) ?? events.find((item) => item.event_type === "error");
  const lastTool = logs[0] ?? null;
  const lastSuccess = logs.find((item) => item.ok) ?? lastInit ?? lastToken ?? null;

  return {
    mcpServer: "ready" as const,
    mcpUrl: mcpResourceUrl(),
    oauthAuthorize: `${env.appUrl.replace(/\/$/, "")}/oauth/authorize`,
    oauthMetadata: `${env.appUrl.replace(/\/$/, "")}/.well-known/oauth-authorization-server`,
    connectorConfigured: true,
    oauthClientIdConfigured: Boolean(env.mcp.oauthClientId),
    supabaseReady: isSupabaseConfigured() && Boolean(env.supabase.serviceRoleKey),
    grokBotVerified: false,
    authentication: "OAuth 2.1 with PKCE. Unauthenticated MCP calls are rejected.",
    tools: MCP_TOOLS.map((tool) => tool.name),
    lastSuccessfulConnection: lastSuccess
      ? { at: "created_at" in lastSuccess ? lastSuccess.created_at : null, label: "tool_name" in lastSuccess ? lastSuccess.tool_name : lastInit?.event_type ?? lastToken?.event_type }
      : null,
    lastToolExecution: lastTool,
    lastError: lastError
      ? {
          at: "created_at" in lastError ? lastError.created_at : null,
          message: "error" in lastError ? lastError.error : lastError.detail,
        }
      : null,
    events,
  };
}
