import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    platformAdminEmails: ["ops@prospectai.com"],
  },
}));

import { applyPlatformRole, isPlatformAdmin, isSuperAdmin } from "@/lib/auth/roles";

describe("applyPlatformRole", () => {
  it("does not trust a cookie-supplied admin role", () => {
    expect(applyPlatformRole("user", "member@example.com")).toBe("user");
  });

  it("elevates an allowlisted email from user to admin", () => {
    expect(applyPlatformRole("user", "ops@prospectai.com")).toBe("admin");
    expect(applyPlatformRole("user", "OPS@prospectai.com")).toBe("admin");
  });

  it("does not downgrade a database super_admin", () => {
    expect(applyPlatformRole("super_admin", "ops@prospectai.com")).toBe("super_admin");
  });
});

describe("isPlatformAdmin", () => {
  it("treats admin and super_admin as platform admins", () => {
    expect(isPlatformAdmin({ platformRole: "user" })).toBe(false);
    expect(isPlatformAdmin({ platformRole: "admin" })).toBe(true);
    expect(isPlatformAdmin({ platformRole: "super_admin" })).toBe(true);
    expect(isSuperAdmin({ platformRole: "admin" })).toBe(false);
    expect(isSuperAdmin({ platformRole: "super_admin" })).toBe(true);
  });
});
