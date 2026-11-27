import { NextResponse } from "next/server";
import { exchangeAuthorizationCode } from "@/lib/mcp/oauth";
import { CORS_HEADERS } from "@/lib/mcp/protocol";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    const token = await exchangeAuthorizationCode(request);
    return NextResponse.json(token, { headers: CORS_HEADERS });
  } catch (error) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: error instanceof Error ? error.message : "Token exchange failed." },
      { status: 400, headers: CORS_HEADERS },
    );
  }
}
