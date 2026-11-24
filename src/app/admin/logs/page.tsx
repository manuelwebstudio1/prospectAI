import type { Metadata } from "next";
import { listActivityLogs } from "@/services/admin/store";

export const metadata: Metadata = { title: "Admin logs" };

export default async function AdminLogsPage() {
  const logs = await listActivityLogs();
  return (
    <div className="space-y-4 animate-enter">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System logs</h1>
        <p className="text-sm text-muted-foreground">Administrator actions recorded by this app. Opens, clicks and payment success are not inferred.</p>
      </div>
      {logs.length === 0 ? (
        <p className="surface-card p-6 text-sm text-muted-foreground">No admin actions have been recorded yet.</p>
      ) : (
        <ul className="surface-card divide-y">
          {logs.map((log) => (
            <li key={log.id} className="px-4 py-3 text-sm">
              <p className="font-medium">{log.action}</p>
              <p className="text-xs text-muted-foreground">
                {log.entity_type}
                {log.entity_id ? ` · ${log.entity_id.slice(0, 8)}` : ""} · {log.created_at.slice(0, 19).replace("T", " ")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
