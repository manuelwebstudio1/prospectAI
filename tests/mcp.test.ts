import { describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { isAllowedRedirectUri } from "@/lib/mcp/redirects";
import { sha256Base64Url } from "@/lib/mcp/crypto";
import { MCP_TOOLS, executeMcpTool } from "@/lib/mcp/tools";
import { createProspectAiMcpServer } from "@/lib/mcp/sdk-server";
import { assertToolAllowed, McpAuthorizationError, requireOrganization } from "@/lib/mcp/guards";
import { getAiStatus } from "@/lib/ai/provider";
import type { CurrentUser } from "@/types";

const actor: CurrentUser = {
  id: "00000000-0000-4000-a000-000000000001",
  email: "owner@example.com",
  fullName: "Owner",
  avatarUrl: null,
  organizationId: "00000000-0000-4000-a000-000000000010",
  organizationName: "Workspace A",
  onboardingCompleted: true,
  platformRole: "user",
  isSample: true,
};

describe("Grok Bot MCP connector", () => {
  it("allows Grok Bot / Cursor connector callbacks and rejects arbitrary hosts", () => {
    expect(isAllowedRedirectUri("cursor://anysphere.cursor-mcp/oauth/callback")).toBe(true);
    expect(isAllowedRedirectUri("https://www.cursor.com/agents/mcp/oauth/callback")).toBe(true);
    expect(isAllowedRedirectUri("https://grok.com/oauth/callback")).toBe(true);
    expect(isAllowedRedirectUri("http://localhost:8787/callback")).toBe(true);
    expect(isAllowedRedirectUri("https://evil.example/steal")).toBe(false);
  });

  it("exposes the required tools and never a send-message tool", () => {
    const names = MCP_TOOLS.map((tool) => tool.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "discover_businesses",
        "get_business_details",
        "search_existing_leads",
        "research_business",
        "inspect_website",
        "score_opportunity",
        "generate_website_demo",
        "get_generated_website",
        "deploy_website_demo",
        "get_deployment_status",
        "create_campaign",
        "get_campaign_status",
        "pause_campaign",
        "resume_campaign",
        "cancel_campaign",
        "get_campaign_results",
        "prepare_outreach",
        "get_outreach_drafts",
      ]),
    );
    expect(names.some((name) => /send/i.test(name))).toBe(false);
  });

  it("blocks external send and billing tools", () => {
    expect(() => assertToolAllowed("send_outreach")).toThrow(McpAuthorizationError);
    expect(() => assertToolAllowed("charge_customer")).toThrow(McpAuthorizationError);
    expect(() => assertToolAllowed("prepare_outreach")).not.toThrow();
  });

  it("rejects tokens that are not bound to an organization", () => {
    expect(() => requireOrganization({ ...actor, organizationId: null })).toThrow(/workspace/i);
  });

  it("uses S256 PKCE hashing", () => {
    expect(sha256Base64Url("verifier")).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("discovers tools over an in-process MCP SDK session", async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = createProspectAiMcpServer(actor, "test-client");
    const client = new Client({ name: "prospectai-test", version: "0.1.0" });
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    const listed = await client.listTools();
    expect(listed.tools.map((tool) => tool.name)).toEqual(expect.arrayContaining(["discover_businesses", "prepare_outreach"]));
    await client.close();
    await server.close();
  });

  it("does not leak another organization's campaign through get_campaign_status", async () => {
    await expect(
      executeMcpTool("get_campaign_status", { campaignId: "00000000-0000-4000-a000-000000000099" }, actor),
    ).rejects.toThrow(/not found in this workspace/i);
  });
});

describe("optional xAI adapter", () => {
  it("does not treat a leftover GROK_API_KEY as a required or default Grok Bot connection", () => {
    const status = getAiStatus();
    expect(status.xaiAdapter).toBe(false);
    expect(["openai", "none", "xai"]).toContain(status.provider);
  });
});
