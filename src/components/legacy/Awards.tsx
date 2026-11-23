"use client";

import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useMemo, useState } from "react";
import { AWARDS } from "@/lib/company";
import { Counter } from "../site/Counter";

/** Awards wall: a count, a year filter and the full list, with a slow marquee of honours on top. */
export function Awards() {
  const years = useMemo(() => ["All", ...Array.from(new Set(AWARDS.map((a) => a.year.slice(0, 4))))], []);
  const [year, setYear] = useState("All");
  const [all, setAll] = useState(false);
  const filtered = year === "All" ? AWARDS : AWARDS.filter((a) => a.year.startsWith(year));
  const list = all || year !== "All" ? filtered : filtered.slice(0, 9);
  const marquee = AWARDS.slice(0, 10);

  // the list changes height: let pinned sections below re-measure
  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [all, year]);

  return (
    <section data-tone="dark" className="relative overflow-hidden bg-night py-28 text-stone md:py-40">
      <div className="overflow-hidden border-y border-stone/10 py-5" aria-hidden>
        <div className="marquee flex w-max gap-12 whitespace-nowrap">
          {[...marquee, ...marquee].map((a, i) => (
            <span key={i} className="title flex items-center gap-12 text-2xl text-stone/80 md:text-3xl">
              {a.award}
              <span className="inline-block size-1.5 rotate-45 bg-amber" />
            </span>
          ))}
        </div>
      </div>

      <div className="mt-20 grid gap-14 px-6 md:grid-cols-12 md:px-10">
        <div className="md:col-span-4">
          <p className="kicker text-amber">Built with purpose, recognised with pride</p>
          <p className="display mt-6 text-[34vw] leading-[0.8] md:text-[min(15vw,17rem)]">
            <Counter to={AWARDS.length} />
          </p>
          <p className="mt-4 max-w-xs text-[0.95rem] leading-relaxed text-stone/60">
            Honours across homes, offices and malls, from Realty+, ET, MAPIC India, the Asia Pacific Property Awards and Forbes India.
          </p>
          <div className="mt-10 flex flex-wrap gap-2" role="tablist" aria-label="Filter awards by year">
            {years.map((y) => (
              <button
                key={y}
                type="button"
                role="tab"
                aria-selected={y === year}
                onClick={() => setYear(y)}
                className={`kicker border px-3 py-2 transition-colors duration-300 ${y === year ? "border-amber bg-amber text-graphite" : "border-stone/20 text-stone/70 hover:border-stone/60"}`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-7 md:col-start-6">
        <ul>
          {list.map((a) => (
            <li key={`${a.year}-${a.award}-${a.project}`} className="group grid grid-cols-[5.75rem_1fr] gap-4 border-b border-stone/10 py-5 transition-colors hover:border-amber/50 md:grid-cols-[6.5rem_1fr_14rem]">
              <span className="kicker whitespace-nowrap pt-1 text-stone/45">{a.year}</span>
              <span>
                <span className="block text-[1.05rem] leading-snug transition-colors group-hover:text-amber">{a.award}</span>
                {a.event && <span className="mt-1 block text-sm text-stone/45">{a.event}</span>}
              </span>
              <span className="kicker col-start-2 text-stone/60 md:col-start-3 md:pt-1 md:text-right">{a.project}</span>
            </li>
          ))}
        </ul>
        {year === "All" && !all && (
          <button type="button" onClick={() => setAll(true)} className="group mt-8 flex items-center gap-3 text-sm text-stone/80 transition-colors hover:text-amber">
            Show all {AWARDS.length} honours
            <span className="transition-transform duration-500 group-hover:translate-y-0.5">&darr;</span>
          </button>
        )}
        </div>
      </div>
    </section>
  );
}
