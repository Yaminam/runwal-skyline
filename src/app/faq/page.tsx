import type { Metadata } from "next";
import { CoverHero, SourceNote } from "@/components/coverage/CoverHero";
import { FaqSearch } from "@/components/coverage/FaqSearch";
import { PageFx } from "@/components/site/PageFx";
import { FAQS } from "@/lib/coverage";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Frequently asked questions about Runwal Realty, its residences, offices, Club Oasis, R Loyalist, awards and the proposed IPO.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <>
      <PageFx />
      <CoverHero
        crumbs={[{ label: "FAQs" }]}
        kicker="Frequently asked"
        title="Ask"
        accent="anything"
        intro={<p>Every question answered across runwalrealty.com, in one place. Start typing to search.</p>}
        meta={`${FAQS.length} answers`}
      />
      <section className="bg-stone px-6 pb-28 md:px-10 md:pb-40">
        <FaqSearch />
        <SourceNote href="https://runwalrealty.com/faq/" />
      </section>
    </>
  );
}
