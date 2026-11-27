import Link from "next/link";
import { Sparkles } from "lucide-react";

export function WelcomeBanner({ name, isEmpty }: { name: string; isEmpty?: boolean }) {
  return (
    <section className="relative overflow-hidden rounded-[1.4rem] bg-gradient-to-r from-[#f8e6dc] via-[#f6f1eb] to-[#f3ebe3] p-6 sm:p-7">
      <div className="relative z-10 max-w-xl">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.7rem]">
          Welcome, {name}{" "}
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
    </section>
  );
}
