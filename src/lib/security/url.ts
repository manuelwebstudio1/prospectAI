/**
 * SSRF-safe URL checks for website inspection (Phase 2+).
 * Never fetch loopback, link-local, or cloud metadata endpoints.
 */
const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
  "169.254.169.254",
]);

export function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.+$/, "");
  if (BLOCKED_HOSTS.has(host)) return true;
  if (host.endsWith(".local") || host.endsWith(".internal")) return true;
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) return true;
  if (host.startsWith("169.254.")) return true;
  return false;
}

export function assertPublicHttpUrl(raw: string): URL {
  const url = new URL(raw);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs can be inspected.");
  }
  if (isBlockedHost(url.hostname)) {
    throw new Error("This host is not allowed for website inspection.");
  }
  return url;
}
