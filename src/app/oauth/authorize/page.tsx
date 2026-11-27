import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isAllowedRedirectUri } from "@/lib/mcp/redirects";
import { AuthorizeForm } from "@/components/mcp/authorize-form";

export const dynamic = "force-dynamic";

export default async function AuthorizePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const read = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const clientId = read("client_id") ?? "";
  const redirectUri = read("redirect_uri") ?? "";
  const state = read("state") ?? "";
  const challenge = read("code_challenge") ?? "";
  const method = read("code_challenge_method") ?? "S256";
  const responseType = read("response_type") ?? "code";

  const error =
    !clientId || !redirectUri
      ? "client_id and redirect_uri are required."
      : responseType !== "code"
        ? "Only response_type=code is supported."
        : method !== "S256"
          ? "PKCE S256 is required."
          : !challenge
            ? "code_challenge is required."
            : !isAllowedRedirectUri(redirectUri)
              ? "This redirect URI is not allowed for the ProspectAI connector."
              : null;

  const user = await getCurrentUser();
  if (!user) {
    const next = `/oauth/authorize?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
      code_challenge: challenge,
      code_challenge_method: method,
      response_type: responseType,
    }).toString()}`;
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">ProspectAI connector</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">Allow Grok Bot to use this workspace?</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This is ProspectAI OAuth for the MCP connector. It is not an xAI API key. The bot can start discovery, research,
        demos and outreach drafts for <strong>{user.organizationName ?? "your workspace"}</strong>. It cannot send
        messages until you approve them in ProspectAI.
      </p>
      {error ? (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : (
        <AuthorizeForm
          clientId={clientId}
          redirectUri={redirectUri}
          state={state}
          codeChallenge={challenge}
          email={user.email}
        />
      )}
    </div>
  );
}
