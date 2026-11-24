"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { PlaceholderImage } from "@/components/demos/placeholder";
import type { DemoWebsiteRecord } from "@/services/demos/types";

export function DemoSite({
  demo,
  page,
}: {
  demo: DemoWebsiteRecord;
  page: string;
}) {
  const slug = page === "" || page === "home" ? "home" : page;
  const palette = demo.palette;
  const style = {
    "--p": palette.primary,
    "--s": palette.secondary,
    "--a": palette.accent,
    "--b": palette.background,
    "--t": palette.text,
  } as CSSProperties;

  return (
    <div style={style} className="min-h-screen" data-template={demo.template_key}>
      <div className="bg-[color:var(--b)] text-[color:var(--t)]">
        <UnofficialBanner name={demo.business_name} sample={demo.is_sample} />
        <DemoNav demo={demo} current={slug} />
        <main>
          <PageBody demo={demo} slug={slug} />
        </main>
        <DemoFooter demo={demo} />
      </div>
    </div>
  );
}

function UnofficialBanner({ name, sample }: { name: string; sample: boolean }) {
  return (
    <div className="bg-amber-500 px-4 py-2 text-center text-xs font-semibold text-amber-950">
      Unofficial ProspectAI demonstration for {name}. This is not the business’s official website
      {sample ? " · underlying records are labelled sample data" : ""}.
    </div>
  );
}

