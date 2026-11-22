"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { whenRevealed } from "@/lib/gate";
import { prefersReducedMotion } from "@/lib/motion";

/** Hero copy that sits low in the first screen: fades up as soon as the page is revealed (no scroll needed). */
export function HeroFade({ children, className = "", delay = 0.6 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    gsap.set(el, { opacity: 0, y: 24 });
    const cancel = whenRevealed(() => {
      gsap.to(el, { opacity: 1, y: 0, duration: 1.3, ease: "expo.out", delay });
    });
    return () => cancel();
  }, [delay]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
