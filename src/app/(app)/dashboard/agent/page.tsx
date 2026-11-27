import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getAiStatus } from "@/lib/ai/provider";
import { integrationStatus } from "@/lib/env";
import { AgentWorkspace } from "@/components/agent/agent-workspace";

export const metadata: Metadata = { title: "AI Agent" };

export default async function AgentPage() {
  const user = await getCurrentUser();
  if (!user?.organizationId) redirect("/login");
  const integrations = integrationStatus();
  const ai = getAiStatus();
  return (
    <AgentWorkspace
      placesConfigured={integrations.googlePlaces}
      aiConfigured={ai.configured}
      aiProvider={ai.provider}
      workerConfigured={integrations.workerCron}
    />
  );
}
