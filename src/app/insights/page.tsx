import type { Metadata } from "next";
import { CoverHero, SourceNote } from "@/components/coverage/CoverHero";
import { InsightsBrowser } from "@/components/coverage/InsightsBrowser";
import { PageFx } from "@/components/site/PageFx";
import { ARTICLES, fmtDate, readMinutes } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Insights",
  description: "Blogs, press releases, digital coverage, print and video coverage of Runwal Realty.",
  alternates: { canonical: "/insights" },
};

export default function InsightsPage() {
  return (
    <>
      <PageFx />
      <CoverHero
        crumbs={[{ label: "Insights" }]}
        kicker="Our insights"
        title="Notes from"
        accent="the city"
        intro={<p>Long reads from the Runwal desk, and what the press has written and filmed about Runwal Realty.</p>}
        meta="Blogs · Digital coverage · Press · Print & video · Awards"
      />
      <InsightsBrowser
        blogs={ARTICLES.map((a) => ({ slug: a.slug, title: a.title, date: fmtDate(a.date), mins: readMinutes(a), cover: a.cover, excerpt: a.description }))}
      />
      <div className="bg-stone px-6 pb-20 md:px-10">
        <SourceNote href="https://runwalrealty.com/our-insights/print-video-coverage/" />
      </div>
    </>
  );
}
