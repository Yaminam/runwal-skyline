"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { Pic } from "../site/Pic";
import { TLink } from "../site/Transition";

export type BlogCard = { slug: string; title: string; date: string; mins: number; cover: string | null; excerpt: string };

// Asymmetric rhythm for the stories after the lead: span, image ratio, vertical offset (desktop).
const LAYOUT = [
  { span: "md:col-span-7", ratio: "aspect-[4/5]", offset: "" },
  { span: "md:col-span-5", ratio: "aspect-[16/11]", offset: "md:mt-40" },
  { span: "md:col-span-5", ratio: "aspect-[16/11]", offset: "md:mt-12" },
  { span: "md:col-span-7", ratio: "aspect-[16/9]", offset: "md:mt-40" },
  { span: "md:col-span-6 md:col-start-4", ratio: "aspect-[3/2]", offset: "md:mt-8" },
];
// Phones: alternate tall and wide frames so the single column keeps a rhythm.
const MOBILE_RATIO = ["max-md:aspect-[4/5]", "max-md:aspect-[16/10]"];

/**
 * The blog index as a magazine: a full-bleed lead story, then an asymmetric staggered grid.
 * Frames un-crop as they enter and the photographs drift inside them; on desktop a round
 * "Read" chip follows the pointer over a story.
 */
export function BlogMagazine({ cards }: { cards: BlogCard[] }) {
  const root = useRef<HTMLDivElement>(null);
  const chip = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>("[data-mag-frame]").forEach((f) => {
        gsap.fromTo(f, { clipPath: "inset(14% 8% 14% 8%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: f, start: "top 88%", once: true } });
        const img = f.querySelector("[data-mag-img]");
        if (img)
          gsap.fromTo(img, { yPercent: -7, scale: 1.14 }, { yPercent: 7, scale: 1.08, ease: "none", scrollTrigger: { trigger: f, start: "top bottom", end: "bottom top", scrub: true } });
      });
      el.querySelectorAll<HTMLElement>("[data-mag-text]").forEach((t) => {
        gsap.fromTo(t, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: t, start: "top 92%", once: true } });
      });
    }, el);
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());

    // "Read" chip that follows the pointer over a story (fine pointers only)
    const c = chip.current;
    let cleanup = () => {};
    if (c && window.matchMedia("(pointer: fine)").matches) {
      const xTo = gsap.quickTo(c, "x", { duration: 0.45, ease: "power3.out" });
      const yTo = gsap.quickTo(c, "y", { duration: 0.45, ease: "power3.out" });
      const move = (e: PointerEvent) => {
        xTo(e.clientX);
        yTo(e.clientY);
        const over = (e.target as HTMLElement).closest?.("[data-mag-story]");
        c.dataset.on = over ? "1" : "0";
      };
      window.addEventListener("pointermove", move, { passive: true });
      cleanup = () => window.removeEventListener("pointermove", move);
    }
    return () => {
      cancelAnimationFrame(id);
      ctx.revert();
      cleanup();
    };
  }, []);

  if (!cards.length) return null;
  const [lead, ...rest] = cards;

  return (
    <div ref={root}>
      {/* lead story, full bleed */}
      <TLink href={`/insights/${lead.slug}`} data-mag-story className="group relative -mx-6 block cursor-none overflow-hidden md:-mx-10" aria-label={lead.title}>
        <div data-mag-frame className="relative h-[72svh] overflow-hidden bg-graphite md:h-[86svh]">
          {lead.cover ? (
            <div data-mag-img className="absolute inset-0 transition-[filter] duration-700 group-hover:brightness-110">
              <Pic src={lead.cover} alt="" fill priority sizes="100vw" />
            </div>
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/0" />
          <div className="absolute inset-x-6 bottom-8 text-white md:inset-x-10 md:bottom-14" data-mag-text>
            <p className="kicker text-amber">
              Latest &middot; {lead.date} &middot; {lead.mins} min read
            </p>
            <h2 className="title mt-4 max-w-5xl text-[2.1rem] leading-[1.05] md:text-[min(5vw,5.4rem)]">
              <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_2px] bg-left-bottom bg-no-repeat pb-1 transition-[background-size] duration-700 ease-[var(--ease-out-expo)] group-hover:bg-[length:100%_2px]">
                {lead.title}
              </span>
            </h2>
            <p className="mt-5 hidden max-w-2xl leading-relaxed text-white/80 md:block">{lead.excerpt}</p>
          </div>
        </div>
      </TLink>

      {/* staggered grid */}
      <div className="mt-20 grid gap-x-10 gap-y-16 md:mt-28 md:grid-cols-12 md:gap-y-12">
        {rest.map((b, i) => {
          const L = LAYOUT[i % LAYOUT.length];
          return (
            <TLink key={b.slug} href={`/insights/${b.slug}`} data-mag-story className={`group block md:cursor-none ${L.span} ${L.offset}`}>
              <div data-mag-frame className={`relative overflow-hidden bg-stone-2 ${L.ratio} ${MOBILE_RATIO[i % 2]}`}>
                {b.cover ? (
                  <div data-mag-img className="absolute inset-0 transition-[filter,transform] duration-[1.2s] ease-[var(--ease-out-expo)] [filter:saturate(0.75)] group-hover:scale-[1.04] group-hover:[filter:saturate(1.05)_brightness(1.05)]">
                    <Pic src={b.cover} alt="" fill sizes="(min-width: 768px) 55vw, 100vw" />
                  </div>
                ) : null}
                <span className="kicker absolute left-4 top-4 bg-stone/90 px-2 py-1 text-graphite">{String(i + 2).padStart(2, "0")}</span>
              </div>
              <div data-mag-text>
                <p className="kicker mt-5 text-dusk">
                  Blog &middot; {b.date} &middot; {b.mins} min read
                </p>
                <h3 className="title mt-2 text-2xl leading-snug md:text-[2rem]">
                  <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-700 ease-[var(--ease-out-expo)] group-hover:bg-[length:100%_1px]">
                    {b.title}
                  </span>
                </h3>
                <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-relaxed text-graphite-2">{b.excerpt}</p>
              </div>
            </TLink>
          );
        })}
      </div>

      {/* pointer chip */}
      <div
        ref={chip}
        data-on="0"
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-40 hidden size-24 -translate-x-1/2 -translate-y-1/2 scale-0 items-center justify-center rounded-full bg-amber text-graphite opacity-0 transition-[opacity,scale] duration-300 data-[on=1]:scale-100 data-[on=1]:opacity-100 md:flex"
      >
        <span className="kicker">Read</span>
      </div>
    </div>
  );
}
