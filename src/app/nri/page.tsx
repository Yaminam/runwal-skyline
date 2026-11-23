import type { Metadata } from "next";
import { CoverHero, SourceNote } from "@/components/coverage/CoverHero";
import { GlobeSection } from "@/components/coverage/nri/GlobeSection";
import { Counter } from "@/components/site/Counter";
import { PageFx } from "@/components/site/PageFx";
import { Pic } from "@/components/site/Pic";
import { TLink } from "@/components/site/Transition";
import { NRI } from "@/lib/coverage";

export const metadata: Metadata = {
  title: "NRI Corner",
  description: "Why NRIs are investing in Indian residential real estate, and Runwal Realty's record of partnering with global investors.",
  alternates: { canonical: "/nri" },
};

export default function NriPage() {
  return (
    <>
      <PageFx />
      <CoverHero
        crumbs={[{ label: "NRI Corner" }]}
        kicker="NRI corner"
        title="Home, from"
        accent="anywhere"
        intro={<p>For Indians abroad: why the market is strong, what has changed, and how to reach the Runwal team from your time zone.</p>}
        image={NRI.images.hero}
        imageAlt="Keys to a new home"
      />

      <section data-tone="dark" className="relative overflow-hidden bg-night px-6 py-16 text-stone md:px-10 md:py-24">
        <div className="blueprint-dark pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div className="relative">
          <GlobeSection />
        </div>
      </section>

      <section className="bg-stone px-6 py-24 md:px-10 md:py-36">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="kicker text-dusk" data-fade>
              Why India
            </p>
            <h2 className="display mt-5 text-[11vw] md:text-[min(5vw,6rem)]" data-split>
              The best time <span className="accent normal-case">to invest</span>
            </h2>
            <p className="mt-6 max-w-md leading-relaxed text-graphite-2" data-fade>
              {NRI.whyIndia}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-px self-end bg-graphite/15 md:col-span-6 md:col-start-7">
            {NRI.figures.map((f) => (
              <div key={f.label + f.span} className="min-w-0 bg-stone p-5 md:p-8" data-fade>
                <dd className="display whitespace-nowrap text-[1.9rem] tabular-nums sm:text-5xl md:text-6xl">
                  <Counter to={f.v} decimals={2} />%
                </dd>
                <dt className="mt-3 text-sm">{f.label}</dt>
                <dt className="kicker mt-1 text-mute">{f.span}</dt>
              </div>
            ))}
          </dl>
        </div>
        <p className="kicker mt-6 text-mute/80">Indian residential real estate, as published on runwalrealty.com</p>
      </section>

      <section className="bg-paper px-6 py-24 md:px-10 md:py-36">
        <div className="grid items-center gap-12 md:grid-cols-12">
          <div className="relative aspect-[4/3] overflow-hidden bg-stone-2 md:col-span-6" data-reveal-img>
            <Pic src={NRI.images.growth} alt="Residential towers under construction" fill sizes="(min-width: 768px) 50vw, 100vw" />
          </div>
          <div className="md:col-span-5 md:col-start-8">
            <p className="kicker text-dusk" data-fade>
              Privileges
            </p>
            <h2 className="title mt-4 text-4xl md:text-5xl" data-split>
              Growth story of <span className="accent">real estate</span>
            </h2>
            <p className="mt-6 leading-relaxed text-graphite-2" data-fade>
              {NRI.growthIntro}
            </p>
            <ol className="mt-8">
              {NRI.growth.map((g, i) => (
                <li key={g} className="grid grid-cols-[2.5rem_1fr] gap-3 border-t border-graphite/15 py-4 last:border-b" data-fade>
                  <span className="kicker text-amber-deep">0{i + 1}</span>
                  <span className="text-[0.95rem]">{g}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section data-tone="dark" className="relative overflow-hidden bg-night px-6 py-24 text-stone md:px-10 md:py-36">
        <div className="blueprint-dark pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div className="relative">
          <p className="kicker text-amber" data-fade>
            Building a legacy on strong partnerships
          </p>
          <h2 className="display mt-5 max-w-4xl text-[11vw] md:text-[min(5vw,6rem)]" data-split>
            Trusted by <span className="accent normal-case">global capital</span>
          </h2>
          <ul className="mt-14 grid gap-px bg-stone/10 md:grid-cols-2">
            {NRI.partnerships.map((p, i) => (
              <li key={i} className="bg-night p-6 md:p-10" data-fade>
                <span className="kicker text-amber">0{i + 1}</span>
                <p className="mt-4 leading-relaxed text-stone/80">{p}</p>
              </li>
            ))}
          </ul>
          <div className="mt-14 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="title max-w-xl text-2xl md:text-3xl">Talk to the Runwal team about a home in India.</p>
            <TLink href="/enquire" className="inline-flex items-center gap-3 self-start bg-stone px-6 py-4 text-sm font-medium text-graphite transition-colors hover:bg-amber">
              Write to us &rarr;
            </TLink>
          </div>
          <SourceNote href={NRI.source} />
        </div>
      </section>
    </>
  );
}
