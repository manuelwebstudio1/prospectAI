import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safe = next?.startsWith("/oauth/authorize") ? next : undefined;
  return <LoginForm next={safe} />;
}
