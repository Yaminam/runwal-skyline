"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { whenRevealed } from "@/lib/gate";
import { prefersReducedMotion } from "@/lib/motion";
import { getProject } from "@/lib/projects";
import { Pic } from "../site/Pic";
import { TLink } from "../site/Transition";

const TOWERS = [
  "runwal-raaya",
  "runwal-zenith",
  "runwal-one",
  "runwal-the-central-park",
  "runwal-timeless",
  "runwal-sanctuary",
  "runwal-rare",
  "runwal-lands-end",
]
  .map((slug) => getProject(slug))
  .filter((p): p is NonNullable<typeof p> => Boolean(p?.images.overview));

/** What the years built: tall renders on graphite, gliding sideways as the page scrolls. */
export function ArchitectureBand() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const tr = track.current;
    if (!el || !tr || prefersReducedMotion()) return;
    let ctx: gsap.Context | null = null;
    const cancel = whenRevealed(() => {
      ctx = gsap.context(() => {
        const mm = gsap.matchMedia();
        mm.add("(min-width: 768px)", () => {
          gsap.fromTo(
            tr,
            { x: 0 },
            {
              x: () => -(tr.scrollWidth - window.innerWidth) ,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.8, invalidateOnRefresh: true },
            },
          );
          gsap.utils.toArray<HTMLElement>(".ab-img").forEach((img, i) => {
            gsap.fromTo(img, { yPercent: i % 2 ? -7 : 7 }, { yPercent: i % 2 ? 7 : -7, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
          });
        });
        gsap.fromTo(".ab-card", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", stagger: 0.06, scrollTrigger: { trigger: el, start: "top 75%", once: true } });
      }, el);
    });
    return () => {
      cancel();
      ctx?.revert();
    };
  }, []);

  return (
    <section ref={root} data-tone="dark" className="relative overflow-hidden bg-graphite py-24 text-stone md:py-36" aria-labelledby="ab-h">
      <div className="blueprint-dark pointer-events-none absolute inset-0 opacity-50" aria-hidden />
      <div className="relative mb-12 grid gap-6 px-6 md:mb-16 md:grid-cols-12 md:px-10">
        <p className="kicker text-amber md:col-span-3">What the years built</p>
        <h2 id="ab-h" className="title text-4xl leading-[1.05] md:col-span-6 md:text-6xl">
          The towers <span className="accent">rising now</span>
        </h2>
        <p className="max-w-sm text-sm leading-relaxed text-stone/65 md:col-span-3">
          Every one of them carries the same name the first home in Thane did in 1978.
        </p>
      </div>

      <div ref={track} className="no-scrollbar relative flex gap-4 overflow-x-auto px-6 will-change-transform md:gap-6 md:overflow-visible md:px-10">
        {TOWERS.map((p, i) => (
          <TLink key={p.slug} href={`/residences/${p.slug}`} className="ab-card group w-[62vw] shrink-0 md:w-[19vw]" aria-label={`${p.name}, ${p.area}`}>
            <div className={`relative aspect-[615/800] overflow-hidden bg-graphite-2 ${i % 2 ? "md:mt-16" : ""}`}>
              <div className="ab-img absolute inset-[-8%] transition-transform duration-[1.4s] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]">
                <Pic src={p.images.overview!} alt={`${p.name} tower render`} fill sizes="(min-width: 768px) 20vw, 62vw" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent opacity-80" />
              <span className="kicker absolute bottom-3 left-3 text-[0.6rem] text-white/85">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <p className="title mt-4 text-lg md:text-xl">{p.name.replace("Runwal ", "")}</p>
            <p className="kicker mt-1 text-[0.6rem] text-stone/50">{p.area}</p>
          </TLink>
        ))}
      </div>
    </section>
  );
}
