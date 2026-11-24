"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { whenRevealed } from "@/lib/gate";
import { prefersReducedMotion } from "@/lib/motion";
import { Pic } from "../site/Pic";

type Frame = { src: string; name: string; where: string; w: string; ratio: string };

const ROW_A: Frame[] = [
  { src: "/images/company/commercial/r-square-andheri.webp", name: "R Square", where: "Andheri East", w: "md:w-[38vw]", ratio: "aspect-[1920/910]" },
  { src: "/images/company/retail/r-city.webp", name: "R City", where: "Ghatkopar West", w: "md:w-[30vw]", ratio: "aspect-[1070/565]" },
  { src: "/images/company/commercial/r-square-andheri-overview.webp", name: "R Square", where: "Andheri East", w: "md:w-[14vw]", ratio: "aspect-[615/800]" },
  { src: "/images/company/retail/r-mall-thane.webp", name: "R Mall", where: "Thane West", w: "md:w-[30vw]", ratio: "aspect-[1070/565]" },
];
const ROW_B: Frame[] = [
  { src: "/images/company/retail/r-odeon.webp", name: "R Odeon", where: "Ghatkopar East", w: "md:w-[28vw]", ratio: "aspect-[1070/565]" },
  { src: "/images/company/commercial/r-square-mulund-overview.webp", name: "R Square", where: "Mulund West", w: "md:w-[14vw]", ratio: "aspect-[615/800]" },
  { src: "/images/company/commercial/r-square-mulund.webp", name: "R Square", where: "Mulund West", w: "md:w-[38vw]", ratio: "aspect-[1920/910]" },
  { src: "/images/company/retail/r-mall-mulund.webp", name: "R Mall", where: "Mulund West", w: "md:w-[30vw]", ratio: "aspect-[1070/565]" },
];

function Row({ frames, dir, className }: { frames: Frame[]; dir: 1 | -1; className: string }) {
  return (
    <div data-dir={dir} className={`pg-row flex items-end gap-4 will-change-transform md:gap-6 ${className}`}>
      {frames.map((f) => (
        <figure key={f.src} className={`pg-frame w-[72vw] shrink-0 ${f.w}`}>
          <div className={`relative overflow-hidden bg-stone-2 ${f.ratio}`}>
            <div className="pg-img absolute inset-[-6%]">
              <Pic src={f.src} alt={`${f.name}, ${f.where}`} fill sizes="(min-width: 768px) 38vw, 72vw" />
            </div>
          </div>
          <figcaption className="mt-3 flex items-baseline justify-between gap-3">
            <span className="text-[0.85rem] text-graphite">{f.name}</span>
            <span className="kicker text-[0.6rem] text-mute">{f.where}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

/** The built places: two rows of offices and malls sliding past each other as you scroll. */
export function PlacesGallery() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let ctx: gsap.Context | null = null;
    const cancel = whenRevealed(() => {
      ctx = gsap.context(() => {
        const mm = gsap.matchMedia();
        mm.add("(min-width: 768px)", () => {
          gsap.utils.toArray<HTMLElement>(".pg-row").forEach((row) => {
            const dir = Number(row.dataset.dir);
            gsap.fromTo(row, { xPercent: dir > 0 ? -4 : -14 }, { xPercent: dir > 0 ? -14 : -4, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.8 } });
          });
          gsap.utils.toArray<HTMLElement>(".pg-img").forEach((img) => {
            gsap.fromTo(img, { xPercent: -3 }, { xPercent: 3, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
          });
        });
        gsap.utils.toArray<HTMLElement>(".pg-frame").forEach((f) => {
          gsap.fromTo(f, { clipPath: "inset(12% 8% 12% 8%)", opacity: 0.3 }, { clipPath: "inset(0% 0% 0% 0%)", opacity: 1, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: f, start: "top 92%", once: true } });
        });
      }, el);
    });
    return () => {
      cancel();
      ctx?.revert();
    };
  }, []);

  return (
    <section ref={root} className="relative overflow-hidden bg-stone py-24 md:py-36" aria-labelledby="pg-h">
      <div className="mb-12 grid gap-6 px-6 md:mb-16 md:grid-cols-12 md:px-10">
        <p className="kicker text-dusk md:col-span-3">Built and open</p>
        <h2 id="pg-h" className="title text-4xl leading-[1.05] md:col-span-9 md:text-6xl">
          Offices and malls <span className="accent">the city already uses</span>
        </h2>
      </div>
      <div className="flex flex-col gap-10 md:gap-14">
        <div className="no-scrollbar overflow-x-auto px-6 md:overflow-visible md:px-0">
          <Row frames={ROW_A} dir={1} className="md:pl-[8vw]" />
        </div>
        <div className="no-scrollbar overflow-x-auto px-6 md:overflow-visible md:px-0">
          <Row frames={ROW_B} dir={-1} className="md:pl-[2vw]" />
        </div>
      </div>
    </section>
  );
}
