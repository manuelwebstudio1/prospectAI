import Link from "next/link";
import { BrandLogo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-canvas grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between p-10 lg:flex">
        <Link href="/">
          <BrandLogo />
        </Link>
        <div>
          <p className="font-display text-[2.6rem] leading-[1.12] tracking-[-0.03em] text-[#1c1917]">
            Find your next client before they start looking for a developer.
          </p>
          <p className="mt-4 max-w-md text-sm leading-6 text-[#6f6a64]">
            Campaigns, website detection, research, demos and approved outreach — in one workspace built for Ghana first.
          </p>
        </div>
        <p className="text-xs text-[#9a9289]">ProspectAI · Client acquisition for web professionals</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/">
              <BrandLogo />
            </Link>
          </div>
          <div className="rounded-[1.6rem] bg-white/85 p-7 shadow-[0_1px_2px_rgba(80,50,30,0.04),0_18px_40px_rgba(80,50,30,0.06)] ring-1 ring-black/5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
