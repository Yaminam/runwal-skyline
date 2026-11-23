import type { Metadata } from "next";
import { CoverHero, SourceNote } from "@/components/coverage/CoverHero";
import { DocVault } from "@/components/coverage/investors/DocVault";
import { IpoStory } from "@/components/coverage/investors/IpoStory";
import { RecordSection } from "@/components/coverage/investors/RecordSection";
import { PageFx } from "@/components/site/PageFx";
import { INVESTORS } from "@/lib/coverage";

export const metadata: Metadata = {
  title: "Investors",
  description: "Runwal Developers Limited investor relations: DRHP details, financials, annual reports, governance and investor contacts.",
  alternates: { canonical: "/investors" },
};

export default function InvestorsPage() {
  return (
    <>
      <PageFx />
      <CoverHero
        crumbs={[{ label: "Investors" }]}
        kicker="Investor relations"
        title="Shaping the future of"
        accent="real estate"
        intro={<p>{INVESTORS.company}. Company and IPO details as per the Draft Red Herring Prospectus dated 30 September 2025.</p>}
        meta={`CIN ${INVESTORS.cin}`}
      />

      <IpoStory />

      <section data-tone="dark" className="relative bg-graphite px-6 pb-20 text-stone md:px-10 md:pb-28">
        <p className="max-w-3xl text-sm leading-relaxed text-stone/65">{INVESTORS.structure}</p>
        <dl className="mt-10 grid gap-px bg-stone/10 md:grid-cols-3">
          <div className="bg-graphite p-6">
            <dt className="kicker text-stone/50">Promoter</dt>
            <dd className="title mt-3 text-xl">{INVESTORS.promoter}</dd>
          </div>
          <div className="bg-graphite p-6">
            <dt className="kicker text-stone/50">Book running lead managers</dt>
            <dd className="mt-3 text-sm leading-relaxed text-stone/85">{INVESTORS.managers.join(", ")}</dd>
          </div>
          <div className="bg-graphite p-6">
            <dt className="kicker text-stone/50">Registrar</dt>
            <dd className="mt-3 text-sm leading-relaxed text-stone/85">{INVESTORS.registrar}</dd>
          </div>
        </dl>
        <p className="mt-8 max-w-3xl text-xs leading-relaxed text-stone/50">{INVESTORS.disclaimer}</p>
      </section>

      <RecordSection />

      <section className="bg-stone px-6 py-24 md:px-10 md:py-32">
        <p className="kicker text-dusk" data-fade>
          Documents
        </p>
        <h2 className="display mb-10 mt-5 text-[11vw] md:text-[min(5vw,6rem)]" data-split>
          The <span className="accent normal-case">vault</span>
        </h2>
        <DocVault />
      </section>

      <section className="bg-paper px-6 py-24 md:px-10 md:py-32">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="kicker text-dusk" data-fade>
              Board committees
            </p>
            <div className="mt-8 grid gap-px bg-graphite/15 sm:grid-cols-2">
              {INVESTORS.committees.map((c) => (
                <div key={c.name} className="bg-paper p-6" data-fade>
                  <p className="title text-xl">{c.name}</p>
                  <ul className="mt-4 flex flex-col gap-2 text-sm">
                    {c.members.map(([n, r]) => (
                      <li key={n} className="flex justify-between gap-3">
                        <span>{n}</span>
                        <span className={`kicker ${r === "Chairperson" ? "text-amber-deep" : "text-mute"}`}>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="md:col-span-4 md:col-start-9">
            <p className="kicker text-dusk" data-fade>
              Investor contact
            </p>
            <div className="mt-8 border border-graphite/15 p-6" data-fade>
              <p className="title text-2xl">{INVESTORS.contact.name}</p>
              <p className="kicker mt-1 text-mute">{INVESTORS.contact.role}</p>
              <p className="mt-5 text-sm leading-relaxed text-graphite-2">{INVESTORS.contact.address}</p>
              <ul className="mt-5 flex flex-col gap-2 text-sm">
                <li>
                  <a className="ulink" href={`tel:${INVESTORS.contact.phoneHref}`}>
                    {INVESTORS.contact.phone}
                  </a>
                </li>
                <li>
                  <a className="ulink" href={`mailto:${INVESTORS.contact.email}`}>
                    {INVESTORS.contact.email}
                  </a>
                </li>
              </ul>
            </div>
            <div className="mt-4 border border-graphite/15 p-6" data-fade>
              <p className="kicker text-mute">Registrar to the offer</p>
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                <li className="break-all">
                  <a className="ulink" href={`mailto:${INVESTORS.registrarContact.email}`}>
                    {INVESTORS.registrarContact.email}
                  </a>
                </li>
                <li>
                  <a className="ulink" href={`tel:${INVESTORS.registrarContact.phoneHref}`}>
                    {INVESTORS.registrarContact.phone}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <SourceNote href={INVESTORS.source} />
      </section>
    </>
  );
}
