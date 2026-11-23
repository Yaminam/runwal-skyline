import type { Metadata } from "next";
import { CoverHero, SourceNote } from "@/components/coverage/CoverHero";
import { LoyaltyStudio } from "@/components/coverage/customers/LoyaltyStudio";
import { ReferralFlow } from "@/components/coverage/customers/ReferralFlow";
import { SpecialistTiles } from "@/components/coverage/customers/SpecialistTiles";
import { PageFx } from "@/components/site/PageFx";
import { Pic } from "@/components/site/Pic";
import { LOYALIST, SPECIALISTS } from "@/lib/coverage";

export const metadata: Metadata = {
  title: "Customer Corner",
  description: "R Loyalist, the Runwal Realty loyalty and referral programme, and The Specialists, the channel partner programme.",
  alternates: { canonical: "/customers" },
};

export default function CustomersPage() {
  return (
    <>
      <PageFx />
      <CoverHero
        crumbs={[{ label: "Customer Corner" }]}
        kicker="Customer corner"
        title="Belonging,"
        accent="rewarded"
        intro={<p>Two programmes for the people who already know Runwal: R Loyalist for our homeowners, and The Specialists for our channel partners.</p>}
        meta={
          <span className="flex flex-wrap gap-4">
            <a href="#r-loyalist" className="ulink">
              R Loyalist
            </a>
            <a href="#specialists" className="ulink">
              The Specialists
            </a>
          </span>
        }
      />

      {/* R Loyalist */}
      <section id="r-loyalist" className="scroll-mt-24 bg-stone px-6 py-20 md:px-10 md:py-32">
        <div className="grid gap-14 md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="kicker text-dusk" data-fade>
              01 &middot; R Loyalist
            </p>
            <h2 className="display mt-5 text-[11vw] md:text-[min(5vw,6rem)]" data-split>
              Loyalty, <span className="accent normal-case">rewarded</span>
            </h2>
            <p className="mt-6 max-w-md leading-relaxed text-graphite-2" data-fade>
              {LOYALIST.title}. {LOYALIST.intro}
            </p>
            <ul className="mt-10 grid grid-cols-3 gap-3" data-fade>
              {LOYALIST.benefits.map((b) => (
                <li key={b.k} className="border border-graphite/15 p-4">
                  <span className="display block text-4xl text-amber-deep md:text-5xl">{b.pct}%</span>
                  <span className="kicker mt-2 block text-graphite">{b.k}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-relaxed text-mute" data-fade>
              {LOYALIST.eligibility}
            </p>
          </div>
        </div>

        <div className="mt-16 md:mt-24" data-fade>
          <LoyaltyStudio />
        </div>

        <div className="mt-24 md:mt-32">
          <p className="kicker text-mute" data-fade>
            How to earn &middot; 4 easy steps
          </p>
          <div className="mt-12">
            <ReferralFlow />
          </div>
        </div>

        <div className="mt-16 grid items-center gap-10 md:grid-cols-12">
          <div className="relative aspect-[16/9] overflow-hidden bg-stone-2 md:col-span-7" data-reveal-img>
            <Pic src={LOYALIST.image} alt="R Loyalist rewards" fill sizes="(min-width: 768px) 58vw, 100vw" className="object-bottom" />
          </div>
          <div className="md:col-span-4 md:col-start-9" data-fade>
            <p className="kicker text-dusk">Refer or ask</p>
            <p className="title mt-3 text-3xl">The R Loyalist desk</p>
            <ul className="mt-6 flex flex-col gap-3 text-[0.95rem]">
              <li>
                <a href={`mailto:${LOYALIST.email}`} className="ulink">
                  {LOYALIST.email}
                </a>
              </li>
              <li>
                <a href={`tel:${LOYALIST.phoneHref}`} className="ulink">
                  {LOYALIST.phone}
                </a>
              </li>
            </ul>
            <a
              href={LOYALIST.source}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-3 bg-graphite px-6 py-4 text-sm font-medium text-stone transition-colors hover:bg-dusk"
            >
              Open the referral form &#8599;
            </a>
          </div>
        </div>
      </section>

      {/* The Specialists */}
      <section id="specialists" data-tone="dark" className="relative scroll-mt-24 overflow-hidden bg-graphite px-6 py-24 text-stone md:px-10 md:py-36">
        <div className="blueprint-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="relative grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="kicker text-amber" data-fade>
              02 &middot; For channel partners
            </p>
            <h2 className="display mt-5 text-[11vw] md:text-[min(5vw,6rem)]" data-split>
              The <span className="accent normal-case">Specialists</span>
            </h2>
            <p className="mt-6 max-w-md leading-relaxed text-stone/75" data-fade>
              {SPECIALISTS.intro}
            </p>
            <div className="relative mt-10 aspect-[4/3] overflow-hidden" data-reveal-img>
              <Pic src={SPECIALISTS.image} alt="Runwal Realty and channel partners" fill sizes="(min-width: 768px) 40vw, 100vw" />
            </div>
          </div>
          <div className="md:col-span-6 md:col-start-7">
            <p className="kicker text-stone/50" data-fade>
              Programme benefits
            </p>
            <div className="mt-6">
              <SpecialistTiles />
            </div>
            <p className="mt-8 text-sm leading-relaxed text-stone/60" data-fade>
              {SPECIALISTS.enrol}
            </p>
            <a
              href={SPECIALISTS.source}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-3 bg-stone px-6 py-4 text-sm font-medium text-graphite transition-colors hover:bg-amber"
              data-fade
            >
              Enrol as a Specialist &#8599;
            </a>
          </div>
        </div>
      </section>
      <div className="bg-stone px-6 pb-16 md:px-10">
        <SourceNote href={LOYALIST.source} />
      </div>
    </>
  );
}
