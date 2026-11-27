import { NextResponse } from "next/server";
import { grokBotReply } from "@/lib/chat/grok-bot";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { message?: unknown } | null;
  const message = typeof body?.message === "string" ? body.message.slice(0, 2000) : "";
  return NextResponse.json({ reply: grokBotReply(message) });
}
