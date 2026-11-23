"use client";

import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { STATS, STATS_SOURCE } from "@/lib/company";
import { whenRevealed } from "@/lib/gate";
import { clamp, prefersReducedMotion } from "@/lib/motion";
import { recordState } from "../../three/RecordCity";

const RecordCity = dynamic(() => import("../../three/RecordCity"), { ssr: false });

// the four DRHP figures, each tied to the district that rises for it (windows match RecordCity)
const ROWS = [
  { stat: STATS[0], swatch: "bg-white border border-graphite/30", win: [0.04, 0.34], what: "Solid towers" },
  { stat: STATS[1], swatch: "bg-amber", win: [0.3, 0.6], what: "Amber scaffold" },
  { stat: STATS[2], swatch: "bg-dusk", win: [0.56, 0.84], what: "Blue outlines" },
  { stat: STATS[3], swatch: "bg-[#f5c992]", win: [0.82, 0.98], what: "The warm plinth" },
] as const;

/**
 * "The record": a pinned clay city that builds itself from the DRHP numbers as you scroll, with the
 * counters underneath lighting up as their district rises.
 */
export function RecordSection() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const nums = el.querySelectorAll<HTMLElement>("[data-n]");
    const rows = el.querySelectorAll<HTMLElement>("[data-row]");
    const render = (p: number) => {
      recordState.p = p;
      ROWS.forEach((r, i) => {
        const t = clamp((p - r.win[0]) / (r.win[1] - r.win[0]));
        const s = r.stat as { value: number; decimals?: number };
        const n = nums[i];
        if (n) n.textContent = (s.value * t).toFixed(s.decimals ?? 0);
        const row = rows[i];
        if (row) row.dataset.on = t > 0.02 ? "1" : "0";
      });
    };
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "200px" });
    io.observe(el);
    if (prefersReducedMotion()) {
      render(1);
      return () => io.disconnect();
    }
    render(0);
    let st: ScrollTrigger | null = null;
    const cancel = whenRevealed(() => {
      st = ScrollTrigger.create({ trigger: el, start: "top top", end: "bottom bottom", scrub: 0.6, onUpdate: (s) => render(s.progress) });
    });
    return () => {
      cancel();
      st?.kill();
      io.disconnect();
    };
  }, []);

  return (
    <section ref={root} className="relative h-[300vh] bg-stone" aria-label="The Runwal record">
      <div className="sticky top-0 h-svh overflow-hidden">
        <div className="absolute inset-0">{active ? <RecordCity active={active} /> : null}</div>
        <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-stone via-stone/80 to-transparent px-6 pb-20 pt-24 md:px-10 md:pt-28">
          <p className="kicker text-dusk">The record &middot; as filed</p>
          <h2 className="display mt-4 text-[11vw] md:text-[min(5vw,6rem)]">
            Built, <span className="accent normal-case">building</span>, next
          </h2>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone via-stone/90 to-transparent px-6 pb-6 pt-16 md:px-10 md:pb-10">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
            {ROWS.map((r) => {
              const s = r.stat as { label: string; suffix: string; note: string; value: number; decimals?: number };
              return (
                <div key={s.label} data-row data-on="0" className="border-t border-graphite/15 pt-3 opacity-35 transition-opacity duration-500 data-[on=1]:opacity-100">
                  <dd className="title text-3xl tabular-nums md:text-5xl">
                    <span data-n>{s.value.toFixed(s.decimals ?? 0)}</span>
                    {s.suffix}
                  </dd>
                  <dt className="mt-2 flex items-center gap-2">
                    <span className={`inline-block size-2.5 ${r.swatch}`} aria-hidden />
                    <span className="kicker text-graphite-2">{s.label}</span>
                  </dt>
                  <p className="mt-1 hidden text-xs text-mute md:block">{r.what} &middot; {s.note}</p>
                </div>
              );
            })}
          </dl>
          <p className="kicker mt-4 text-[0.6rem] text-mute">{STATS_SOURCE} Illustrative model, not to scale.</p>
        </div>
      </div>
    </section>
  );
}
