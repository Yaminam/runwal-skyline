"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { whenRevealed } from "@/lib/gate";
import { prefersReducedMotion } from "@/lib/motion";
import { Pic } from "../site/Pic";

type Img = { src: string; label: string };

/**
 * Pinned horizontal gallery: vertical scroll drives the strip sideways while each render drifts
 * slightly inside its frame (parallax). Falls back to a native horizontal scroller on touch / reduced motion.
 */
export function Gallery({ name, images }: { name: string; images: Img[] }) {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const tr = track.current;
    if (!el || !tr || prefersReducedMotion() || window.matchMedia("(pointer: coarse)").matches) return;
    let ctx: gsap.Context | null = null;
    const cancel = whenRevealed(() => {
      ctx = gsap.context(() => {
        const dist = () => Math.max(0, tr.scrollWidth - window.innerWidth);
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: () => `+=${dist()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });
        tl.to(tr, { x: () => -dist(), ease: "none" }, 0);
        tl.fromTo(bar.current, { scaleX: 0 }, { scaleX: 1, ease: "none" }, 0);
        tr.querySelectorAll<HTMLElement>("[data-g-img]").forEach((img) => {
          tl.fromTo(img, { xPercent: -8 }, { xPercent: 8, ease: "none" }, 0);
        });
      }, el);
      ScrollTrigger.refresh();
    });
    return () => {
      cancel();
      ctx?.revert();
    };
  }, []);

  if (!images.length) return null;

  return (
    <section ref={root} className="relative flex min-h-svh flex-col justify-center overflow-hidden bg-paper py-20" aria-label={`${name} gallery`}>
      <div className="mb-10 flex items-end justify-between px-6 md:px-10">
        <h2 className="display text-[11vw] md:text-[min(5.6vw,6.6rem)]">
          The <span className="accent">renders</span>
        </h2>
        <p className="kicker hidden text-mute md:block">{String(images.length).padStart(2, "0")} views &middot; artist&rsquo;s impressions</p>
      </div>
      <div ref={track} className="no-scrollbar flex gap-5 overflow-x-auto px-6 will-change-transform md:overflow-visible md:px-10">
        {images.map((g, i) => (
          <figure key={g.src} className="w-[78vw] shrink-0 md:w-[min(34vw,34rem)]">
            <div className="relative aspect-square overflow-hidden bg-stone-2">
              <div data-g-img className="absolute -inset-x-[10%] inset-y-0">
                <Pic src={g.src} alt={g.label || `${name} render ${i + 1}`} fill sizes="(min-width: 768px) 34vw, 78vw" />
              </div>
            </div>
            <figcaption className="mt-3 flex justify-between gap-4">
              <span className="text-sm">{g.label}</span>
              <span className="kicker text-mute">{String(i + 1).padStart(2, "0")}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="mx-6 mt-10 h-px bg-graphite/15 md:mx-10">
        <div ref={bar} className="dusk-line h-px origin-left scale-x-0" />
      </div>
    </section>
  );
}
