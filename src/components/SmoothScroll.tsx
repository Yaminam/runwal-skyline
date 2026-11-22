"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { useEffect } from "react";
import { bindPointer, prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, SplitText);

let lenis: Lenis | null = null;

export function getLenis() {
  return lenis;
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}

export function scrollToEl(el: HTMLElement | string, offset = -90) {
  const target = typeof el === "string" ? document.querySelector<HTMLElement>(el) : el;
  if (!target) return;
  if (lenis) lenis.scrollTo(target, { offset, duration: 1.4 });
  else target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

export function SmoothScroll() {
  useEffect(() => {
    bindPointer();
    if (prefersReducedMotion()) return;
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1 });
    lenis.on("scroll", ScrollTrigger.update);
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    const tick = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    return () => {
      window.removeEventListener("load", refresh);
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = null;
    };
  }, []);
  return null;
}
