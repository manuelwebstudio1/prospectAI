import { cookies } from "next/headers";
import { applyPlatformRole } from "@/lib/auth/roles";
import type { CurrentUser } from "@/types";

export const DEV_SESSION_COOKIE = "pa_dev_session";

export const DEV_USER: CurrentUser = {
  id: "00000000-0000-4000-a000-000000000001",
  email: "kofi@prospectai.com",
  fullName: "Kofi Amanor",
  avatarUrl: null,
  organizationId: "00000000-0000-4000-a000-000000000010",
  organizationName: "My Workspace",
  onboardingCompleted: true,
  platformRole: "user",
  isSample: true,
};

export async function getDevSession(): Promise<CurrentUser | null> {
  const store = await cookies();
  const raw = store.get(DEV_SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CurrentUser;
    const merged = { ...DEV_USER, ...parsed, isSample: true as const };
    return {
      ...merged,
      platformRole: applyPlatformRole("user", merged.email),
    };
  } catch {
    return {
      ...DEV_USER,
      platformRole: applyPlatformRole("user", DEV_USER.email),
    };
  }
}

export async function setDevSession(user: CurrentUser) {
  const store = await cookies();
  store.set(DEV_SESSION_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: false,
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearDevSession() {
  const store = await cookies();
  store.delete(DEV_SESSION_COOKIE);
}
