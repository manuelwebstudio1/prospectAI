import Link from "next/link";
import { Sparkles } from "lucide-react";
import { greetingForHour } from "@/lib/utils";

export function WelcomeBanner({ name, isEmpty }: { name: string; isEmpty?: boolean }) {
  const hour = new Date().getHours();
  return (
    <section className="relative overflow-hidden rounded-[1.4rem] bg-gradient-to-r from-[#f8e6dc] via-[#f6f1eb] to-[#f3ebe3] p-6 sm:p-7">
      <div className="relative z-10 max-w-xl">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.7rem]">
          {greetingForHour(hour)}, {name}{" "}
          <span aria-hidden>👋</span>
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          {isEmpty
            ? "Your workspace is ready. Start by discovering businesses without websites."
            : "Discover businesses. Build relationships. Win more clients."}
        </p>
        {isEmpty ? (
          <Link
            href="/dashboard/discovery"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Find businesses
          </Link>
        ) : null}
      </div>
      <div className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 md:block">
        <div className="relative h-28 w-56">
          <div className="absolute left-8 top-2 h-20 w-28 rotate-6 rounded-xl bg-white/80 shadow-lg ring-1 ring-[#eadfd6]" />
          <div className="absolute left-20 top-0 h-24 w-32 -rotate-3 overflow-hidden rounded-xl bg-gradient-to-br from-[#e85a2a] to-[#cf4f24] shadow-xl">
            <div className="mt-6 h-10 bg-white/20" />
          </div>
          <div className="absolute left-0 top-6 h-16 w-24 -rotate-6 rounded-xl bg-white shadow-md ring-1 ring-slate-100" />
        </div>
      </div>
      <Link
        href="/dashboard/builder"
        className="absolute right-6 top-5 hidden items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm lg:inline-flex"
      >
        <Sparkles className="h-3.5 w-3.5" />
        AI Website Builder
      </Link>
    </section>
  );
}
