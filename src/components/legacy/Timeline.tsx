"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { JOURNEY } from "@/lib/company";
import { whenRevealed } from "@/lib/gate";
import { prefersReducedMotion } from "@/lib/motion";
import { Pic } from "../site/Pic";

/**
 * "Milestones of Excellence": on desktop the section pins and the years travel sideways as you scroll,
 * with a year rail on top that fills and lights the current milestone. On phones it is a vertical list.
 */
export function Timeline() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const tr = track.current;
    if (!el || !tr || prefersReducedMotion()) return;
    let mm: gsap.MatchMedia | null = null;
    const cancel = whenRevealed(() => {
      mm = gsap.matchMedia();
      mm.add("(min-width: 768px)", () => {
        const ticks = gsap.utils.toArray<HTMLElement>(".tl-tick", el);
        const cards = gsap.utils.toArray<HTMLElement>(".tl-card", el);
        const distance = () => tr.scrollWidth - window.innerWidth;
        const tween = gsap.to(tr, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (fill.current) fill.current.style.transform = `scaleX(${self.progress})`;
              const idx = Math.min(ticks.length - 1, Math.floor(self.progress * ticks.length * 0.999 + 0.08));
              ticks.forEach((t, i) => t.classList.toggle("is-on", i <= idx));
            },
          },
        });
        // each card's photo drifts inside its frame and its year rises as it crosses the screen
        cards.forEach((card) => {
          const img = card.querySelector(".tl-img");
          const year = card.querySelector(".tl-year");
          if (img)
            gsap.fromTo(img, { xPercent: -8 }, { xPercent: 8, ease: "none", scrollTrigger: { trigger: card, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
          if (year)
            gsap.fromTo(year, { yPercent: 40, opacity: 0.2 }, { yPercent: 0, opacity: 1, ease: "power2.out", scrollTrigger: { trigger: card, containerAnimation: tween, start: "left 95%", end: "left 45%", scrub: true } });
        });
        return () => tween.scrollTrigger?.kill();
      });
      ScrollTrigger.refresh();
    });
    return () => {
      cancel();
      mm?.revert();
    };
  }, []);

  return (
    <section ref={root} data-tone="dark" className="relative overflow-hidden bg-graphite text-stone md:h-svh" aria-label="Milestones of Excellence">
      <div className="blueprint-dark pointer-events-none absolute inset-0 opacity-60" />

      {/* year rail */}
      <div className="relative z-10 hidden px-10 pt-24 md:block">
        <div className="relative h-px w-full bg-stone/15">
          <div ref={fill} className="dusk-line absolute inset-0 origin-left scale-x-0" />
        </div>
        <ol className="mt-3 flex justify-between">
          {JOURNEY.map((m) => (
            <li key={m.year} className="tl-tick kicker text-stone/35 transition-colors duration-500 [&.is-on]:text-amber">
              {m.year}
            </li>
          ))}
        </ol>
      </div>

      <div ref={track} className="relative z-10 flex flex-col gap-16 px-6 py-24 md:h-[calc(100svh-7rem)] md:w-max md:flex-row md:items-center md:gap-0 md:px-0 md:py-0">
        {/* intro panel */}
        <div className="flex shrink-0 flex-col justify-center md:w-[42vw] md:px-10">
          <p className="kicker text-amber">Milestones of Excellence</p>
          <h2 className="display mt-6 text-[13vw] md:text-[min(6.4vw,7.5rem)]">
            A journey
            <br />
            of <span className="accent normal-case">achievement</span>
          </h2>
          <p className="mt-8 max-w-sm text-[0.98rem] leading-relaxed text-stone/70">
            From a single residential project in Thane to homes, offices, malls and hotels across Mumbai, Thane and Pune.
          </p>
          <p className="kicker mt-10 hidden items-center gap-3 text-stone/50 md:flex">
            Scroll <span className="inline-block h-px w-10 bg-stone/40" /> 1978 &rarr; 2025
          </p>
        </div>

        {JOURNEY.map((m, i) => (
          <article key={m.year} className="tl-card group relative flex shrink-0 flex-col md:w-[34vw] md:pr-[4vw]">
            <div className="flex items-baseline justify-between border-b border-stone/15 pb-3">
              <span className="kicker text-stone/50">{String(i + 1).padStart(2, "0")}</span>
              <span className="kicker text-stone/50">{m.title}</span>
            </div>
            <div className="overflow-hidden pt-2">
              <p className="tl-year display text-[22vw] text-stone md:text-[min(8vw,9.5rem)]">{m.year}</p>
            </div>
            {m.image && (
              <div className="relative mt-5 aspect-[1070/565] w-full overflow-hidden bg-graphite-2">
                <div className="tl-img absolute inset-[-8%]">
                  <Pic src={m.image} alt={`${m.year}: ${m.title}`} fill sizes="(min-width: 768px) 34vw, 100vw" className="transition-transform duration-[1.6s] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]" />
                </div>
              </div>
            )}
            <h3 className="title mt-6 text-2xl">{m.title}</h3>
            <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-stone/70">{m.text}</p>
          </article>
        ))}

        {/* closing panel */}
        <div className="flex shrink-0 flex-col justify-center md:w-[38vw] md:px-10">
          <p className="kicker text-amber">2025 &rarr;</p>
          <p className="title mt-5 text-4xl md:text-5xl">
            Next: hotels, schools and <span className="accent">24 more addresses.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
