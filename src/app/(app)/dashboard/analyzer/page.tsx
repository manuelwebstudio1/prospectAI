import type { Metadata } from "next";
import { AnalyzerForm } from "./analyzer-form";

export const metadata: Metadata = { title: "Website analyzer" };

export default function AnalyzerPage() {
  return (
    <div className="mx-auto max-w-3xl animate-enter space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Website analyzer</h1>
        <p className="text-sm text-muted-foreground">
          SSRF-safe inspection: public HTTP(S) only, DNS-checked, private and metadata hosts blocked.
          A missing or failed URL is classified as unverified — not “no website”.
        </p>
      </div>
      <AnalyzerForm />
    </div>
  );
}
