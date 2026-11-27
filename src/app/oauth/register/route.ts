import { NextResponse } from "next/server";
import { registerClient } from "@/lib/mcp/oauth";
import { CORS_HEADERS } from "@/lib/mcp/protocol";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "invalid_client_metadata" }, { status: 400, headers: CORS_HEADERS });
  try {
    const client = await registerClient(body);
    return NextResponse.json(client, { status: 201, headers: CORS_HEADERS });
  } catch (error) {
    return NextResponse.json(
      { error: "invalid_redirect_uri", error_description: error instanceof Error ? error.message : "Registration failed." },
      { status: 400, headers: CORS_HEADERS },
    );
  }
}
