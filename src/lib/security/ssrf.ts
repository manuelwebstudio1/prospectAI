import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "169.254.169.254",
  "metadata.google.internal",
  "metadata.google.com",
  "instance-data",
]);

function ipv4ToInt(ip: string): number {
  const parts = ip.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return -1;
  }
  return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

function inCidr(ip: string, cidr: string): boolean {
  const [range, bitsRaw] = cidr.split("/");
  const bits = Number(bitsRaw);
  const ipInt = ipv4ToInt(ip);
  const rangeInt = ipv4ToInt(range);
  if (ipInt < 0 || rangeInt < 0) return false;
  const mask = bits === 0 ? 0 : (~(2 ** (32 - bits) - 1)) >>> 0;
  return (ipInt & mask) === (rangeInt & mask);
}

export function isPrivateIp(address: string): boolean {
  const ip = address.replace(/^::ffff:/, "");
  if (ip.includes(":")) {
    const normalized = ip.toLowerCase();
    return (
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80")
    );
  }
  return (
    inCidr(ip, "0.0.0.0/8") ||
    inCidr(ip, "10.0.0.0/8") ||
    inCidr(ip, "127.0.0.0/8") ||
    inCidr(ip, "169.254.0.0/16") ||
    inCidr(ip, "172.16.0.0/12") ||
    inCidr(ip, "192.168.0.0/16")
  );
}

export function assertPublicHttpUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Invalid URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs can be inspected.");
  }
  if (url.username || url.password) {
    throw new Error("URLs with credentials cannot be inspected.");
  }
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    BLOCKED_HOSTS.has(hostname) ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local")
  ) {
    throw new Error("This host cannot be inspected.");
  }
  if (isIP(hostname) && isPrivateIp(hostname)) {
    throw new Error("Private network hosts cannot be inspected.");
  }
  return url;
}

export async function assertResolvesPublic(url: URL): Promise<void> {
  if (isIP(url.hostname)) {
    if (isPrivateIp(url.hostname)) {
      throw new Error("Private network hosts cannot be inspected.");
    }
    return;
  }
  const { address } = await lookup(url.hostname);
  if (isPrivateIp(address)) {
    throw new Error("This host resolved to a private address and cannot be inspected.");
  }
}

export function normalizeWebsiteUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const withProtocol = raw.startsWith("http://") || raw.startsWith("https://") ? raw.trim() : `https://${raw.trim()}`;
  try {
    const url = new URL(withProtocol);
    url.hash = "";
    if (url.pathname === "/") url.pathname = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}
