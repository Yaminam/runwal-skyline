import type { Metadata } from "next";
import { CoverHero, SourceNote } from "@/components/coverage/CoverHero";
import { LifeReel } from "@/components/coverage/careers/LifeReel";
import { OpeningsTower } from "@/components/coverage/careers/OpeningsTower";
import { Openings } from "@/components/coverage/Openings";
import { PageFx } from "@/components/site/PageFx";
import { CAREERS, OPENINGS } from "@/lib/coverage";

export const metadata: Metadata = {
  title: "Careers",
  description: "Work at Runwal Realty: our culture, life at Runwal and current openings.",
  alternates: { canonical: "/careers" },
};

export default function CareersPage() {
  return (
    <>
      <PageFx />
      <CoverHero
        crumbs={[{ label: "Careers" }]}
        kicker="Work at Runwal Realty"
        title="Our people,"
        accent="our pride"
        intro={<p>{CAREERS.intro}</p>}
        image={CAREERS.banner}
        imageAlt="The Runwal Realty team"
        meta={`${OPENINGS.length} open roles`}
      />

      <section className="bg-stone px-6 py-24 md:px-10 md:py-32">
        <p className="kicker text-dusk" data-fade>
          Cultivating a dynamic and empowering workplace
        </p>
        <ul className="mt-8 grid gap-px bg-graphite/15 sm:grid-cols-2 lg:grid-cols-3">
          {CAREERS.values.map((v, i) => (
            <li key={v.k} className="bg-stone p-6 md:p-8" data-fade>
              <span className="kicker text-amber-deep">0{i + 1}</span>
              <p className="title mt-4 text-2xl">{v.k}</p>
              <p className="mt-2 text-sm leading-relaxed text-graphite-2">{v.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section data-tone="dark" className="bg-graphite px-6 py-24 text-stone md:px-10 md:py-32">
        <p className="kicker text-amber" data-fade>
          Life at Runwal
        </p>
        <h2 className="display mt-5 text-[11vw] md:text-[min(5vw,6rem)]" data-split>
          Our team, <span className="accent normal-case">our strength</span>
        </h2>
        <div className="mt-12">
          <LifeReel />
        </div>
      </section>

      <OpeningsTower />

      <section className="bg-stone px-6 py-24 md:px-10 md:py-32">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="kicker text-dusk" data-fade>
              Every role, as a list
            </p>
            <h2 className="display mt-5 text-[11vw] md:text-[min(5vw,6rem)]" data-split>
              Work <span className="accent normal-case">with us</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-mute" data-fade>
            Applications are taken on runwalrealty.com. You can also write to{" "}
            <a className="ulink text-graphite" href={`mailto:${CAREERS.email}`}>
              {CAREERS.email}
            </a>
            .
          </p>
        </div>
        <Openings />
        <SourceNote href={CAREERS.apply} />
      </section>
    </>
  );
}
