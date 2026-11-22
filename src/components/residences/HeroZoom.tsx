"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { whenRevealed } from "@/lib/gate";
import { prefersReducedMotion } from "@/lib/motion";

/** Wraps a full-bleed hero image: a slow settle from a zoom on reveal, then drifts with the scroll. */
export function HeroZoom({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    gsap.set(el, { scale: 1.18 });
    let ctx: gsap.Context | null = null;
    const cancel = whenRevealed(() => {
      ctx = gsap.context(() => {
        gsap.to(el, { scale: 1.04, duration: 3.2, ease: "expo.out" });
        gsap.to(el, {
          yPercent: 12,
          ease: "none",
          scrollTrigger: { trigger: el.parentElement, start: "top top", end: "bottom top", scrub: true },
        });
      });
    });
    return () => {
      cancel();
      ctx?.revert();
    };
  }, []);
  return (
    <div ref={ref} className="absolute inset-0 will-change-transform">
      {children}
    </div>
  );
}
