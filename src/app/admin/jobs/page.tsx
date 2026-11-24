import type { Metadata } from "next";
import { listAdminJobs } from "@/services/admin/store";

export const metadata: Metadata = { title: "Admin jobs" };

export default async function AdminJobsPage() {
  const jobs = await listAdminJobs();
  return (
    <div className="space-y-4 animate-enter">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Background jobs</h1>
        <p className="text-sm text-muted-foreground">Discovery ticks stored for this environment. Trigger.dev wrapping is not enabled.</p>
      </div>
      {jobs.length === 0 ? (
        <p className="surface-card p-6 text-sm text-muted-foreground">No jobs have been queued yet.</p>
      ) : (
        <ul className="surface-card divide-y">
          {jobs.map((job) => (
            <li key={job.id} className="px-4 py-3 text-sm">
              <p className="font-medium">
                {job.job_type} · {job.status}
              </p>
              <p className="text-xs text-muted-foreground">
                {job.created_at.slice(0, 19).replace("T", " ")}
                {job.last_error ? ` · ${job.last_error}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
