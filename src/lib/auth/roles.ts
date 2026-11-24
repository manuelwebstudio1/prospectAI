import { env } from "@/lib/env";
import type { CurrentUser, PlatformRole } from "@/types";

export function emailIsPlatformAdmin(email: string | null | undefined) {
  if (!email) return false;
  return env.platformAdminEmails.includes(email.trim().toLowerCase());
}

export function applyPlatformRole(role: PlatformRole | null | undefined, email: string): PlatformRole {
  const current = role ?? "user";
  if (emailIsPlatformAdmin(email) && current === "user") return "admin";
  return current;
}

export function isPlatformAdmin(user: Pick<CurrentUser, "platformRole"> | null | undefined) {
  return user?.platformRole === "admin" || user?.platformRole === "super_admin";
}

export function isSuperAdmin(user: Pick<CurrentUser, "platformRole"> | null | undefined) {
  return user?.platformRole === "super_admin";
}
