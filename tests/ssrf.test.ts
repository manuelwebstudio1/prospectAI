import { describe, expect, it } from "vitest";
import { assertPublicHttpUrl, isPrivateIp, normalizeWebsiteUrl } from "@/lib/security/ssrf";

describe("assertPublicHttpUrl", () => {
  it("accepts a public https URL", () => {
    expect(assertPublicHttpUrl("https://example.com/page").hostname).toBe("example.com");
  });

  it("rejects non-http schemes", () => {
    expect(() => assertPublicHttpUrl("file:///etc/passwd")).toThrow(/http/i);
    expect(() => assertPublicHttpUrl("ftp://example.com")).toThrow(/http/i);
  });

  it("rejects localhost and metadata hosts", () => {
    expect(() => assertPublicHttpUrl("http://localhost/admin")).toThrow();
    expect(() => assertPublicHttpUrl("http://127.0.0.1/")).toThrow();
    expect(() => assertPublicHttpUrl("http://169.254.169.254/latest/meta-data")).toThrow();
    expect(() => assertPublicHttpUrl("http://metadata.google.internal/")).toThrow();
  });

  it("rejects URLs with credentials", () => {
    expect(() => assertPublicHttpUrl("https://user:pass@example.com")).toThrow(/credentials/i);
  });

  it("rejects private IPv4 literals", () => {
    expect(() => assertPublicHttpUrl("http://192.168.1.10/")).toThrow(/private/i);
    expect(() => assertPublicHttpUrl("http://10.0.0.4/")).toThrow(/private/i);
  });
});

describe("isPrivateIp", () => {
  it("flags loopback, RFC1918 and link-local", () => {
    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(isPrivateIp("10.1.2.3")).toBe(true);
    expect(isPrivateIp("172.16.0.1")).toBe(true);
    expect(isPrivateIp("192.168.0.1")).toBe(true);
    expect(isPrivateIp("169.254.1.1")).toBe(true);
  });

  it("allows public addresses", () => {
    expect(isPrivateIp("8.8.8.8")).toBe(false);
    expect(isPrivateIp("1.1.1.1")).toBe(false);
  });
});

describe("normalizeWebsiteUrl", () => {
  it("adds https and strips a trailing slash on the origin", () => {
    expect(normalizeWebsiteUrl("example.com")).toBe("https://example.com");
  });

  it("returns null for empty or invalid values", () => {
    expect(normalizeWebsiteUrl("")).toBeNull();
    expect(normalizeWebsiteUrl("not a url")).toBeNull();
  });
});
