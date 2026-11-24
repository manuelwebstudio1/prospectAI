import type { Metadata } from "next";
import { getPlatformSettings } from "@/services/admin/store";
import { SettingsAdminForm } from "@/components/admin/admin-forms";

export const metadata: Metadata = { title: "Platform settings" };

export default async function AdminSettingsPage() {
  const settings = await getPlatformSettings();
  return (
    <div className="space-y-4 animate-enter">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform settings</h1>
        <p className="text-sm text-muted-foreground">Trial length and the default plan for new workspaces.</p>
      </div>
      <SettingsAdminForm settings={settings} />
    </div>
  );
}
