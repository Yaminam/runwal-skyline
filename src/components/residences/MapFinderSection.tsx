"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { bhkLabel } from "@/lib/project-format";
import { getLenis } from "../SmoothScroll";
import { TLink } from "../site/Transition";
import type { RealMapFinderProps } from "./RealMapFinder";
import { REGION_MARKS, TOUR, chapterAt, clamp01, clockAt, tourState } from "./residence-tour";

const MapFinder = dynamic(() => import("./RealMapFinder"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-night">
      <span className="kicker animate-pulse text-stone/60">Loading the city&hellip;</span>
    </div>
  ),
});

/**
 * The Runwal flight: a pinned, scroll-driven tour over the satellite map, one residence per
 * chapter from Malabar Hill to Pune, morning to night, ending on a night view where an amber line
 * joins every address. "Explore the map yourself" hands the controls back at any point.
 */
export function MapFinderSection(props: RealMapFinderProps & { count: number; total: number }) {
  const { count, total, ...map } = props;
  const outer = useRef<HTMLElement>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [chapter, setChapter] = useState(-1);
  const [explore, setExplore] = useState(false);

  useEffect(() => {
    tourState.active = true;
    let raf = 0;
    let last = -2;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const el = outer.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < -50 || r.top > window.innerHeight + 50) return;
      const p = clamp01(-r.top / Math.max(1, r.height - window.innerHeight));
      tourState.p = p;
      if (clock.current) clock.current.textContent = clockAt(p);
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      const { i } = chapterAt(p);
      if (i !== last) {
        last = i;
        setChapter(i);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      tourState.active = false;
    };
  }, []);

  useEffect(() => {
    tourState.explore = explore;
  }, [explore]);

  const skip = () => {
    const el = outer.current;
    if (!el) return;
    const y = el.getBoundingClientRect().bottom + window.scrollY - 60;
    const l = getLenis();
    if (l) l.scrollTo(y, { duration: 1.6 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  const intro = chapter < 0;
  const finale = chapter >= TOUR.length;
  const p = !intro && !finale ? TOUR[chapter] : null;

  return (
    <section ref={outer} className="relative -mx-6 h-[760svh] md:-mx-10 md:h-[900svh]" aria-label="A flight over every Runwal residence">
      <div data-tone="dark" className="sticky top-0 h-svh overflow-hidden bg-night">
        <MapFinder {...map} tour explore={explore} />

        {/* scrims keep the copy legible over any imagery */}
        <div
          className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${explore ? "opacity-0" : "opacity-100"} bg-[linear-gradient(to_top_right,rgba(8,10,14,0.82)_0%,rgba(8,10,14,0.45)_30%,rgba(8,10,14,0)_58%)]`}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[rgba(8,10,14,0.55)] to-transparent" aria-hidden />

        {/* HUD */}
        <div className="pointer-events-none absolute right-6 top-24 z-10 flex flex-col items-end gap-1 text-right text-stone md:right-10 md:top-28">
          <span className="kicker text-stone/60">Mumbai &middot; local time</span>
          <span ref={clock} className="title text-3xl tabular-nums md:text-4xl">
            07:00
          </span>
          <span className="kicker mt-2 text-amber">
            {String(count).padStart(2, "0")}/{String(total).padStart(2, "0")} residences
          </span>
        </div>

        {/* flight copy */}
        <div className={`pointer-events-none absolute inset-x-6 bottom-24 z-10 text-stone transition-opacity duration-500 md:inset-x-10 md:bottom-32 ${explore ? "opacity-0" : "opacity-100"}`}>
          {intro && (
            <div key="intro" className="max-w-2xl animate-[fadeUp_.9s_cubic-bezier(.16,1,.3,1)_both]">
              <p className="kicker flex items-center gap-3 text-amber">
                <span className="live-dot inline-block size-1.5 rounded-full bg-amber" /> The Runwal flight
              </p>
              <h2 className="display mt-5 text-[12vw] md:text-[min(6.4vw,7.6rem)]">
                Ten addresses,
                <br />
                <span className="accent normal-case text-amber">one flight.</span>
              </h2>
              <p className="mt-5 max-w-md text-[0.98rem] leading-relaxed text-stone/80">Scroll to fly over every Runwal residence, from Malabar Hill to Pune, morning to night.</p>
            </div>
          )}

          {p && (
            <div key={p.slug} className="max-w-xl animate-[fadeUp_.8s_cubic-bezier(.16,1,.3,1)_both]">
              <p className="kicker text-amber">
                {String(chapter + 1).padStart(2, "0")} / {String(TOUR.length).padStart(2, "0")} &middot; {p.region}
              </p>
              <h2 className="title mt-4 text-[2.6rem] leading-[1] md:text-[4.4rem]">{p.name}</h2>
              <p className="kicker mt-3 text-stone/70">{p.area}</p>
              <p className="accent mt-4 max-w-md text-xl text-stone/90 md:text-2xl">{p.tagline}</p>
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.92rem]">
                <span>{bhkLabel(p)}</span>
                <span className="text-stone/60">{p.priceFrom ? `From ${p.priceFrom}` : "Price on request"}</span>
                <TLink href={`/residences/${p.slug}`} className="pointer-events-auto group inline-flex items-center gap-2 border-b border-amber/70 pb-0.5 text-amber">
                  View residence <span className="transition-transform duration-500 group-hover:translate-x-1">&rarr;</span>
                </TLink>
              </div>
            </div>
          )}

          {finale && (
            <div key="finale" className="max-w-2xl animate-[fadeUp_.9s_cubic-bezier(.16,1,.3,1)_both]">
              <p className="kicker text-amber">Every light, a family home</p>
              <h2 className="display mt-5 text-[11vw] md:text-[min(5.8vw,7rem)]">
                Ten residences.
                <br />
                <span className="dusk-text">One skyline.</span>
              </h2>
            </div>
          )}

          <div className="pointer-events-auto mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={() => setExplore(true)} className="group inline-flex items-center gap-3 bg-stone px-5 py-3.5 text-sm font-medium text-graphite transition-colors hover:bg-amber">
              Explore the map yourself <span aria-hidden>&#8599;</span>
            </button>
            <button type="button" onClick={skip} className="inline-flex items-center gap-3 border border-stone/30 px-5 py-3.5 text-sm font-medium text-stone backdrop-blur-sm transition-colors hover:border-stone">
              See every residence <span aria-hidden>&darr;</span>
            </button>
          </div>
        </div>

        {/* explore mode chrome */}
        {explore && (
          <div className="absolute left-1/2 top-24 z-20 flex -translate-x-1/2 items-center gap-3 border border-white/15 bg-graphite/80 px-4 py-2.5 text-stone backdrop-blur-md md:top-28">
            <span className="kicker text-stone/70">Exploring &middot; drag to move, right-drag to turn</span>
            <button type="button" onClick={() => setExplore(false)} className="kicker text-amber underline-offset-4 hover:underline">
              Back to the flight
            </button>
          </div>
        )}

        {/* progress */}
        <div className={`pointer-events-none absolute inset-x-6 bottom-12 z-10 text-stone transition-opacity duration-500 md:inset-x-10 md:bottom-16 ${explore ? "opacity-0" : "opacity-100"}`}>
          <div className="relative h-px w-full bg-stone/25">
            <span ref={bar} className="dusk-line absolute inset-0 origin-left scale-x-0" />
            {REGION_MARKS.map((r) => (
              <span key={r.label} className="kicker absolute top-3 hidden -translate-x-1/2 whitespace-nowrap text-stone/60 md:block" style={{ left: `${r.at * 100}%` }}>
                {r.label}
              </span>
            ))}
          </div>
        </div>

        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}`}</style>
      </div>
    </section>
  );
}
