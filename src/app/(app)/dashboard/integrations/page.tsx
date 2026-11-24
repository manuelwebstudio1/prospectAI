import type { Metadata } from "next";
import { integrationStatus } from "@/lib/env";

export const metadata: Metadata = { title: "Integrations" };

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
};

export default function IntegrationsPage() {
  const status = integrationStatus();
  return (
    <div className="mx-auto max-w-3xl animate-enter space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Credentials are read from environment variables. Disconnected services are never presented as working.
        </p>
      </div>
      <div className="grid gap-3">
        {Object.entries(status).map(([key, connected]) => (
          <div key={key} className="surface-card flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-medium">{labels[key] ?? key}</p>
              <p className="text-xs text-muted-foreground">
                {connected ? "Configured on the server" : "Not configured"}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                connected ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
