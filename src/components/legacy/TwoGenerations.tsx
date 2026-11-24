"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { MD } from "@/lib/company";
import { whenRevealed } from "@/lib/gate";
import { prefersReducedMotion } from "@/lib/motion";
import { Pic } from "../site/Pic";

const RELAY = [
  { year: "1978", who: "Subhash Runwal", what: "Founds the company with one home in Thane" },
  { year: "1993", who: "Sandeep Runwal", what: "Joins his father in the business" },
  { year: "Today", who: "Sandeep Runwal", what: "Promoter & MD. 35 projects delivered, 17 under way" },
];

const CREDS = ["IIM Bangalore", "Harvard Business School", "Past president, NAREDCO"];

const LINE = "Founded by Subhash Runwal in 1978. Led by his son since 1993,";

/**
 * Two generations as a relay: the baton line draws from 1978 to today as you scroll, the portrait
 * develops out of a blueprint, and the promise lights up word by word.
 */
export function TwoGenerations() {
  const root = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let ctx: gsap.Context | null = null;
    const cleanups: Array<() => void> = [];
    const cancel = whenRevealed(() => {
      ctx = gsap.context(() => {
        const st = { trigger: el, start: "top 70%", end: "center 40%", scrub: 0.6 };
        // blueprint veil wipes off the portrait, the photo settles from a zoom
        gsap.fromTo(".tg-photo", { scale: 1.08, filter: "grayscale(0.6)" }, { scale: 1, filter: "grayscale(0)", ease: "none", scrollTrigger: st });
        gsap.fromTo(".tg-word", { opacity: 0.12 }, { opacity: 1, stagger: 0.06, ease: "none", scrollTrigger: { trigger: ".tg-line", start: "top 80%", end: "bottom 50%", scrub: 0.5 } });
        gsap.fromTo(".tg-promise", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ".tg-line", start: "bottom 60%", once: true } });
        // relay baton
        const relay = gsap.timeline({ scrollTrigger: { trigger: ".tg-relay", start: "top 85%", end: "bottom 55%", scrub: 0.6 } });
        relay.fromTo(".tg-track", { scaleX: 0 }, { scaleX: 1, ease: "none", duration: 1 }, 0);
        gsap.utils.toArray<HTMLElement>(".tg-node").forEach((n, i) => {
          relay.fromTo(n, { scale: 0.4, backgroundColor: "#d4cfc5" }, { scale: 1, backgroundColor: "#f2a65a", duration: 0.12 }, i * 0.45);
          relay.fromTo(n.parentElement!.querySelectorAll(".tg-stop-text"), { opacity: 0.25, y: 10 }, { opacity: 1, y: 0, duration: 0.15 }, i * 0.45);
        });
        gsap.fromTo(".tg-cred", { opacity: 0, y: 14 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: ".tg-creds", start: "top 90%", once: true } });
      }, el);

      // the portrait leans toward the cursor
      const f = frame.current;
      if (f && window.matchMedia("(pointer: fine)").matches) {
        const move = (e: PointerEvent) => {
          const r = f.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(f, { rotateY: x * 8, rotateX: -y * 8, transformPerspective: 1100, duration: 0.8, ease: "power3.out", overwrite: "auto" });
        };
        const leave = () => gsap.to(f, { rotateY: 0, rotateX: 0, duration: 1.2, ease: "expo.out" });
        f.addEventListener("pointermove", move);
        f.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          f.removeEventListener("pointermove", move);
          f.removeEventListener("pointerleave", leave);
        });
      }
    });
    return () => {
      cancel();
      ctx?.revert();
      cleanups.forEach((c) => c());
    };
  }, []);

  return (
    <section ref={root} className="relative overflow-hidden bg-paper px-6 py-28 md:px-10 md:py-40">
      <div className="blueprint pointer-events-none absolute inset-0 opacity-50" aria-hidden />
      <div className="relative grid gap-14 md:grid-cols-12 md:gap-10">
        {/* portrait */}
        <div className="md:col-span-4">
          <div ref={frame} className="relative aspect-[4/5] w-full max-w-md overflow-hidden bg-graphite will-change-transform">
            <div className="tg-photo absolute inset-0">
              <Pic src={MD.image} alt={MD.name} fill sizes="(min-width: 768px) 30vw, 90vw" className="object-[50%_30%]" />
            </div>
            {/* a hairline drawing frame over the portrait; the face always shows */}
            <div className="pointer-events-none absolute inset-5 border border-white/35" aria-hidden />
            <span className="kicker absolute left-4 top-4 z-10 bg-paper/90 px-2 py-1 text-graphite">Since 1993</span>
          </div>
          <p className="kicker mt-6 text-mute">{MD.title}</p>
          <p className="title mt-1 text-2xl">{MD.name}</p>
          <ul className="tg-creds mt-5 flex flex-wrap gap-2">
            {CREDS.map((c) => (
              <li key={c} className="tg-cred kicker border border-graphite/20 bg-paper px-3 py-2 text-graphite-2">
                {c}
              </li>
            ))}
          </ul>
        </div>

        {/* words + relay */}
        <div className="flex flex-col justify-between md:col-span-7 md:col-start-6">
          <div>
            <p className="kicker text-dusk">Two generations &middot; One promise</p>
            <p className="tg-line title mt-6 text-[2.1rem] leading-[1.12] md:text-[3.4rem]">
              {LINE.split(" ").map((w, i) => (
                <span key={i} className="tg-word inline-block pr-[0.25em]">
                  {w}
                </span>
              ))}
              <span className="tg-promise accent block pl-[0.12em] text-dusk">with the same promise.</span>
            </p>
          </div>

          <div className="tg-relay mt-16 md:mt-24">
            <p className="kicker mb-8 text-mute">The relay</p>
            <div className="relative">
              <div className="absolute left-0 right-0 top-[7px] h-px bg-graphite/15" />
              <div className="tg-track dusk-line absolute left-0 right-0 top-[6px] h-[3px] origin-left" />
              <ol className="relative grid grid-cols-3 gap-4">
                {RELAY.map((r) => (
                  <li key={r.year} className="flex flex-col">
                    <span className="tg-node block size-4 rounded-full border-2 border-paper bg-line shadow-[0_0_0_1px_rgba(22,24,27,.15)]" />
                    <span className="tg-stop-text title mt-6 whitespace-nowrap text-3xl md:text-5xl">{r.year}</span>
                    <span className="tg-stop-text kicker mt-3 text-amber-deep">{r.who}</span>
                    <span className="tg-stop-text mt-2 max-w-[16rem] text-sm leading-relaxed text-graphite-2">{r.what}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
