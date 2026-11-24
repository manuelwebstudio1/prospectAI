import { describe, expect, it } from "vitest";
import { leadCooldownActive, orgHourlyCapExceeded } from "@/services/outreach/limits";
import { assertCanSend, dispatchApprovedMessage } from "@/services/outreach/send";
import type { OutreachMessageRecord } from "@/services/workspace/types";

function message(overrides: Partial<OutreachMessageRecord> = {}): OutreachMessageRecord {
  return {
    id: "msg-1",
    organization_id: "org-1",
    lead_id: "lead-1",
    channel: "email",
    subject: "Hello",
    body: "Body",
    status: "approved",
    scheduled_at: null,
    sent_at: null,
    approved_by: "user-1",
    recipient: "owner@example.com",
    delivery_method: "unsent",
    last_error: null,
    demo_url: null,
    is_sample: false,
    draft_mode: "deterministic",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("assertCanSend", () => {
  it("blocks unapproved drafts", async () => {
    await expect(
      assertCanSend({ message: message({ status: "draft" }), orgSentAt: [], leadLastSentAt: null }),
    ).rejects.toThrow(/approve/i);
  });

  it("blocks a second send of the same message", async () => {
    await expect(
      assertCanSend({ message: message({ status: "sent" }), orgSentAt: [], leadLastSentAt: null }),
    ).rejects.toThrow(/already sent/i);
  });

  it("enforces the hourly org cap", async () => {
    const now = Date.now();
    const orgSentAt = Array.from({ length: 10 }, (_, i) => new Date(now - i * 1000).toISOString());
    await expect(
      assertCanSend({ message: message(), orgSentAt, leadLastSentAt: null }),
    ).rejects.toThrow(/hourly send cap/i);
  });

  it("enforces the 24 hour lead cooldown", async () => {
    await expect(
      assertCanSend({
        message: message(),
        orgSentAt: [],
        leadLastSentAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      }),
    ).rejects.toThrow(/24 hours/i);
  });
});

describe("dispatchApprovedMessage", () => {
  it("blocks live API send for labelled sample records", async () => {
    await expect(
      dispatchApprovedMessage({ message: message({ is_sample: true }), method: "api" }),
    ).rejects.toThrow(/sample/i);
  });

  it("allows a manual mark-sent for samples", async () => {
    const result = await dispatchApprovedMessage({
      message: message({ is_sample: true }),
      method: "manual",
    });
    expect(result.status).toBe("sent");
    expect(result.delivery_method).toBe("manual");
  });
});

describe("outreach limits", () => {
  it("does not trip the cap below 10 recent sends", () => {
    const now = Date.now();
    const sentAt = Array.from({ length: 9 }, (_, i) => new Date(now - i * 1000).toISOString());
    expect(orgHourlyCapExceeded(sentAt, now)).toBe(false);
  });

  it("ignores sends older than an hour", () => {
    const now = Date.now();
    const sentAt = Array.from({ length: 10 }, () => new Date(now - 2 * 60 * 60 * 1000).toISOString());
    expect(orgHourlyCapExceeded(sentAt, now)).toBe(false);
  });

  it("treats a missing last-sent time as no cooldown", () => {
    expect(leadCooldownActive(null)).toBe(false);
  });
});
