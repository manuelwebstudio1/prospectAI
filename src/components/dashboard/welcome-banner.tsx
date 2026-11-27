import Link from "next/link";
import { greetingNow } from "@/lib/utils";

export function WelcomeBanner({ name }: { name: string }) {
  const greeting = greetingNow();
  return (
    <section className="relative overflow-hidden rounded-[1.4rem] bg-gradient-to-r from-[#eef0ff] via-[#f4f0ff] to-[#ece9ff] px-6 py-6 sm:px-8">
      <div className="relative z-10 max-w-xl">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
          {greeting}, {name}{" "}
          <span aria-hidden>👋</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Discover businesses. Build relationships. Win more clients.
        </p>
      </div>
      <div className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 md:block">
        <div className="relative h-28 w-64">
          <div className="absolute left-8 top-2 h-24 w-36 rotate-[-8deg] rounded-2xl bg-white/80 p-2 shadow-lg ring-1 ring-violet-100">
            <div className="h-full rounded-xl bg-gradient-to-br from-indigo-200 to-violet-300" />
          </div>
          <div className="absolute left-24 top-0 h-24 w-40 rotate-[6deg] rounded-2xl bg-white p-2 shadow-xl ring-1 ring-violet-100">
            <div className="h-10 rounded-lg bg-slate-200" />
            <p className="mt-2 text-[10px] font-semibold text-slate-600">Modern Business Solutions</p>
          </div>
        </div>
      </div>
      <Link
        href="/dashboard/builder"
        className="absolute right-6 top-5 hidden rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm md:inline-flex"
      >
        AI Website Builder
      </Link>
    </section>
  );
}
