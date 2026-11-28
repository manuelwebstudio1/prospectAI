import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { getSidebarPlan } from "@/services/dashboard/get-overview";
import { isUserSuspended } from "@/services/admin/store";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { AppHeader } from "@/components/layouts/app-header";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.organizationId && !user.onboardingCompleted) redirect("/onboarding");
  if ((await isUserSuspended(user.id)) && !isPlatformAdmin(user)) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-2xl font-bold">Workspace suspended</h1>
        <p className="text-sm text-muted-foreground">
          This account has been suspended by a platform administrator. Sign out or contact support.
        </p>
      </div>
    );
  }

  const plan = await getSidebarPlan(user);

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <AppSidebar user={user} plan={plan} />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader user={user} plan={plan} />
        <main className="flex-1 px-4 py-5 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
