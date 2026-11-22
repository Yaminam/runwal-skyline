"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { openGate } from "@/lib/gate";
import { prefersReducedMotion } from "@/lib/motion";
import { getLenis } from "../SmoothScroll";
import { RunwalMark } from "./BrandLogo";

const KEY = "runwal-loaded";
const FLOORS = 12;
// Decided once per page load (effects can run twice in development).
let decided: boolean | null = null;

/**
 * First-visit intro: a tower is drawn floor by floor next to an elevation counter that climbs to
 * 1978 -> 2026, the R monogram settles in, then the stone screen splits open from the middle.
 */
export function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const year = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (decided === null) {
      try {
        decided = sessionStorage.getItem(KEY) === "1";
        sessionStorage.setItem(KEY, "1");
      } catch {
        decided = false;
      }
    }
    const lateJs = performance.now() > 6000;
    if (decided || lateJs || prefersReducedMotion()) {
      el.style.display = "none";
      openGate();
      return;
    }

    getLenis()?.stop();
    const n = { v: 1978 };
    const ctx = gsap.context(() => {
      gsap
        .timeline({
          defaults: { ease: "power3.out" },
          onComplete: () => {
            el.style.display = "none";
            getLenis()?.start();
          },
        })
        .fromTo(".ld-corner", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.06 }, 0.1)
        .fromTo(".ld-floor", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "expo.out", stagger: 0.09 }, 0.2)
        .to(
          n,
          {
            v: 2026,
            duration: 1.8,
            ease: "power2.inOut",
            onUpdate: () => {
              if (year.current) year.current.textContent = String(Math.round(n.v));
            },
          },
          0.2,
        )
        .fromTo(".ld-mark", { opacity: 0, scale: 0.9, filter: "blur(8px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1.1 }, 1.0)
        .to(".ld-floor", { backgroundColor: "#f2a65a", duration: 0.25, stagger: { each: 0.03, from: "end" } }, 1.7)
        .to([".ld-mark", ".ld-corner", ".ld-tower", ".ld-year"], { opacity: 0, y: -14, duration: 0.45, ease: "power2.in", stagger: 0.02 }, 2.3)
        .to(".ld-half-l", { xPercent: -100, duration: 1.1, ease: "expo.inOut" }, 2.55)
        .to(".ld-half-r", { xPercent: 100, duration: 1.1, ease: "expo.inOut" }, 2.55)
        .add(() => openGate(), 2.8);
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="no-js-hide fixed inset-0 z-80 items-center justify-center text-graphite" aria-hidden>
      <div className="ld-half-l absolute inset-y-0 left-0 w-1/2 bg-stone" />
      <div className="ld-half-r absolute inset-y-0 right-0 w-1/2 bg-stone" />

      <div className="relative flex items-end gap-10">
        <div className="ld-tower flex w-14 flex-col-reverse gap-[5px] md:w-20">
          {Array.from({ length: FLOORS }, (_, i) => (
            <span key={i} className="ld-floor block h-[5px] origin-left scale-x-0 bg-graphite" style={{ width: `${100 - (i > 8 ? (i - 8) * 14 : 0)}%` }} />
          ))}
        </div>
        <div className="flex flex-col items-start gap-5">
          <RunwalMark className="ld-mark h-16 w-auto opacity-0 md:h-20" />
          <span ref={year} className="ld-year title text-6xl tabular-nums md:text-8xl">
            1978
          </span>
        </div>
      </div>

      <p className="ld-corner kicker absolute left-6 top-7 opacity-0 md:left-10 md:top-9">Runwal Realty</p>
      <p className="ld-corner kicker absolute right-6 top-7 opacity-0 md:right-10 md:top-9">19.0760&deg; N &middot; 72.8777&deg; E</p>
      <p className="ld-corner kicker absolute bottom-8 left-6 opacity-0 md:bottom-10 md:left-10">Building for generations</p>
      <p className="ld-corner kicker absolute bottom-8 right-6 opacity-0 md:bottom-10 md:right-10">Since 1978</p>
    </div>
  );
}
