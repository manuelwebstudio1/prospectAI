import { describe, expect, it } from "vitest";
import { isAllowedRedirectUri } from "@/lib/mcp/redirects";
import { sha256Base64Url } from "@/lib/mcp/crypto";
import { MCP_TOOLS } from "@/lib/mcp/tools";
import { getAiStatus } from "@/lib/ai/provider";

describe("Grok Bot MCP connector", () => {
  it("allows Grok Bot / Cursor connector callbacks and rejects arbitrary hosts", () => {
    expect(isAllowedRedirectUri("cursor://anysphere.cursor-mcp/oauth/callback")).toBe(true);
    expect(isAllowedRedirectUri("https://www.cursor.com/agents/mcp/oauth/callback")).toBe(true);
    expect(isAllowedRedirectUri("https://grok.com/oauth/callback")).toBe(true);
    expect(isAllowedRedirectUri("http://localhost:8787/callback")).toBe(true);
    expect(isAllowedRedirectUri("https://evil.example/steal")).toBe(false);
  });

  it("exposes the acquisition tools without a send-message tool", () => {
    const names = MCP_TOOLS.map((tool) => tool.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "discover_businesses",
        "research_business",
        "inspect_website",
        "score_opportunity",
        "generate_website_demo",
        "deploy_website_demo",
        "list_campaigns",
        "get_campaign_progress",
        "prepare_outreach_draft",
      ]),
    );
    expect(names.some((name) => /send/i.test(name))).toBe(false);
  });

  it("uses S256 PKCE hashing", () => {
    expect(sha256Base64Url("verifier")).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe("optional xAI adapter", () => {
  it("does not treat a leftover GROK_API_KEY as a required or default Grok Bot connection", () => {
    const status = getAiStatus();
    expect(status.xaiAdapter).toBe(false);
    expect(["openai", "none", "xai"]).toContain(status.provider);
  });
});
