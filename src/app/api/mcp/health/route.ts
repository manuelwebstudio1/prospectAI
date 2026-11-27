import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { MCP_TOOLS } from "@/lib/mcp/tools";
import { listConnectionEvents, listToolLogs } from "@/lib/mcp/store";
import { mcpResourceUrl } from "@/lib/mcp/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [events, logs] = await Promise.all([listConnectionEvents(5), listToolLogs(5)]);
  const lastInit = events.find((item) => item.event_type === "mcp_initialize" || item.event_type === "token_issued");
  const lastTool = logs[0] ?? null;
  return NextResponse.json({
    ok: true,
    transport: "streamable-http",
    sdk: "@modelcontextprotocol/sdk",
    resource: mcpResourceUrl(),
    authorization: `${env.appUrl.replace(/\/$/, "")}/oauth/authorize`,
    grokBotVerified: false,
    grokBotNote:
      "Grok Bot is not marked connected until you add this server in the Grok Bot desktop app (Connect apps → Add a custom connector) and complete OAuth. Implementing the MCP server is not a completed Grok Bot connection.",
    tools: MCP_TOOLS.map((tool) => tool.name),
    lastMcpEvent: lastInit
      ? { type: lastInit.event_type, at: lastInit.created_at, client: lastInit.client_name }
      : null,
    lastToolExecution: lastTool
      ? { tool: lastTool.tool_name, ok: lastTool.ok, at: lastTool.created_at, error: lastTool.error }
      : null,
  });
}
