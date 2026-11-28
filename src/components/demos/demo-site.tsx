"use client";

import { createContext, useContext, useEffect, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { DemoPhoto } from "@/components/demos/demo-photo";
import { DEMO_PHOTO_CAPTION, stockFor } from "@/components/demos/stock";
import type { DemoWebsiteRecord } from "@/services/demos/types";

const DemoNavContext = createContext<(slug: string) => void>(() => undefined);

function normalizeSlug(page: string) {
  return page === "" || page === "home" ? "home" : page;
}

function pathFor(demoId: string, slug: string) {
  return slug === "home" ? `/d/${demoId}` : `/d/${demoId}/${slug}`;
}

export function DemoSite({
  demo,
  page,
}: {
  demo: DemoWebsiteRecord;
  page: string;
}) {
  const [slug, setSlug] = useState(() => normalizeSlug(page));
  const palette = demo.palette;
  const style = {
    "--p": palette.primary,
    "--s": palette.secondary,
    "--a": palette.accent,
    "--b": palette.background,
    "--t": palette.text,
  } as CSSProperties;

  useEffect(() => {
    setSlug(normalizeSlug(page));
  }, [page]);

  useEffect(() => {
    const onPop = () => {
      const parts = window.location.pathname.split("/").filter(Boolean);
      setSlug(normalizeSlug(parts[2] ?? "home"));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function go(next: string) {
    const nextSlug = normalizeSlug(next);
    setSlug(nextSlug);
    const href = pathFor(demo.demo_id, nextSlug);
    if (window.location.pathname !== href) {
      window.history.pushState({ page: nextSlug }, "", href);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  return (
    <DemoNavContext.Provider value={go}>
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
    </DemoNavContext.Provider>
  );
}

function DemoLink({
  slug,
  demoId,
  className,
  style,
  children,
}: {
  slug: string;
  demoId: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const go = useContext(DemoNavContext);
  return (
    <a
      href={pathFor(demoId, slug)}
      className={className}
      style={style}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        go(slug);
      }}
    >
      {children}
    </a>
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
  const dark = demo.template_key === "construction" || demo.template_key === "hotel";
  const contactSlug = contactSlugFor(demo);
  return (
    <header
      className={
        dark
          ? "sticky top-0 z-30 border-b border-white/10 bg-[color:var(--s)]/95 text-white backdrop-blur"
          : "sticky top-0 z-30 border-b border-black/5 bg-white/90 backdrop-blur"
      }
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <DemoLink slug="home" demoId={demo.demo_id} className="shrink-0 text-lg font-bold tracking-tight">
          {demo.business_name}
        </DemoLink>
        <nav className="-mx-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {demo.pages.map((item) => {
            const active = current === item.slug;
            return (
              <DemoLink
                key={item.slug}
                slug={item.slug}
                demoId={demo.demo_id}
                className={`shrink-0 rounded-full px-3 py-2 text-sm whitespace-nowrap ${
                  active ? "font-semibold" : "opacity-70 hover:opacity-100"
                }`}
                style={
                  active
                    ? { background: dark ? "rgba(255,255,255,0.12)" : "var(--p)", color: dark ? "white" : "white" }
                    : dark
                      ? undefined
                      : { color: "var(--t)" }
                }
              >
                {item.title}
              </DemoLink>
            );
          })}
        </nav>
        <DemoLink
          slug={contactSlug}
          demoId={demo.demo_id}
          className="hidden shrink-0 rounded-full px-4 py-2 text-xs font-semibold text-white sm:inline-flex"
          style={{ background: "var(--p)" }}
        >
          {demo.content.cta}
        </DemoLink>
      </div>
    </header>
  );
}

function PageBody({ demo, slug }: { demo: DemoWebsiteRecord; slug: string }) {
  const type = demo.template_key;
  if (slug === "home") {
    if (type === "construction") return <ConstructionHome demo={demo} />;
    if (type === "real_estate") return <GalleryHome demo={demo} eyebrow="Property" />;
    if (type === "restaurant") return <RestaurantHome demo={demo} />;
    if (type === "hotel") return <GalleryHome demo={demo} eyebrow="Stay" />;
    if (type === "school") return <GalleryHome demo={demo} eyebrow="Admissions" />;
    if (type === "beauty") return <GalleryHome demo={demo} eyebrow="Studio" />;
    if (type === "ecommerce") return <GalleryHome demo={demo} eyebrow="Shop" />;
    return <GalleryHome demo={demo} eyebrow={industryLabel(demo)} />;
  }
  if (slug === "contact" || slug === "booking" || slug === "reservations" || slug === "admissions") {
    return <ContactPage demo={demo} title={demo.pages.find((p) => p.slug === slug)?.title ?? "Contact"} />;
  }
  if (slug === "about") return <AboutPage demo={demo} />;
  if (slug === "projects" || slug === "gallery" || slug === "listings" || slug === "shop") {
    return <ProjectsPage demo={demo} />;
  }
  if (slug === "services" || slug === "menu" || slug === "programs" || slug === "rooms") {
    return <ServicesPage demo={demo} />;
  }
  return <InnerPage demo={demo} slug={slug} />;
}

function ConstructionHome({ demo }: { demo: DemoWebsiteRecord }) {
  const photos = stockFor("construction");
  const location = shortLocation(demo);
  return (
    <>
      <section className="relative min-h-[78vh] text-white">
        <DemoPhoto src={photos.hero} alt="" className="absolute inset-0 min-h-[78vh]" caption={false} priority />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/25" />
        <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
            {industryLabel(demo)}
            {location ? ` · ${location}` : ""}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">{demo.content.headline}</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/80 md:text-lg">{displaySubhead(demo)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <DemoLink slug={contactSlugFor(demo)} demoId={demo.demo_id} className="inline-flex rounded-none px-6 py-3 text-sm font-semibold text-white" style={{ background: "var(--p)" }}>
              Request a quote
            </DemoLink>
            {demo.content.phone ? (
              <a
                href={telHref(demo.content.phone)}
                className="inline-flex rounded-none border border-white/40 px-6 py-3 text-sm font-semibold text-white"
              >
                Call {demo.content.phone}
              </a>
            ) : null}
          </div>
          <p className="mt-6 max-w-lg text-[11px] text-white/55">{DEMO_PHOTO_CAPTION}</p>
        </div>
      </section>

      <FactBar demo={demo} dark />

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--p)" }}>
            About
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">Built to show how this company can look online</h2>
          <p className="mt-4 text-base leading-7 opacity-80">{cleanAbout(demo)}</p>
          {demo.content.address ? <p className="mt-4 text-sm opacity-70">{demo.content.address}</p> : null}
        </div>
        <DemoPhoto src={photos.gallery[0]} alt="Demonstration construction photography" className="h-80 rounded-3xl" />
      </section>

      <ServicesBlock demo={demo} />
      <ProjectGallery demo={demo} />
      <QuoteBand demo={demo} />
    </>
  );
}

function GalleryHome({ demo, eyebrow }: { demo: DemoWebsiteRecord; eyebrow: string }) {
  const photos = stockFor(demo.template_key);
  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--p)" }}>
            {eyebrow}
            {shortLocation(demo) ? ` · ${shortLocation(demo)}` : ""}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">{demo.content.headline}</h1>
          <p className="mt-4 text-base leading-7 opacity-80">{displaySubhead(demo)}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <DemoLink
              slug={contactSlugFor(demo)}
              demoId={demo.demo_id}
              className="inline-flex rounded-full px-5 py-2.5 text-sm font-semibold text-white"
              style={{ background: "var(--p)" }}
            >
              {demo.content.cta}
            </DemoLink>
            {demo.content.phone ? (
              <a href={telHref(demo.content.phone)} className="inline-flex rounded-full border px-5 py-2.5 text-sm font-semibold">
                {demo.content.phone}
              </a>
            ) : null}
          </div>
        </div>
        <DemoPhoto src={photos.hero} alt="" className="h-72 rounded-3xl md:h-[26rem]" priority />
      </section>
      <FactBar demo={demo} />
      <ServicesBlock demo={demo} />
      <ProjectGallery demo={demo} />
    </>
  );
}

function RestaurantHome({ demo }: { demo: DemoWebsiteRecord }) {
  const photos = stockFor("restaurant");
  return (
    <>
      <section className="relative h-[70vh] min-h-[28rem] text-white">
        <DemoPhoto src={photos.hero} alt="" className="absolute inset-0 h-full" caption={false} priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="relative flex h-full items-end px-4 pb-12">
          <div className="mx-auto w-full max-w-6xl">
            <h1 className="max-w-2xl text-4xl font-bold md:text-6xl">{demo.content.headline}</h1>
            <p className="mt-3 max-w-xl text-white/80">{displaySubhead(demo)}</p>
            <DemoLink slug={contactSlugFor(demo)} demoId={demo.demo_id} className="mt-6 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold text-white" style={{ background: "var(--p)" }}>
              {demo.content.cta}
            </DemoLink>
            <p className="mt-4 text-[11px] text-white/55">{DEMO_PHOTO_CAPTION}</p>
          </div>
        </div>
      </section>
      <FactBar demo={demo} />
      <ServicesBlock demo={demo} empty="A verified menu has not been supplied, so dishes are not listed." />
      <ProjectGallery demo={demo} />
    </>
  );
}

function FactBar({ demo, dark = false }: { demo: DemoWebsiteRecord; dark?: boolean }) {
  const items = [
    shortLocation(demo) ? { label: "Location", value: shortLocation(demo)! } : null,
    demo.content.phone ? { label: "Phone", value: demo.content.phone } : null,
    demo.content.email ? { label: "Email", value: demo.content.email } : null,
  ].filter(Boolean) as { label: string; value: string }[];
  if (!items.length) return null;
  return (
    <section className={dark ? "bg-[color:var(--s)] text-white" : "border-y bg-white"}>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-50">{item.label}</p>
            <p className="mt-1 text-sm font-medium">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ServicesBlock({ demo, empty }: { demo: DemoWebsiteRecord; empty?: string }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-2xl font-bold tracking-tight">
        {demo.template_key === "restaurant" ? "Menu" : demo.template_key === "school" ? "Programs" : "Services"}
      </h2>
      {demo.content.services.length ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {demo.content.services.map((item) => (
            <div key={item} className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="font-semibold">{item}</h3>
              <p className="mt-2 text-sm opacity-70">Listed because it appeared in verified public records.</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border bg-white p-8">
          <p className="text-sm leading-6 opacity-75">
            {empty ??
              "A verified services list is not on file yet, so this preview does not invent one. Use the quote form to tell the company what you need."}
          </p>
        </div>
      )}
    </section>
  );
}

function ProjectGallery({ demo }: { demo: DemoWebsiteRecord }) {
  const photos = stockFor(demo.template_key);
  return (
    <section className="bg-stone-100 py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-2xl font-bold tracking-tight">How a finished site can look</h2>
        <p className="mt-2 max-w-2xl text-sm opacity-70">{DEMO_PHOTO_CAPTION}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.gallery.slice(0, 6).map((src) => (
            <DemoPhoto key={src} src={src} alt="" className="h-52 rounded-2xl" caption={false} />
          ))}
        </div>
      </div>
    </section>
  );
}

function QuoteBand({ demo }: { demo: DemoWebsiteRecord }) {
  return (
    <section className="px-4 py-16 text-white" style={{ background: "var(--s)" }}>
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ready to talk about a project?</h2>
          <p className="mt-2 max-w-xl text-sm text-white/70">
            This form is part of the unofficial preview. It shows how clients would reach {demo.business_name}.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <DemoLink slug={contactSlugFor(demo)} demoId={demo.demo_id} className="inline-flex px-6 py-3 text-sm font-semibold text-white" style={{ background: "var(--p)" }}>
            Request a quote
          </DemoLink>
          {demo.content.phone ? (
            <a href={waHref(demo.content.phone)} className="inline-flex border border-white/30 px-6 py-3 text-sm font-semibold" target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ServicesPage({ demo }: { demo: DemoWebsiteRecord }) {
  const photos = stockFor(demo.template_key);
  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-start">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            {demo.pages.find((p) => ["services", "menu", "programs", "rooms"].includes(p.slug))?.title ?? "Services"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm opacity-70">
            Only items from verified records are listed. Nothing is invented for this preview.
          </p>
        </div>
        <DemoPhoto src={photos.gallery[1] ?? photos.hero} alt="" className="h-64 rounded-3xl" />
      </section>
      <ServicesBlock demo={demo} />
    </>
  );
}

function ProjectsPage({ demo }: { demo: DemoWebsiteRecord }) {
  return (
    <section className="py-8">
      <div className="mx-auto max-w-6xl px-4 pb-4">
        <h1 className="text-4xl font-bold tracking-tight">Projects</h1>
        <p className="mt-3 max-w-2xl text-sm opacity-70">
          No verified project photos were supplied for {demo.business_name}. The gallery below is demonstration stock so
          you can see the layout of a finished site.
        </p>
      </div>
      <ProjectGallery demo={demo} />
    </section>
  );
}

function AboutPage({ demo }: { demo: DemoWebsiteRecord }) {
  const photos = stockFor(demo.template_key);
  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-start">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">About {demo.business_name}</h1>
        <p className="mt-5 text-base leading-8 opacity-80">{cleanAbout(demo)}</p>
        {demo.content.address ? <p className="mt-6 text-sm opacity-70">{demo.content.address}</p> : null}
        {demo.content.phone ? (
          <a href={telHref(demo.content.phone)} className="mt-4 inline-block text-sm font-semibold" style={{ color: "var(--p)" }}>
            {demo.content.phone}
          </a>
        ) : null}
      </div>
      <DemoPhoto src={photos.gallery[0]} alt="" className="h-96 rounded-3xl" />
    </section>
  );
}

function InnerPage({ demo, slug }: { demo: DemoWebsiteRecord; slug: string }) {
  const page = demo.pages.find((item) => item.slug === slug);
  const photos = stockFor(demo.template_key);
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight">{page?.title ?? slug}</h1>
      <p className="mt-3 max-w-2xl text-sm opacity-70">{page?.purpose}</p>
      <DemoPhoto src={photos.hero} alt="" className="mt-8 h-64 rounded-3xl" />
      <div className="mt-8">
        <ServicesBlock demo={demo} empty="No verified items are available for this section yet." />
      </div>
    </section>
  );
}

function ContactPage({ demo, title }: { demo: DemoWebsiteRecord; title: string }) {
  const photos = stockFor(demo.template_key);
  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm opacity-70">
          This form is part of the unofficial demonstration. Submissions are not delivered to the business.
        </p>
        <dl className="mt-8 space-y-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] opacity-50">Phone</dt>
            <dd className="mt-1 font-medium">{demo.content.phone ?? "Not in public records"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] opacity-50">Email</dt>
            <dd className="mt-1 font-medium">{demo.content.email ?? "Not in public records"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] opacity-50">Address</dt>
            <dd className="mt-1 font-medium">{demo.content.address ?? demo.content.location ?? "Not in public records"}</dd>
          </div>
        </dl>
        {demo.content.phone ? (
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={telHref(demo.content.phone)} className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: "var(--p)" }}>
              Call
            </a>
            <a href={waHref(demo.content.phone)} className="rounded-full border px-4 py-2 text-sm font-semibold" target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </div>
        ) : null}
        <DemoPhoto src={photos.gallery[0]} alt="" className="mt-8 h-48 rounded-2xl" />
      </div>
      <form
        className="space-y-3 rounded-3xl border bg-white p-6 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault();
          window.alert("This enquiry form is a demonstration. Messages are not sent to the business.");
        }}
      >
        <input className="h-11 w-full rounded-xl border px-3 text-sm" placeholder="Your name" />
        <input className="h-11 w-full rounded-xl border px-3 text-sm" placeholder="Your email" />
        <input className="h-11 w-full rounded-xl border px-3 text-sm" placeholder="Phone" />
        <textarea className="min-h-32 w-full rounded-xl border px-3 py-2 text-sm" placeholder="Tell us about the project" />
        <button type="submit" className="h-11 w-full rounded-xl text-sm font-semibold text-white" style={{ background: "var(--p)" }}>
          Send demonstration enquiry
        </button>
        <p className="text-center text-[11px] opacity-50">Not delivered to {demo.business_name}</p>
      </form>
    </section>
  );
}

