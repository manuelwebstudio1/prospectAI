import { env } from "@/lib/env";
import { isAllowedRedirectUri } from "@/lib/mcp/redirects";
import { randomToken, sha256Base64Url, sha256Hex, safeEqual } from "@/lib/mcp/crypto";
import {
  consumeAuthCode,
  getOAuthClient,
  loadUserForToken,
  logConnectionEvent,
  resolveAccessToken,
  saveAccessToken,
  saveAuthCode,
  saveOAuthClient,
} from "@/lib/mcp/store";
import type { CurrentUser } from "@/types";

export const MCP_SCOPES = "mcp";

export function issuerUrl() {
  return env.appUrl.replace(/\/$/, "");
}

export function mcpResourceUrl() {
  return `${issuerUrl()}/mcp`;
}

export function authorizationServerMetadata() {
  const issuer = issuerUrl();
  return {
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    registration_endpoint: `${issuer}/oauth/register`,
    scopes_supported: [MCP_SCOPES],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_post", "client_secret_basic"],
    client_id_issued_at_supported: true,
  };
}

export function protectedResourceMetadata() {
  const resource = mcpResourceUrl();
  return {
    resource,
    authorization_servers: [issuerUrl()],
    bearer_methods_supported: ["header"],
    scopes_supported: [MCP_SCOPES],
  };
}

export function wwwAuthenticateHeader() {
  return `Bearer realm="ProspectAI", resource_metadata="${issuerUrl()}/.well-known/oauth-protected-resource"`;
}

export async function registerClient(body: Record<string, unknown>) {
  const redirectUris = Array.isArray(body.redirect_uris) ? body.redirect_uris.map(String) : [];
  if (!redirectUris.length || redirectUris.some((uri) => !isAllowedRedirectUri(uri))) {
    throw new Error("redirect_uris must be present and use an allowed Grok Bot / Cursor / app callback.");
  }
  const clientId = `pa_${randomToken(16)}`;
  const confidential = body.token_endpoint_auth_method === "client_secret_post" || body.token_endpoint_auth_method === "client_secret_basic";
  const secret = confidential ? randomToken(24) : null;
  await saveOAuthClient({
    client_id: clientId,
    client_secret_hash: secret ? sha256Hex(secret) : null,
    client_name: String(body.client_name ?? "Grok Bot custom connector"),
    redirect_uris: redirectUris,
    token_endpoint_auth_method: confidential ? String(body.token_endpoint_auth_method) : "none",
    created_at: new Date().toISOString(),
  });
  await logConnectionEvent({
    event_type: "client_registered",
    client_id: clientId,
    client_name: String(body.client_name ?? "Grok Bot custom connector"),
    detail: "Dynamic client registration. This is not yet a verified Grok Bot session.",
  });
  return {
    client_id: clientId,
    client_secret: secret ?? undefined,
    client_name: String(body.client_name ?? "Grok Bot custom connector"),
    redirect_uris: redirectUris,
    token_endpoint_auth_method: confidential ? String(body.token_endpoint_auth_method) : "none",
    grant_types: ["authorization_code"],
    response_types: ["code"],
  };
}

export async function issueAuthorizationCode(input: {
  user: CurrentUser;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string | null;
}) {
  if (!input.user.organizationId) throw new Error("Complete onboarding before connecting Grok Bot.");
  if (!isAllowedRedirectUri(input.redirectUri)) throw new Error("This redirect URI is not allowed.");
  const client = await getOAuthClient(input.clientId);
  if (!client && input.clientId !== env.mcp.oauthClientId) {
    throw new Error("Unknown OAuth client. Register the connector or use the ProspectAI client id from Admin → Integrations.");
  }
  if (client && client.redirect_uris.length && !client.redirect_uris.includes(input.redirectUri)) {
    throw new Error("redirect_uri does not match the registered client.");
  }
  const code = randomToken(32);
  await saveAuthCode({
    code,
    clientId: input.clientId,
    userId: input.user.id,
    organizationId: input.user.organizationId,
    redirectUri: input.redirectUri,
    codeChallenge: input.codeChallenge,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });
  const url = new URL(input.redirectUri);
  url.searchParams.set("code", code);
  if (input.state) url.searchParams.set("state", input.state);
  return url.toString();
}

function parseBasicClient(header: string | null) {
  if (!header?.startsWith("Basic ")) return null;
  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const [clientId, clientSecret] = decoded.split(":");
    return { clientId, clientSecret };
  } catch {
    return null;
  }
}

export async function exchangeAuthorizationCode(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const params = contentType.includes("json")
    ? new URLSearchParams(Object.entries((await request.json()) as Record<string, string>).map(([key, value]) => [key, String(value)]))
    : new URLSearchParams(await request.text());
  const basic = parseBasicClient(request.headers.get("authorization"));
  const clientId = params.get("client_id") ?? basic?.clientId;
  const clientSecret = params.get("client_secret") ?? basic?.clientSecret ?? null;
  const code = params.get("code");
  const redirectUri = params.get("redirect_uri");
  const verifier = params.get("code_verifier");
  if (!clientId || !code || !redirectUri || !verifier) {
    throw new Error("code, client_id, redirect_uri and code_verifier are required.");
  }
  const client = await getOAuthClient(clientId);
  if (client?.client_secret_hash) {
    if (!clientSecret || !safeEqual(client.client_secret_hash, sha256Hex(clientSecret))) {
      throw new Error("Invalid client secret.");
    }
  } else if (env.mcp.oauthClientId && clientId === env.mcp.oauthClientId && env.mcp.oauthClientSecret) {
    if (!clientSecret || !safeEqual(sha256Hex(env.mcp.oauthClientSecret), sha256Hex(clientSecret))) {
      throw new Error("Invalid client secret.");
    }
  }
  const saved = await consumeAuthCode(code);
  if (!saved) throw new Error("Invalid or expired authorization code.");
  if (saved.client_id !== clientId || saved.redirect_uri !== redirectUri) {
    throw new Error("Authorization code does not match this client.");
  }
  if (new Date(saved.expires_at).getTime() < Date.now()) throw new Error("Authorization code expired.");
  if (sha256Base64Url(verifier) !== saved.code_challenge) throw new Error("PKCE verification failed.");
  const token = `pa_mcp_${randomToken(32)}`;
  await saveAccessToken({
    token,
    clientId,
    userId: saved.user_id,
    organizationId: saved.organization_id,
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  });
  await logConnectionEvent({
    event_type: "token_issued",
    client_id: clientId,
    client_name: client?.client_name ?? "Custom connector",
    detail: "OAuth access token issued. Complete a tool call in Grok Bot before treating the bot as connected.",
  });
  return {
    access_token: token,
    token_type: "Bearer",
    expires_in: 8 * 60 * 60,
    scope: MCP_SCOPES,
  };
}

export async function authenticateMcpRequest(request: Request): Promise<{ user: CurrentUser; clientId: string } | null> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  if (!token) return null;
  const row = await resolveAccessToken(token);
  if (!row) return null;
  const user = await loadUserForToken(row.user_id, row.organization_id);
  if (!user?.organizationId) return null;
  return { user, clientId: row.client_id };
}
