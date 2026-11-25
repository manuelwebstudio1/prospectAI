import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { getDashboardOverview } from "@/services/dashboard/get-overview";
import { OverviewView } from "@/components/dashboard/overview/overview-view";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const data = await getDashboardOverview(user);
  return (
    <>
      {isPlatformAdmin(user) ? (
        <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
          This screen is one customer workspace. To see every user, collected revenue, and platform analytics, open the{" "}
          <Link href="/admin" className="font-semibold text-primary underline-offset-2 hover:underline">
            platform console
          </Link>
          .
        </div>
      ) : null}
      <OverviewView data={data} />
    </>
  );
}
