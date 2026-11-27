import { NextResponse } from "next/server";
import { runWithActor } from "@/lib/auth/actor-context";
import { authenticateMcpRequest, wwwAuthenticateHeader } from "@/lib/mcp/oauth";
import { CORS_HEADERS } from "@/lib/mcp/protocol";
import { handleMcpSdkRequest } from "@/lib/mcp/sdk-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function withCors(response: NextResponse) {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => response.headers.set(key, value));
  return response;
}

function unauthorized() {
  const response = NextResponse.json(
    { error: "Unauthorized", hint: "Complete ProspectAI OAuth for this MCP connector. This is not an xAI API key." },
    { status: 401 },
  );
  response.headers.set("WWW-Authenticate", wwwAuthenticateHeader());
  return withCors(response);
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

async function handle(request: Request) {
  const auth = await authenticateMcpRequest(request);
  if (!auth) return unauthorized();
  return runWithActor({ user: auth.user, privileged: true }, () => handleMcpSdkRequest(request, auth.user, auth.clientId));
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}

export async function DELETE(request: Request) {
  return handle(request);
}
