import { env } from "@/lib/env";

export function isAllowedRedirectUri(uri: string) {
  if (uri === "cursor://anysphere.cursor-mcp/oauth/callback") return true;
  try {
    const url = new URL(uri);
    if (!["http:", "https:"].includes(url.protocol)) return false;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") return true;
    if (host === "cursor.com" || host === "www.cursor.com") return true;
    if (host === "grok.com" || host.endsWith(".grok.com")) return true;
    if (host === "x.ai" || host.endsWith(".x.ai")) return true;
    const appHost = new URL(env.appUrl).hostname.toLowerCase();
    return host === appHost;
  } catch {
    return false;
  }
}
