import { Badge } from "@/components/ui/badge";
import type { getGrokBotConnectorStatus } from "@/lib/mcp/status";

export function GrokBotStatus({ status }: { status: Awaited<ReturnType<typeof getGrokBotConnectorStatus>> }) {
  return (
    <section className="surface-card space-y-4 p-5">
      <div>
        <h2 className="font-semibold">Grok Bot connector</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          ProspectAI exposes an MCP server for the Grok Bot desktop app. This is not an xAI API key integration. Grok Bot
          stays <strong>not connected</strong> until you add the custom connector in the Bot and complete OAuth.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatusRow label="MCP server" value="Ready to accept HTTPS requests" tone="ready" />
        <StatusRow label="Grok Bot connection" value="Not verified" tone="idle" />
        <StatusRow label="Connector configuration" value="OAuth 2.1 + PKCE published" tone="ready" />
        <StatusRow
          label="Authentication"
          value={status.supabaseReady ? "Bearer tokens bound to a ProspectAI workspace" : "Local workspace tokens (Supabase service role missing)"}
          tone={status.supabaseReady ? "ready" : "warn"}
        />
      </div>

      <dl className="space-y-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Server URL</dt>
          <dd className="break-all font-medium">{status.mcpUrl}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Last successful MCP activity</dt>
          <dd>{status.lastSuccessfulConnection ? `${status.lastSuccessfulConnection.label} · ${status.lastSuccessfulConnection.at}` : "None yet"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Last tool execution</dt>
          <dd>
            {status.lastToolExecution
              ? `${status.lastToolExecution.tool_name} · ${status.lastToolExecution.ok ? "ok" : "failed"} · ${status.lastToolExecution.created_at}`
              : "None yet"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Integration errors</dt>
          <dd>{status.lastError?.message ?? "None recorded"}</dd>
        </div>
      </dl>

      <div>
        <p className="text-sm font-medium">Available tools</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {status.tools.map((tool) => (
            <li key={tool}>
              <Badge variant="secondary">{tool}</Badge>
            </li>
          ))}
        </ul>
      </div>

      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        <li>Open the Grok Bot desktop app → Connect apps → Add a custom connector.</li>
        <li>Name it ProspectAI. Type: Remote HTTPS. Server URL: the address above.</li>
        <li>Leave HTTP headers empty. Prefer OAuth — Grok Bot will register itself (dynamic client registration) or prompt you to authorize.</li>
        <li>Sign in to ProspectAI when asked and allow access. “Added” only means installed, not authenticated.</li>
        <li>Ask the Bot which ProspectAI tools it has. A successful tool call will appear here. Until then this page will not say Connected.</li>
      </ol>
    </section>
  );
}

function StatusRow({ label, value, tone }: { label: string; value: string; tone: "ready" | "idle" | "warn" }) {
  const klass =
    tone === "ready" ? "bg-emerald-50 text-emerald-700" : tone === "warn" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600";
  return (
    <div className="rounded-xl border px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${klass}`}>{value}</p>
    </div>
  );
}
