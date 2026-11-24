import { AlertTriangle } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/env";

export function PreviewBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-semibold">Development preview data</p>
        <p className="text-amber-800">
          These numbers and businesses are labelled sample records used to preview the interface.
          They are not verified real businesses.
          {!isSupabaseConfigured()
            ? " Connect Supabase with NEXT_PUBLIC_SUPABASE_URL to use a live workspace."
            : " Your workspace has no records yet, so preview data is shown."}
        </p>
      </div>
    </div>
  );
}
