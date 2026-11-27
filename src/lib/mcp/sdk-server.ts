import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { MCP_TOOL_DEFS, executeMcpTool } from "@/lib/mcp/tools";
import { logToolCall } from "@/lib/mcp/store";
import { CORS_HEADERS } from "@/lib/mcp/protocol";
import type { CurrentUser } from "@/types";

export function createProspectAiMcpServer(user: CurrentUser, clientId: string) {
  const server = new McpServer(
    { name: "prospectai", version: "0.1.0", title: "ProspectAI Autonomous Agent" },
    {
      instructions:
        "You are connected to one ProspectAI workspace. Use only these tools. Never send outreach, charge cards, or change platform settings. Long-running discovery returns a jobId — poll get_job_status. Grok Bot is ProspectAI Autonomous Agent.",
      capabilities: { tools: {} },
    },
  );

  for (const tool of MCP_TOOL_DEFS) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.schema,
      },
      async (args: Record<string, unknown>) => {
        try {
          const output = await executeMcpTool(tool.name, args, user);
          await logToolCall({
            organization_id: user.organizationId,
            user_id: user.id,
            client_id: clientId,
            tool_name: tool.name,
            ok: true,
            error: null,
          });
          return { content: [{ type: "text" as const, text: output }] };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Tool failed.";
          await logToolCall({
            organization_id: user.organizationId,
            user_id: user.id,
            client_id: clientId,
            tool_name: tool.name,
            ok: false,
            error: message,
          });
          return { content: [{ type: "text" as const, text: message }], isError: true };
        }
      },
    );
  }

  return server;
}

function withCors(response: Response) {
  const headers = new Headers(response.headers);
  Object.entries(CORS_HEADERS).forEach(([key, value]) => headers.set(key, value));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export async function handleMcpSdkRequest(request: Request, user: CurrentUser, clientId: string) {
  const server = createProspectAiMcpServer(user, clientId);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  const authInfo: AuthInfo = {
    token: "bound",
    clientId,
    scopes: ["mcp"],
    extra: { userId: user.id, organizationId: user.organizationId ?? "" },
  };
  const response = await transport.handleRequest(request, { authInfo });
  return withCors(response);
}