function DemoNav({ demo, current }: { demo: DemoWebsiteRecord; current: string }) {
  return (
    <header className="border-b border-black/5 bg-white/70 px-4 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <Link href={`/d/${demo.demo_id}`} className="text-lg font-bold" style={{ color: "var(--s)" }}>
          {demo.business_name}
        </Link>
        <nav className="flex flex-wrap gap-3 text-sm">
          {demo.pages.map((item) => {
            const href = item.slug === "home" ? `/d/${demo.demo_id}` : `/d/${demo.demo_id}/${item.slug}`;
            const active = current === item.slug;
            return (
              <Link
                key={item.slug}
                href={href}
                className={active ? "font-semibold" : "opacity-70 hover:opacity-100"}
                style={{ color: active ? "var(--p)" : "var(--t)" }}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function PageBody({ demo, slug }: { demo: DemoWebsiteRecord; slug: string }) {
  const type = demo.template_key;
  if (slug === "home") {
    if (type === "real_estate") return <RealEstateHome demo={demo} />;
    if (type === "restaurant") return <RestaurantHome demo={demo} />;
    if (type === "hotel") return <HotelHome demo={demo} />;
    if (type === "construction") return <ConstructionHome demo={demo} />;
    if (type === "school") return <SchoolHome demo={demo} />;
    if (type === "beauty") return <BeautyHome demo={demo} />;
    if (type === "ecommerce") return <RetailHome demo={demo} />;
    return <ServicesHome demo={demo} />;
  }
  if (slug === "contact" || slug === "booking" || slug === "reservations" || slug === "admissions") {
    return <ContactPage demo={demo} title={demo.pages.find((p) => p.slug === slug)?.title ?? "Contact"} />;
  }
  if (slug === "about") return <AboutPage demo={demo} />;
  return <InnerPage demo={demo} slug={slug} />;
}

function Hero({
  demo,
  eyebrow,
  tone,
}: {
  demo: DemoWebsiteRecord;
  eyebrow: string;
  tone: "slate" | "warm" | "teal" | "rose" | "navy";
}) {
  return (
    <section className="mx-auto grid max-w-5xl gap-8 px-4 py-14 md:grid-cols-2 md:items-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--p)" }}>
          {eyebrow}
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">{demo.content.headline}</h1>
        <p className="mt-4 text-base leading-7 opacity-80">{demo.content.subhead}</p>
        <Link
          href={`/d/${demo.demo_id}/contact`}
          className="mt-6 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold text-white"
          style={{ background: "var(--p)" }}
        >
          {demo.content.cta}
        </Link>
        <p className="mt-4 text-xs opacity-60">{demo.content.unknownsNote}</p>
      </div>
      <PlaceholderImage label="photographs" className="h-64 rounded-3xl md:h-80" tone={tone} />
    </section>
  );
}

function RealEstateHome({ demo }: { demo: DemoWebsiteRecord }) {
  return (
    <>
      <Hero demo={demo} eyebrow={demo.industry ?? "Real estate"} tone="navy" />
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <h2 className="text-xl font-semibold">Listings</h2>
        <p className="mt-2 text-sm opacity-70">
          No verified properties are on file, so these cards are layout placeholders — not this business’s listings.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {["Street view", "Interior", "Exterior"].map((label) => (
            <PlaceholderImage key={label} label="property" className="h-40 rounded-2xl" tone="navy" />
          ))}
        </div>
      </section>
    </>
  );
}

function RestaurantHome({ demo }: { demo: DemoWebsiteRecord }) {
  return (
    <>
      <div className="relative">
        <PlaceholderImage label="dining room or food" className="h-72 w-full" tone="warm" />
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 to-transparent p-8 text-white">
          <div className="max-w-xl">
            <h1 className="text-4xl font-bold">{demo.content.headline}</h1>
            <p className="mt-2 text-sm text-white/80">{demo.content.subhead}</p>
          </div>
        </div>
      </div>
      <section className="mx-auto max-w-3xl px-4 py-14 text-center">
        <h2 className="text-2xl font-semibold">Menu</h2>
        {demo.content.services.length ? (
          <ul className="mt-6 divide-y text-left">
            {demo.content.services.map((item) => (
              <li key={item} className="py-3">{item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm opacity-70">A verified menu has not been supplied, so dishes are not listed.</p>
        )}
      </section>
    </>
  );
}

function HotelHome({ demo }: { demo: DemoWebsiteRecord }) {
  return (
    <>
      <Hero demo={demo} eyebrow="Stay" tone="teal" />
      <section className="grid gap-px bg-black/5 sm:grid-cols-3">
        {["Room", "Lobby", "Grounds"].map((label) => (
          <PlaceholderImage key={label} label="hotel facilities" className="h-48" tone="teal" />
        ))}
      </section>
    </>
  );
}

function ConstructionHome({ demo }: { demo: DemoWebsiteRecord }) {
  return (
    <div className="bg-[color:var(--s)] text-white">
      <section className="mx-auto max-w-5xl px-4 py-16">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">{demo.industry ?? "Construction"}</p>
        <h1 className="mt-3 max-w-2xl text-5xl font-bold">{demo.content.headline}</h1>
        <p className="mt-4 max-w-xl text-white/70">{demo.content.subhead}</p>
        <Link href={`/d/${demo.demo_id}/contact`} className="mt-8 inline-flex rounded-none bg-[color:var(--p)] px-6 py-3 text-sm font-semibold">
          Request a quote
        </Link>
      </section>
      <PlaceholderImage label="project sites" className="h-56 w-full" tone="warm" />
    </div>
  );
}

function SchoolHome({ demo }: { demo: DemoWebsiteRecord }) {
  return (
    <>
      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-sm tracking-wide" style={{ color: "var(--p)" }}>Admissions demonstration</p>
        <h1 className="mt-3 font-serif text-5xl">{demo.content.headline}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base opacity-75">{demo.content.subhead}</p>
      </section>
      <div className="mx-auto grid max-w-5xl gap-4 px-4 pb-16 md:grid-cols-2">
        <PlaceholderImage label="campus" className="h-56 rounded-xl" tone="navy" />
        <div className="rounded-xl border p-6 text-left">
          <h2 className="font-semibold">Programs</h2>
          {demo.content.services.length ? (
            <ul className="mt-3 list-disc pl-5 text-sm">{demo.content.services.map((s) => <li key={s}>{s}</li>)}</ul>
          ) : (
            <p className="mt-3 text-sm opacity-70">Programmes have not been verified, so they are not listed.</p>
          )}
        </div>
      </div>
    </>
  );
}

function BeautyHome({ demo }: { demo: DemoWebsiteRecord }) {
  return (
    <>
      <Hero demo={demo} eyebrow="Studio" tone="rose" />
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <h2 className="text-xl font-semibold">Treatments</h2>
        <ServiceList demo={demo} empty="Verified treatments have not been supplied." />
      </section>
    </>
  );
}

function RetailHome({ demo }: { demo: DemoWebsiteRecord }) {
  return (
    <>
      <Hero demo={demo} eyebrow="Shop" tone="slate" />
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <h2 className="text-xl font-semibold">Catalogue demonstration</h2>
        <p className="mt-2 text-sm opacity-70">Product photos are placeholders, not this store’s inventory.</p>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {["Look 1", "Look 2", "Look 3", "Look 4"].map((label) => (
            <PlaceholderImage key={label} label="merchandise" className="h-40 rounded-xl" tone="slate" />
          ))}
        </div>
      </section>
    </>
  );
}

function ServicesHome({ demo }: { demo: DemoWebsiteRecord }) {
  return (
    <>
      <Hero demo={demo} eyebrow={demo.industry ?? "Professional services"} tone="navy" />
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <h2 className="text-xl font-semibold">Services</h2>
        <ServiceList demo={demo} empty="Verified services have not been supplied, so none are listed." />
      </section>
    </>
  );
}

function ServiceList({ demo, empty }: { demo: DemoWebsiteRecord; empty: string }) {
  if (!demo.content.services.length) {
    return <p className="mt-3 text-sm opacity-70">{empty}</p>;
  }
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {demo.content.services.map((item) => (
        <div key={item} className="rounded-2xl border p-5">
          <h3 className="font-semibold">{item}</h3>
          <p className="mt-1 text-sm opacity-70">Included because it was present in the verified research record.</p>
        </div>
      ))}
    </div>
  );
}

function AboutPage({ demo }: { demo: DemoWebsiteRecord }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">About {demo.business_name}</h1>
      <p className="mt-4 leading-7 opacity-80">{demo.content.about}</p>
      <p className="mt-6 text-sm opacity-60">{demo.content.unknownsNote}</p>
    </section>
  );
}

function InnerPage({ demo, slug }: { demo: DemoWebsiteRecord; slug: string }) {
  const page = demo.pages.find((item) => item.slug === slug);
  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">{page?.title ?? slug}</h1>
      <p className="mt-3 text-sm opacity-70">{page?.purpose}</p>
      <ServiceList demo={demo} empty="No verified items are available for this section yet." />
      <PlaceholderImage label="section photography" className="mt-8 h-48 rounded-2xl" />
    </section>
  );
}

function ContactPage({ demo, title }: { demo: DemoWebsiteRecord; title: string }) {
  return (
    <section className="mx-auto grid max-w-5xl gap-10 px-4 py-16 md:grid-cols-2">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-3 text-sm opacity-70">
          This form is part of the unofficial demonstration. Submissions are not delivered to the business.
        </p>
        <dl className="mt-6 space-y-2 text-sm">
          <div><dt className="opacity-50">Phone</dt><dd>{demo.content.phone ?? "Unknown"}</dd></div>
          <div><dt className="opacity-50">Email</dt><dd>{demo.content.email ?? "Unknown"}</dd></div>
          <div><dt className="opacity-50">Address</dt><dd>{demo.content.address ?? demo.content.location ?? "Unknown"}</dd></div>
        </dl>
      </div>
      <form
        className="space-y-3 rounded-2xl border p-5"
        onSubmit={(event) => {
          event.preventDefault();
          window.alert("This enquiry form is a demonstration. Messages are not sent to the business.");
        }}
      >
        <input className="h-11 w-full rounded-xl border px-3 text-sm" placeholder="Your name" />
        <input className="h-11 w-full rounded-xl border px-3 text-sm" placeholder="Your email" />
        <textarea className="min-h-28 w-full rounded-xl border px-3 py-2 text-sm" placeholder="Message" />
        <button type="submit" className="h-11 w-full rounded-xl text-sm font-semibold text-white" style={{ background: "var(--p)" }}>
          Demonstration only
        </button>
      </form>
    </section>
  );
}

function DemoFooter({ demo }: { demo: DemoWebsiteRecord }) {
  return (
    <footer className="border-t px-4 py-8 text-center text-xs opacity-60">
      Unofficial preview by ProspectAI · Demo {demo.demo_id} · Expires {demo.expires_at.slice(0, 10)} · Not an official{" "}
      {demo.business_name} website
    </footer>
  );
}
