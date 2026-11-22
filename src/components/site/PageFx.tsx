"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useEffect } from "react";
import { whenRevealed } from "@/lib/gate";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Declarative scroll effects for the current page:
 *  [data-split]       headline lines rise out of a mask when they enter
 *  [data-split="now"] same, but plays as soon as the page is revealed (hero titles)
 *  [data-fade]        fade + lift on enter (batched)
 *  [data-reveal-img]  image rises in perspective and un-crops while its photo settles from a zoom
 *  [data-tilt=N]      frame leans up to N degrees toward the cursor
 *  [data-parallax=N]  moves N% against the scroll inside its parent
 */
export function PageFx() {
  useEffect(() => {
    if (prefersReducedMotion()) {
      gsap.set("[data-split]", { visibility: "visible" });
      return;
    }
    let ctx: gsap.Context | null = null;
    const splits: SplitText[] = [];
    const cleanups: Array<() => void> = [];

    const cancel = whenRevealed(() => {
      ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el) => {
          const now = el.dataset.split === "now";
          const split = SplitText.create(el, { type: "lines", mask: "lines", linesClass: "split-line" });
          splits.push(split);
          gsap.set(el, { visibility: "visible" });
          gsap.from(split.lines, {
            yPercent: 115,
            rotate: 2,
            duration: 1.3,
            ease: "expo.out",
            stagger: 0.09,
            delay: now ? 0.05 : 0,
            scrollTrigger: now ? undefined : { trigger: el, start: "top 88%", once: true },
          });
        });

        ScrollTrigger.batch("[data-fade]", {
          start: "top 90%",
          once: true,
          onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", stagger: 0.08, overwrite: true }),
        });

        gsap.utils.toArray<HTMLElement>("[data-reveal-img]").forEach((el) => {
          const img = el.querySelector("img");
          const st = { trigger: el, start: "top 88%", once: true };
          // rises out of the page in perspective while it un-crops
          gsap.fromTo(
            el,
            { clipPath: "inset(10% 6% 10% 6%)", rotateX: 12, y: 70, transformPerspective: 1600, transformOrigin: "50% 100%" },
            { clipPath: "inset(0% 0% 0% 0%)", rotateX: 0, y: 0, duration: 1.8, ease: "power3.out", scrollTrigger: st },
          );
          if (img) gsap.fromTo(img, { scale: 1.3 }, { scale: 1, duration: 2, ease: "expo.out", scrollTrigger: st });
        });

        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
          const amt = parseFloat(el.dataset.parallax || "10");
          gsap.fromTo(
            el,
            { yPercent: -amt },
            {
              yPercent: amt,
              ease: "none",
              scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });
      });
      // [data-tilt]: the frame leans toward the cursor in 3D (fine pointers only)
      if (window.matchMedia("(pointer: fine)").matches) {
        document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((el) => {
          const amt = parseFloat(el.dataset.tilt || "5");
          const move = (e: PointerEvent) => {
            const r = el.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            gsap.to(el, { rotateY: x * amt * 2, rotateX: -y * amt * 2, transformPerspective: 1200, duration: 0.9, ease: "power3.out", overwrite: "auto" });
          };
          const leave = () => gsap.to(el, { rotateY: 0, rotateX: 0, duration: 1.2, ease: "expo.out", overwrite: "auto" });
          el.addEventListener("pointermove", move);
          el.addEventListener("pointerleave", leave);
          cleanups.push(() => {
            el.removeEventListener("pointermove", move);
            el.removeEventListener("pointerleave", leave);
          });
        });
      }
      ScrollTrigger.refresh();
    });

    return () => {
      cancel();
      ctx?.revert();
      splits.forEach((s) => s.revert());
      cleanups.forEach((f) => f());
    };
  }, []);

  return null;
}
