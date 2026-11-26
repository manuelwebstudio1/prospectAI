import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-8 sm:py-20 lg:px-10">
      <div className="max-w-none">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#eadfd6] bg-white/80 px-3.5 py-1 text-sm text-[#3f3a36] shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[#e85a2a]" />
          About
        </p>
        <h1 className="font-display text-5xl leading-[1.12] tracking-[-0.03em] text-[#1c1917] sm:text-6xl lg:text-7xl">
          About <em className="italic">ProspectAI</em>
        </h1>
        <p className="mt-8 text-xl leading-9 text-[#3f3a36] sm:text-2xl sm:leading-10">
          At ProspectAI, we believe finding clients shouldn't be the hardest part of building a successful web development business.
        </p>
      </div>

      <div className="mt-10 space-y-8 text-lg leading-9 text-[#3f3a36] sm:text-xl sm:leading-10">
        <p>
          We are building an AI-powered business discovery and client acquisition platform designed to transform how developers find opportunities, connect with businesses and grow their businesses.
        </p>
        <p>
          Our platform uses artificial intelligence to discover businesses, research their operations, identify gaps in their online presence and automatically generate personalized website demonstrations that developers can present to potential clients.
        </p>
        <p>
          Instead of spending countless hours manually searching for prospects, researching businesses and creating demonstrations from scratch, developers can leverage ProspectAI to automate much of the process and focus on what matters most: building relationships and closing deals.
        </p>
      </div>

      <div className="mt-16 grid gap-6 lg:grid-cols-2">
        <article className="marketing-card p-8 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#e85a2a]">Our Mission</p>
          <p className="mt-4 text-lg leading-9 text-[#3f3a36] sm:text-xl sm:leading-10">
            Our mission is to empower web developers, freelancers and digital agencies with intelligent tools that simplify client acquisition, eliminate repetitive prospecting tasks and create more opportunities for business growth.
          </p>
        </article>
        <article className="marketing-card p-8 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#e85a2a]">Our Vision</p>
          <p className="mt-4 text-lg leading-9 text-[#3f3a36] sm:text-xl sm:leading-10">
            We envision a world where every developer, regardless of their experience, location or resources, has access to intelligent technology that helps them discover opportunities, showcase their capabilities and build sustainable businesses.
          </p>
        </article>
      </div>
    </section>
  );
}
