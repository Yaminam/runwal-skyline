import { COMMERCIAL } from "@/lib/projects";
import { Pic } from "../site/Pic";
import { TLink } from "../site/Transition";

const andheri = COMMERCIAL.find((p) => p.slug === "r-square-andheri") ?? COMMERCIAL[0];

const PLACES = [
  { k: "Retail", name: "R City", where: "Ghatkopar West", line: "Mumbai's landmark mall on 28 acres, opened in 2009." },
  { k: "Retail", name: "R Mall", where: "Thane West & Mulund West", line: "Runwal's first mall opened in Mulund in 2003." },
  { k: "Retail", name: "R Odeon", where: "Ghatkopar East", line: "A neighbourhood retail address in the eastern suburbs." },
  { k: "Offices", name: "R Square", where: "Andheri East & Mulund West", line: "IGBC-certified office addresses on the city's business corridors." },
  { k: "Hotels", name: "Hospitality", where: "Worli · Thane · Pune · Alibaug", line: "Hotels in development under the Runwal name." },
];

/** Beyond homes: the malls, offices and hotels, on graphite. */
export function Beyond() {
  return (
    <section data-tone="dark" className="relative overflow-hidden bg-graphite text-stone">
      <div className="blueprint-dark absolute inset-0 opacity-60" aria-hidden />
      <div className="relative grid gap-12 px-6 py-28 md:grid-cols-12 md:px-10 md:py-40">
        <div className="md:col-span-5">
          <p className="kicker mb-6 text-amber">Beyond homes</p>
          <h2 data-split className="display text-[11vw] md:text-[min(5.4vw,6.4rem)]">
            Where the city shops, works &amp; <span className="accent normal-case">stays</span>
          </h2>
          <p data-fade className="mt-8 max-w-md leading-relaxed text-stone/70">
            Runwal built Mumbai&rsquo;s first generation of modern malls, and now builds offices and hotels. 2.89 million sq ft of
            commercial and retail space has been handed over so far.
          </p>
          <TLink href="/places" data-fade className="mt-10 inline-flex items-center gap-3 border border-stone/25 px-6 py-4 text-sm font-medium transition-colors hover:border-amber hover:text-amber">
            Explore Runwal places <span>&rarr;</span>
          </TLink>
        </div>

        <div className="md:col-span-7">
          <div data-reveal-img className="relative aspect-[16/9] overflow-hidden">
            <Pic src={andheri.images.hero} alt={`${andheri.name}, ${andheri.area}`} fill sizes="(min-width: 768px) 58vw, 100vw" />
            <span className="kicker absolute bottom-4 left-4 bg-graphite/80 px-2.5 py-1.5 text-stone backdrop-blur">{andheri.name} &middot; {andheri.area}</span>
          </div>
          <ul className="mt-10">
            {PLACES.map((p) => (
              <li key={p.name} data-fade className="grid grid-cols-[5rem_1fr] gap-4 border-t border-stone/15 py-5 md:grid-cols-[6rem_12rem_1fr]">
                <span className="kicker text-amber">{p.k}</span>
                <span className="title text-xl">{p.name}</span>
                <span className="col-start-2 text-sm text-stone/65 md:col-start-3">
                  <span className="text-stone/90">{p.where}.</span> {p.line}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
