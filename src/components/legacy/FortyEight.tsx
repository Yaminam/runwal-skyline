"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion, useReducedMotion } from "@/lib/motion";
import { Pic } from "../site/Pic";
import { TLink } from "../site/Transition";
import { FLOORS, MILESTONES, MILESTONE_FLOORS, START_YEAR, buildAt, finaleAt, legacy, milestoneAt, nightAt } from "./legacy-state";

const LegacyTower = dynamic(() => import("../three/LegacyTower"), { ssr: false });

/**
 * "48 years, 48 floors": a pinned scroll where a clay tower is built one floor per year,
 * 1978 to 2026. Milestone years land lit in amber with their story beside the tower.
 */
export function FortyEight() {
  const reduced = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const year = useRef<HTMLSpanElement>(null);
  const floor = useRef<HTMLSpanElement>(null);
  const ink = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const finale = useRef<HTMLDivElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const ticks = useRef<Array<HTMLSpanElement | null>>([]);
  const [active, setActive] = useState(false);
  const [card, setCard] = useState(-1);
  // only feeds the client-only canvas, so reading the window here can't cause a hydration mismatch
  const [mobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const cardRef = useRef(-1);

  useEffect(() => {
    const el = section.current;
    if (!el || prefersReducedMotion()) return;

    const render = (p: number) => {
      legacy.p = p;
      const b = buildAt(p);
      const fin = finaleAt(p);
      const landed = Math.min(FLOORS, Math.floor(b + 0.0001));
      const y = fin > 0.5 ? 2026 : START_YEAR + Math.max(0, landed - 1);
      if (year.current) year.current.textContent = landed === 0 ? "19··" : String(y);
      if (floor.current) floor.current.textContent = fin > 0.5 ? "Crown" : `Floor ${String(landed).padStart(2, "0")} / ${FLOORS}`;
      ticks.current.forEach((t, i) => {
        if (t) t.dataset.on = i < landed ? "1" : "0";
      });
      const dark = nightAt(p) > 0.45;
      el.dataset.tone = dark ? "dark" : "light";
      if (ink.current) ink.current.dataset.ink = dark ? "light" : "dark";
      if (scrim.current) scrim.current.dataset.ink = dark ? "light" : "dark";
      if (intro.current) {
        const a = 1 - Math.min(1, Math.max(0, (p - 0.004) / 0.026));
        intro.current.style.opacity = String(a);
        intro.current.style.visibility = a < 0.01 ? "hidden" : "visible";
      }
      if (finale.current) {
        finale.current.style.opacity = String(fin);
        finale.current.style.transform = `translateY(${(1 - fin) * 30}px)`;
        finale.current.style.visibility = fin < 0.01 ? "hidden" : "visible";
        finale.current.style.pointerEvents = fin > 0.6 ? "auto" : "none";
      }
      const m = milestoneAt(b, p);
      if (m !== cardRef.current) {
        cardRef.current = m;
        setCard(m);
      }
    };
    render(0);

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.5,
      onUpdate: (self) => render(self.progress),
    });
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "200px" });
    io.observe(el);
    return () => {
      st.kill();
      io.disconnect();
    };
  }, [reduced]);

  // card entrance
  useEffect(() => {
    if (card < 0 || prefersReducedMotion()) return;
    gsap.fromTo(".fe-card", { opacity: 0, y: 28, clipPath: "inset(0% 0% 100% 0%)" }, { opacity: 1, y: 0, clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "expo.out" });
    gsap.fromTo(".fe-card img", { scale: 1.2 }, { scale: 1, duration: 1.4, ease: "expo.out" });
  }, [card]);

  if (reduced) return <StaticLegacy />;

  const m = card >= 0 ? MILESTONES[card] : null;

  return (
    <section ref={section} data-tone="light" className="relative h-[880vh] bg-stone" aria-label="48 years, 48 floors: the Runwal journey">
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        <div className="absolute inset-0">
          <LegacyTower active={active} mobile={mobile} />
        </div>

        <div
          ref={scrim}
          data-ink="dark"
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-[background] duration-700 data-[ink=dark]:bg-[linear-gradient(to_top_right,rgba(238,235,229,0.9)_0%,rgba(238,235,229,0.4)_30%,rgba(238,235,229,0)_55%)] data-[ink=light]:bg-[linear-gradient(to_top_right,rgba(10,12,16,0.85)_0%,rgba(10,12,16,0.45)_30%,rgba(10,12,16,0)_55%)]"
        />

        <div ref={ink} data-ink="dark" className="pointer-events-none absolute inset-0 text-graphite transition-colors duration-500 data-[ink=light]:text-stone">
          {/* intro */}
          <div ref={intro} className="absolute inset-x-6 top-24 md:inset-x-10 md:top-28">
            <p className="kicker text-dusk">The Runwal journey</p>
            <h2 className="display mt-4 max-w-[12ch] text-[12vw] md:text-[min(5.6vw,6.6rem)]">
              48 years, <span className="accent normal-case">48 floors</span>
            </h2>
            <p className="mt-5 max-w-sm text-[0.95rem] leading-relaxed opacity-80">One floor for every year since 1978. Scroll to build the tower.</p>
          </div>

          {/* year + floor rail */}
          <div className="absolute bottom-8 left-6 md:bottom-12 md:left-10">
            <p className="kicker mb-3 flex items-center gap-3 opacity-75">
              <span className="live-dot inline-block size-1.5 rounded-full bg-amber" />
              <span ref={floor}>Floor 00 / {FLOORS}</span>
            </p>
            <span ref={year} className="display block text-[22vw] tabular-nums leading-[0.85] md:text-[min(12vw,13rem)]">
              19··
            </span>
            <div className="mt-5 flex h-6 w-[min(80vw,26rem)] items-end gap-[2px]" aria-hidden>
              {Array.from({ length: FLOORS }, (_, i) => (
                <span
                  key={i}
                  ref={(el) => {
                    ticks.current[i] = el;
                  }}
                  data-on="0"
                  className={`block flex-1 origin-bottom transition-[transform,background-color] duration-300 data-[on=0]:scale-y-[0.35] data-[on=0]:bg-current/25 ${
                    MILESTONE_FLOORS.has(i) ? "h-6 data-[on=1]:bg-amber" : "h-4 data-[on=1]:bg-current"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* milestone card */}
          {m && (
            <article
              key={m.idx}
              className="fe-card pointer-events-auto absolute inset-x-4 bottom-[12.5rem] bg-paper text-graphite shadow-[0_30px_80px_-30px_rgba(0,0,0,0.45)] md:inset-x-auto md:bottom-auto md:right-10 md:top-1/2 md:w-[24rem] md:-translate-y-1/2"
            >
              {m.image && (
                <div className="relative hidden aspect-[16/10] overflow-hidden md:block">
                  <Pic src={m.image} alt={`${m.year}: ${m.title}`} fill sizes="24rem" />
                </div>
              )}
              <div className="flex gap-4 p-4 md:block md:p-6">
                {m.image && (
                  <div className="relative size-16 shrink-0 overflow-hidden md:hidden">
                    <Pic src={m.image} alt="" fill sizes="64px" />
                  </div>
                )}
                <div>
                  <p className="kicker flex items-center gap-2 whitespace-nowrap text-amber-deep">
                    <span className="inline-block size-2 shrink-0 bg-amber" />
                    {m.year} &middot; Floor {String(m.floor + 1).padStart(2, "0")}
                  </p>
                  <h3 className="title mt-2 text-xl md:mt-3 md:text-2xl">{m.title}</h3>
                  <p className="mt-2 text-[0.85rem] leading-relaxed text-graphite-2 md:mt-3 md:text-[0.92rem]">{m.text}</p>
                </div>
              </div>
            </article>
          )}

          {/* finale */}
          <div ref={finale} className="invisible absolute inset-x-6 top-24 opacity-0 md:inset-x-auto md:right-10 md:top-1/2 md:w-[30rem] md:-translate-y-1/2">
            <p className="kicker text-amber">2026 &middot; The crown</p>
            <h2 className="display mt-4 text-[11vw] md:text-[min(4.6vw,5.4rem)]">
              48 floors. <span className="accent normal-case">One family name.</span>
            </h2>
            <p className="mt-5 max-w-sm text-[0.95rem] leading-relaxed opacity-80">35 projects completed, 17 rising, 24 on the drawing board. The next floor is yours.</p>
            <TLink href="/residences" className="group mt-8 inline-flex items-center gap-3 bg-amber px-6 py-4 text-sm font-medium text-graphite transition-colors hover:bg-stone">
              Find your Runwal address <span className="transition-transform duration-500 group-hover:translate-x-1">&rarr;</span>
            </TLink>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Reduced motion: the finished tower as a still, with the milestones as a list. */
function StaticLegacy() {
  useEffect(() => {
    legacy.p = 1;
  }, []);
  return (
    <section data-tone="dark" className="relative bg-night text-stone">
      <div className="relative h-[70svh]">
        <LegacyTower active mobile={false} />
      </div>
      <div className="px-6 py-20 md:px-10">
        <h2 className="display text-[11vw] md:text-[min(5vw,6rem)]">
          48 years, <span className="accent normal-case">48 floors</span>
        </h2>
        <ol className="mt-12 grid gap-px bg-stone/10 md:grid-cols-2">
          {MILESTONES.map((m) => (
            <li key={m.idx} className="bg-night p-6">
              <p className="kicker whitespace-nowrap text-amber">{m.year}</p>
              <h3 className="title mt-2 text-xl">{m.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone/70">{m.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
