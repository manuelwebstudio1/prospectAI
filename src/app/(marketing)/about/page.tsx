import type { Metadata } from "next";
import { PageIntro } from "@/components/marketing/page-intro";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <PageIntro
        eyebrow="About"
        title={
          <>
            About <em className="italic">ProspectAI</em>
          </>
        }
        description="At ProspectAI, we believe finding clients shouldn't be the hardest part of building a successful web development business."
      />

      <div className="mt-12 space-y-5 text-base leading-7 text-[#3f3a36]">
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

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        <article className="marketing-card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e85a2a]">Our Mission</p>
          <p className="mt-3 text-sm leading-6 text-[#3f3a36]">
            Our mission is to empower web developers, freelancers and digital agencies with intelligent tools that simplify client acquisition, eliminate repetitive prospecting tasks and create more opportunities for business growth.
          </p>
        </article>
        <article className="marketing-card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e85a2a]">Our Vision</p>
          <p className="mt-3 text-sm leading-6 text-[#3f3a36]">
            We envision a world where every developer, regardless of their experience, location or resources, has access to intelligent technology that helps them discover opportunities, showcase their capabilities and build sustainable businesses.
          </p>
        </article>
      </div>
    </section>
  );
}
