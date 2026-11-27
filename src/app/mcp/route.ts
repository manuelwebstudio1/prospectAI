import { NextResponse } from "next/server";
import { runWithActor } from "@/lib/auth/actor-context";
import { authenticateMcpRequest, wwwAuthenticateHeader } from "@/lib/mcp/oauth";
import { CORS_HEADERS, handleJsonRpc } from "@/lib/mcp/protocol";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function withCors(response: NextResponse) {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => response.headers.set(key, value));
  return response;
}

function unauthorized() {
  const response = NextResponse.json(
    { error: "Unauthorized", hint: "Complete OAuth for the ProspectAI MCP connector. This is not an xAI API key." },
    { status: 401 },
  );
  response.headers.set("WWW-Authenticate", wwwAuthenticateHeader());
  return withCors(response);
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET() {
  return unauthorized();
}

export async function DELETE() {
  return unauthorized();
}

export async function POST(request: Request) {
  const auth = await authenticateMcpRequest(request);
  if (!auth) return unauthorized();

  const payload = (await request.json().catch(() => null)) as
    | { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> }
    | Array<unknown>
    | null;
  if (!payload || Array.isArray(payload)) {
    return withCors(NextResponse.json({ jsonrpc: "2.0", error: { code: -32600, message: "Invalid JSON-RPC batch." } }, { status: 400 }));
  }

  const result = await runWithActor({ user: auth.user, privileged: true }, () => handleJsonRpc(payload, auth.user, auth.clientId));
  if (!result) return withCors(new NextResponse(null, { status: 202 }));
  return withCors(NextResponse.json(result));
}
