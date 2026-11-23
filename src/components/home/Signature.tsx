"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { whenRevealed } from "@/lib/gate";
import { prefersReducedMotion } from "@/lib/motion";
import { PROJECTS } from "@/lib/projects";
import { Pic } from "../site/Pic";
import { TLink } from "../site/Transition";

const PICKS = ["runwal-malabar", "runwal-raaya", "runwal-auris", "runwal-timeless", "runwal-one", "runwal-the-central-park"];
const ITEMS = PICKS.map((s) => PROJECTS.find((p) => p.slug === s)).filter((p): p is (typeof PROJECTS)[number] => Boolean(p));

/**
 * Signature residences on a pinned horizontal rail: vertical scroll drives the rail sideways,
 * each render settles from a slight zoom as it reaches the centre.
 */
export function Signature() {
  const root = useRef<HTMLElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    const track = rail.current;
    if (!el || !track || prefersReducedMotion()) return;
    const mm = gsap.matchMedia();
    let cancel = () => {};
    cancel = whenRevealed(() => {
      mm.add("(min-width: 768px)", () => {
        const dist = () => track.scrollWidth - window.innerWidth;
        const tween = gsap.to(track, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: () => `+=${dist()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (count.current) count.current.textContent = String(Math.min(ITEMS.length, Math.floor(self.progress * ITEMS.length) + 1)).padStart(2, "0");
            },
          },
        });
        track.querySelectorAll<HTMLElement>(".sg-img").forEach((img) => {
          gsap.fromTo(
            img,
            { scale: 1.18 },
            { scale: 1, ease: "none", scrollTrigger: { trigger: img.parentElement, containerAnimation: tween, start: "left right", end: "center center", scrub: true } },
          );
        });
      });
    });
    return () => {
      cancel();
      mm.revert();
    };
  }, []);

  return (
    <section ref={root} className="relative overflow-hidden bg-paper md:h-svh">
      <div className="flex h-full flex-col justify-center py-24 md:py-0">
        <div className="mb-10 flex items-end justify-between px-6 md:mb-12 md:px-10">
          <div>
            <p className="kicker mb-4 text-dusk">Signature residences</p>
            <h2 className="display text-[11vw] md:text-[min(6vw,7rem)]">
              Addresses, <span className="accent normal-case">not</span> apartments
            </h2>
          </div>
          <p className="kicker hidden text-mute md:block">
            <span ref={count}>01</span> / {String(ITEMS.length).padStart(2, "0")}
          </p>
        </div>

        <div ref={rail} className="no-scrollbar flex gap-5 overflow-x-auto px-6 will-change-transform md:gap-8 md:overflow-visible md:px-10">
          {ITEMS.map((p, i) => (
            <TLink
              key={p.slug}
              href={`/residences/${p.slug}`}
              className="group relative block w-[82vw] shrink-0 md:w-[min(46vw,52rem)]"
              aria-label={`${p.name}, ${p.area}`}
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-stone-2">
                <div className="sg-img absolute inset-0 transition-transform duration-[1.6s] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]">
                  <Pic src={p.images.hero} alt={`${p.name} render`} fill sizes="(min-width: 768px) 50vw, 85vw" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/10" />
                <span className="kicker absolute left-5 top-5 text-white/85">{String(i + 1).padStart(2, "0")}</span>
                {p.priceFrom && <span className="kicker absolute right-5 top-5 bg-white/90 px-2.5 py-1.5 text-graphite">From {p.priceFrom}</span>}
                <div className="absolute inset-x-5 bottom-5 text-white">
                  <p className="kicker mb-2 text-white/80">{p.area}</p>
                  <h3 className="title text-3xl md:text-[2.6rem]">{p.name}</h3>
                </div>
              </div>
              <div className="flex flex-col gap-2 border-b border-graphite/15 py-5 md:flex-row md:items-start md:justify-between md:gap-6">
                <p className="max-w-sm text-sm leading-relaxed text-graphite-2">{p.tagline}</p>
                <p className="kicker shrink-0 text-mute md:text-right">
                  {p.configs
                    .map((c) => c.label)
                    .slice(0, 3)
                    .join(" · ")}
                </p>
              </div>
            </TLink>
          ))}
          <TLink
            href="/residences"
            className="group flex w-[60vw] shrink-0 flex-col justify-between bg-graphite p-8 text-stone md:w-[min(26vw,26rem)]"
          >
            <span className="kicker text-amber">All residences</span>
            <span className="display text-5xl md:text-6xl">
              View
              <br />
              all {PROJECTS.length}
            </span>
            <span className="text-2xl transition-transform duration-500 group-hover:translate-x-2">&rarr;</span>
          </TLink>
        </div>
      </div>
    </section>
  );
}
