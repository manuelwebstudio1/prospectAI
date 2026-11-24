import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getDashboardOverview } from "@/services/dashboard/get-overview";
import { OverviewView } from "@/components/dashboard/overview/overview-view";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const data = await getDashboardOverview(user);
  return <OverviewView data={data} />;
}
