import type { Metadata } from "next";
import { CoverHero, SourceNote } from "@/components/coverage/CoverHero";
import { OasisChapters } from "@/components/coverage/oasis/OasisChapters";
import { OasisCommunities } from "@/components/coverage/oasis/OasisCommunities";
import { PageFx } from "@/components/site/PageFx";
import { Pic } from "@/components/site/Pic";
import { OASIS } from "@/lib/coverage";

export const metadata: Metadata = {
  title: "Club Oasis",
  description: "Club Oasis: a clubhouse of over 30,000 sq ft reserved for the residents of each Runwal Realty community.",
  alternates: { canonical: "/club-oasis" },
};

export default function ClubOasisPage() {
  return (
    <>
      <PageFx />
      <CoverHero
        crumbs={[{ label: "Club Oasis" }]}
        kicker="Club Oasis"
        title="The sixth"
        accent="sense"
        intro={
          <p>
            {OASIS.headline} {OASIS.sub}
          </p>
        }
        image={OASIS.images.film}
        imageAlt="Club Oasis at Runwal The Central Park"
        meta="Over 30,000 sq ft · Residents only"
      />

      <section className="bg-stone px-6 py-24 md:px-10 md:py-36">
        <div className="grid items-center gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="kicker text-dusk" data-fade>
              The comfort of belonging
            </p>
            <p className="title mt-6 text-3xl leading-tight md:text-4xl" data-split>
              {OASIS.sixthSense}
            </p>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden bg-stone-2 md:col-span-6 md:col-start-7" data-reveal-img>
            <Pic src={OASIS.images.comfort} alt="The comfort of belonging" fill sizes="(min-width: 768px) 48vw, 100vw" />
          </div>
        </div>
      </section>

      <OasisChapters />

      <section className="bg-paper px-6 py-24 md:px-10 md:py-36">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="relative aspect-[4/3] overflow-hidden bg-stone-2 md:col-span-6" data-reveal-img>
            <Pic src={OASIS.images.story} alt="The story of Oasis" fill sizes="(min-width: 768px) 50vw, 100vw" />
          </div>
          <div className="md:col-span-5 md:col-start-8">
            <p className="kicker text-dusk" data-fade>
              The story of Oasis
            </p>
            <p className="mt-6 leading-relaxed text-graphite-2" data-fade>
              {OASIS.story}
            </p>
          </div>
        </div>
      </section>

      <section data-tone="dark" className="bg-graphite px-6 py-24 text-stone md:px-10 md:py-32">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="kicker text-amber" data-fade>
              Where belonging takes shape
            </p>
            <h2 className="display mt-5 text-[11vw] md:text-[min(5vw,6rem)]" data-split>
              Five <span className="accent normal-case">Oases</span>
            </h2>
          </div>
          <p className="max-w-sm text-[0.95rem] leading-relaxed text-stone/65" data-fade>
            Every Oasis is bound to its own neighbourhood and reserved for the families who live there.
          </p>
        </div>
        <OasisCommunities />
        <SourceNote href={OASIS.source} />
      </section>
    </>
  );
}
