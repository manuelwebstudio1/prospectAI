import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    moolre: {
      apiUser: "user",
      publicKey: "pub",
      accountNumber: "1001",
      walletSecret: "wallet-secret",
      baseUrl: "https://api.moolre.com",
    },
  },
}));

import {
  amountsMatch,
  parseMoolreWebhook,
  verifyMoolreSignature,
} from "@/lib/payments/moolre";

function sign(body: string, secret = "wallet-secret", t = Math.floor(Date.now() / 1000)) {
  const v1 = createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
  return { header: `t=${t},v1=${v1}`, t };
}

describe("verifyMoolreSignature", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("accepts a valid HMAC over t.body", () => {
    const body = '{"event_id":"evt_1"}';
    const { header } = sign(body);
    expect(verifyMoolreSignature(body, header)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const { header } = sign('{"event_id":"evt_1"}');
    expect(verifyMoolreSignature('{"event_id":"evt_2"}', header)).toBe(false);
  });

  it("rejects a missing or stale timestamp", () => {
    const body = "{}";
    expect(verifyMoolreSignature(body, null)).toBe(false);
    const old = Math.floor(Date.now() / 1000) - 400;
    const { header } = sign(body, "wallet-secret", old);
    expect(verifyMoolreSignature(body, header)).toBe(false);
  });
});

describe("parseMoolreWebhook", () => {
  it("reads P01 success fields from the official envelope", () => {
    const payload = parseMoolreWebhook(
      JSON.stringify({
        status: 1,
        code: "P01",
        event_id: "evt_0123456789abcdef01234567",
        event: "payment.succeeded",
        data: {
          txstatus: 1,
          amount: "150.00",
          externalref: "pa_abc",
          transactionid: "10000001",
          accountnumber: "1001",
        },
      }),
      null,
    );
    expect(payload?.eventId).toBe("evt_0123456789abcdef01234567");
    expect(payload?.code).toBe("P01");
    expect(payload?.txstatus).toBe(1);
    expect(payload?.amount).toBe(150);
    expect(payload?.externalRef).toBe("pa_abc");
  });

  it("returns null for invalid JSON or a missing event id", () => {
    expect(parseMoolreWebhook("not-json", null)).toBeNull();
    expect(parseMoolreWebhook("{}", null)).toBeNull();
  });
});

describe("amountsMatch", () => {
  it("compares numerically, not as strings", () => {
    expect(amountsMatch(150, 150)).toBe(true);
    expect(amountsMatch(150, 150.00)).toBe(true);
    expect(amountsMatch(150, 149.99)).toBe(true);
    expect(amountsMatch(150, 200)).toBe(false);
    expect(amountsMatch(150, null)).toBe(false);
  });
});
