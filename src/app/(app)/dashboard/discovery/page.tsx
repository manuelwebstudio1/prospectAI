import type { Metadata } from "next";
import { DiscoveryForm } from "./discovery-form";
import { integrationStatus } from "@/lib/env";

export const metadata: Metadata = { title: "Discover businesses" };

export default function DiscoveryPage() {
  const integrations = integrationStatus();
  return (
    <div className="mx-auto max-w-4xl animate-enter space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Discover businesses</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure a campaign. Discovery runs in the background and never freezes this page.
        </p>
      </div>
      {!integrations.googlePlaces ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Google Places is not connected. Starting discovery will run a labelled sample directory so you can
          exercise the workflow. Sample records are never treated as verified businesses. Add{" "}
          <code>GOOGLE_PLACES_API_KEY</code> to search authorized live data.
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Google Places is configured. Discovery will query live place data, then inspect websites with SSRF protections.
        </div>
      )}
      <DiscoveryForm />
    </div>
  );
}
