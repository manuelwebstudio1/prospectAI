import { notFound } from "next/navigation";
import { DemoSite } from "@/components/demos/demo-site";
import { ExpiredNotice } from "@/components/demos/expired-notice";
import { getPublicDemo } from "@/services/workspace/repository";

export default async function PublicDemoHome({ params }: { params: Promise<{ demoId: string }> }) {
  const { demoId } = await params;
  const demo = await getPublicDemo(demoId);
  if (!demo) notFound();
  if (demo.status === "expired") {
    return <ExpiredNotice name={demo.business_name} />;
  }
  return <DemoSite demo={demo} page="home" />;
}
