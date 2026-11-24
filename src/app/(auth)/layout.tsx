import Link from "next/link";
import { BrandLogo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-[#0b1020] p-10 text-white lg:flex">
        <Link href="/">
          <BrandLogo inverted />
        </Link>
        <div>
          <p className="text-3xl font-bold leading-tight">Find your next client before they start looking for a developer.</p>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-400">
            Campaigns, website detection, research, demos and approved outreach — in one workspace built for Ghana first.
          </p>
        </div>
        <p className="text-xs text-slate-500">ProspectAI · Client acquisition for web professionals</p>
      </div>
      <div className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
