import type { Metadata } from "next";
import { CoverHero, SourceNote } from "@/components/coverage/CoverHero";
import { CsrMosaic } from "@/components/coverage/csr/CsrMosaic";
import { CsrScrub } from "@/components/coverage/csr/CsrScrub";
import { PageFx } from "@/components/site/PageFx";
import { TLink } from "@/components/site/Transition";
import { CSR } from "@/lib/coverage";

export const metadata: Metadata = {
  title: "CSR",
  description: "Runwal Realty's corporate social responsibility: quality learning opportunities and access to essential healthcare.",
  alternates: { canonical: "/about/csr" },
};

export default function CsrPage() {
  return (
    <>
      <PageFx />
      <CoverHero
        crumbs={[{ href: "/legacy", label: "About" }, { label: "CSR" }]}
        kicker="Corporate social responsibility"
        title="Fostering"
        accent="positive impact"
        intro={<p>{CSR.intro}</p>}
        image={CSR.banner}
        imageAlt="Runwal Realty CSR"
      />
      <CsrScrub />
      <CsrMosaic />
      <section className="bg-stone px-6 py-24 md:px-10 md:py-36">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="kicker text-dusk" data-fade>
              Governance
            </p>
            <h2 className="title mt-4 text-4xl md:text-6xl" data-split>
              The CSR <span className="accent">committee</span>
            </h2>
            <p className="mt-6 max-w-md text-[0.95rem] leading-relaxed text-graphite-2" data-fade>
              Members of the Corporate Social Responsibility Committee of the Board of Runwal Developers Limited, as published on the investors page.
            </p>
            <a
              href={CSR.policy}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-3 bg-graphite px-6 py-4 text-sm font-medium text-stone transition-colors hover:bg-dusk"
              data-fade
            >
              Read the CSR policy (PDF) <span>&#8599;</span>
            </a>
          </div>
          <ul className="md:col-span-6 md:col-start-7">
            {CSR.committee.map((m, i) => (
              <li key={m.name} className="grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-4 border-t border-graphite/15 py-6 last:border-b" data-fade>
                <span className="kicker text-mute">0{i + 1}</span>
                <span>
                  <span className="title block text-2xl">{m.name}</span>
                  <span className="kicker mt-1 block text-mute">{m.role}</span>
                </span>
                <span className={`kicker ${m.seat === "Chairperson" ? "text-amber-deep" : "text-mute"}`}>{m.seat}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-20 flex flex-col items-start justify-between gap-6 border-t border-graphite/15 pt-10 md:flex-row md:items-center">
          <p className="title max-w-xl text-2xl md:text-3xl">The Runwal story, from one home in Thane in 1978.</p>
          <TLink href="/legacy" className="border border-graphite/25 px-6 py-4 text-sm font-medium transition-colors hover:border-graphite">
            Read our legacy &rarr;
          </TLink>
        </div>
        <SourceNote href={CSR.source} />
      </section>
    </>
  );
}
