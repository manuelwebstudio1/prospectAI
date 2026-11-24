import { notFound } from "next/navigation";
import { DemoSite } from "@/components/demos/demo-site";
import { ExpiredNotice } from "@/components/demos/expired-notice";
import { getPublicDemo } from "@/services/workspace/repository";

export default async function PublicDemoPage({
  params,
}: {
  params: Promise<{ demoId: string; page: string }>;
}) {
  const { demoId, page } = await params;
  const demo = await getPublicDemo(demoId);
  if (!demo) notFound();
  if (demo.status === "expired") return <ExpiredNotice name={demo.business_name} />;
  const allowed = new Set(["home", ...demo.pages.map((item) => item.slug)]);
  if (!allowed.has(page)) notFound();
  return <DemoSite demo={demo} page={page} />;
}