function DemoFooter({ demo }: { demo: DemoWebsiteRecord }) {
  return (
    <footer className="border-t px-4 py-10 text-center text-xs opacity-60">
      Unofficial preview by ProspectAI · Demo {demo.demo_id} · Expires {demo.expires_at.slice(0, 10)} · Not an official{" "}
      {demo.business_name} website
    </footer>
  );
}

function contactSlugFor(demo: DemoWebsiteRecord) {
  const page = demo.pages.find((item) => ["contact", "booking", "reservations", "admissions"].includes(item.slug));
  return page?.slug && page.slug !== "home" ? page.slug : "contact";
}

function industryLabel(demo: DemoWebsiteRecord) {
  if (demo.template_key === "construction") return "Construction";
  if (demo.industry) return demo.industry.replace(/companies$/i, "").trim();
  return "Professional services";
}

function shortLocation(demo: DemoWebsiteRecord) {
  const raw = demo.content.location ?? demo.content.address;
  if (!raw) return null;
  if (/accra/i.test(raw)) return "Accra, Ghana";
  if (/kumasi/i.test(raw)) return "Kumasi, Ghana";
  if (/ghana/i.test(raw)) return "Ghana";
  const parts = raw.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.slice(-3).join(", ");
}

function displaySubhead(demo: DemoWebsiteRecord) {
  const loc = shortLocation(demo);
  const industry = industryLabel(demo);
  if (loc) return `${industry} company in ${loc}.`;
  return demo.content.subhead.replace(/\s*This page is an unofficial demonstration[^.]*\./gi, "").trim();
}

function cleanAbout(demo: DemoWebsiteRecord) {
  const about = demo.content.about
    .replace(/\s*A fuller company story has not been verified, so it is not shown here\.?/gi, "")
    .replace(/\s*Fields that were not verified are left blank rather than invented\.?/gi, "")
    .trim();
  if (about) return about;
  const where = shortLocation(demo);
  return `${demo.business_name} is ${industryLabel(demo).toLowerCase()}${where ? ` in ${where}` : ""}. This preview uses public records only.`;
}

function telHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("0") ? `233${digits.slice(1)}` : digits;
  return `tel:+${intl}`;
}

function waHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("0") ? `233${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}`;
}
