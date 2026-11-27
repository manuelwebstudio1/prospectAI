import { MCP_TOOLS, executeMcpTool } from "@/lib/mcp/tools";
import { logConnectionEvent, logToolCall } from "@/lib/mcp/store";
import type { CurrentUser } from "@/types";

type Rpc = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

function ok(id: Rpc["id"], result: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

function fail(id: Rpc["id"], code: number, message: string) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

export async function handleJsonRpc(message: Rpc, user: CurrentUser, clientId: string) {
  const method = message.method ?? "";
  const id = message.id ?? null;

  if (method === "initialize") {
    await logConnectionEvent({
      event_type: "mcp_initialize",
      client_id: clientId,
      client_name: "MCP client",
      detail: "Authenticated MCP initialize. Not treated as a verified Grok Bot connection.",
    });
    return ok(id, {
      protocolVersion: "2025-03-26",
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "prospectai", version: "0.1.0", title: "ProspectAI" },
      instructions:
        "You are connected to a ProspectAI workspace. Use tools only for this authenticated organization. Never send outreach. Long-running discovery continues in the background after discover_businesses returns.",
    });
  }

  if (method === "notifications/initialized" || method === "notifications/cancelled") {
    return null;
  }

  if (method === "ping") return ok(id, {});

  if (method === "tools/list") {
    return ok(id, {
      tools: MCP_TOOLS.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    });
  }

  if (method === "tools/call") {
    const name = String(message.params?.name ?? "");
    const args = (message.params?.arguments ?? {}) as unknown;
    try {
      const output = await executeMcpTool(name, args, user);
      await logToolCall({
        organization_id: user.organizationId,
        user_id: user.id,
        client_id: clientId,
        tool_name: name,
        ok: true,
        error: null,
      });
      return ok(id, { content: [{ type: "text", text: output }], isError: false });
    } catch (error) {
      const text = error instanceof Error ? error.message : "Tool failed.";
      await logToolCall({
        organization_id: user.organizationId,
        user_id: user.id,
        client_id: clientId,
        tool_name: name || "unknown",
        ok: false,
        error: text,
      });
      return ok(id, { content: [{ type: "text", text }], isError: true });
    }
  }

  return fail(id, -32601, `Method not found: ${method}`);
}

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, MCP-Protocol-Version, Mcp-Session-Id",
  "Access-Control-Expose-Headers": "WWW-Authenticate, MCP-Protocol-Version",
};
