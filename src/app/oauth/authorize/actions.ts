"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { issueAuthorizationCode } from "@/lib/mcp/oauth";

export type AuthorizeState = { error: string } | null;

export async function authorizeConnectorAction(_prev: AuthorizeState, formData: FormData): Promise<AuthorizeState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };
  let location: string;
  try {
    location = await issueAuthorizationCode({
      user,
      clientId: String(formData.get("client_id") ?? ""),
      redirectUri: String(formData.get("redirect_uri") ?? ""),
      codeChallenge: String(formData.get("code_challenge") ?? ""),
      state: String(formData.get("state") ?? "") || null,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not authorize the connector." };
  }
  redirect(location);
}
