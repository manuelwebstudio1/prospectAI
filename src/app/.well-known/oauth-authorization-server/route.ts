import { NextResponse } from "next/server";
import { authorizationServerMetadata } from "@/lib/mcp/oauth";
import { CORS_HEADERS } from "@/lib/mcp/protocol";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  return NextResponse.json(authorizationServerMetadata(), { headers: CORS_HEADERS });
}
