import type { Metadata } from "next";
import { ContactMapSection } from "@/components/coverage/contact/ContactMapSection";
import { CopyLine } from "@/components/coverage/CopyLine";
import { CoverHero, SourceNote } from "@/components/coverage/CoverHero";
import { PageFx } from "@/components/site/PageFx";
import { Pic } from "@/components/site/Pic";
import { TLink } from "@/components/site/Transition";
import { CONTACT_PAGE } from "@/lib/coverage";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Runwal Realty: corporate office in Sion (East), Mumbai, sales enquiries and site addresses.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageFx />
      <CoverHero
        crumbs={[{ label: "Contact" }]}
        kicker="Reach us"
        title="Come and"
        accent="say hello"
        intro={<p>Our corporate office is in Sion (East), Mumbai, and every Runwal address has its own site office. Call, write or visit.</p>}
      />

      <section className="bg-stone px-6 pb-24 md:px-10 md:pb-32">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="kicker text-dusk" data-fade>
              Corporate office
            </p>
            <p className="title mt-5 text-2xl leading-snug md:text-3xl" data-fade>
              {CONTACT_PAGE.office}
            </p>
            <a
              href={CONTACT_PAGE.officeMap}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-3 bg-graphite px-6 py-4 text-sm font-medium text-stone transition-colors hover:bg-dusk"
              data-fade
            >
              Get directions &#8599;
            </a>
            <div className="mt-12" data-fade>
              <CopyLine label="Sales enquiry" value={CONTACT_PAGE.sales} href={`tel:${CONTACT_PAGE.salesHref}`} />
              <CopyLine label="Landline" value={CONTACT_PAGE.landline} href={`tel:${CONTACT_PAGE.landlineHref}`} />
              <CopyLine label="Fax" value={CONTACT_PAGE.fax} />
              <CopyLine label="Email" value={CONTACT_PAGE.email} href={`mailto:${CONTACT_PAGE.email}`} />
            </div>
            <TLink href="/enquire" className="mt-10 inline-flex items-center gap-3 border border-graphite/25 px-6 py-4 text-sm font-medium transition-colors hover:border-graphite">
              Book a site visit &rarr;
            </TLink>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden bg-stone-2 md:col-span-5 md:col-start-8" data-reveal-img>
            <Pic src={CONTACT_PAGE.image} alt="Runwal Realty corporate office" fill sizes="(min-width: 768px) 40vw, 100vw" />
          </div>
        </div>
      </section>

      <section data-tone="dark" className="bg-graphite px-6 py-24 text-stone md:px-10 md:py-32">
        <p className="kicker text-amber" data-fade>
          Presence &middot; site addresses
        </p>
        <h2 className="display mt-5 text-[11vw] md:text-[min(5vw,6rem)]" data-split>
          Every site, <span className="accent normal-case">on the map</span>
        </h2>
        <p className="mt-5 max-w-xl text-[0.95rem] leading-relaxed text-stone/65" data-fade>
          The corporate office and every Runwal site office. Pick one to fly there, or open directions in Google Maps.
        </p>
        <div className="mt-12">
          <ContactMapSection />
        </div>
        <SourceNote href="https://runwalrealty.com/contact-us/" />
      </section>
    </>
  );
}
