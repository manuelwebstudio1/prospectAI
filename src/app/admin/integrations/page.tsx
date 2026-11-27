import type { Metadata } from "next";
import { integrationStatus } from "@/lib/env";

export const metadata: Metadata = { title: "Admin integrations" };

const labels: Record<string, string> = {
  supabase: "Supabase",
  grok: "Grok (xAI)",
  openai: "OpenAI",
  googlePlaces: "Google Places",
  resend: "Resend email",
  whatsapp: "WhatsApp Cloud API",
  moolre: "Moolre (Ghana payments)",
  stripe: "Stripe (optional)",
  trigger: "Trigger.dev",
  workerCron: "Unattended job worker (CRON_SECRET)",
};

export default function AdminIntegrationsPage() {
  const status = integrationStatus();
  return (
    <div className="space-y-4 animate-enter">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Connected means the matching environment variable is set. Secrets are never displayed.
        </p>
      </div>
      <div className="grid gap-3">
        {Object.entries(status).map(([key, connected]) => (
          <div key={key} className="surface-card flex items-center justify-between px-5 py-4">
            <p className="font-medium">{labels[key] ?? key}</p>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${connected ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
