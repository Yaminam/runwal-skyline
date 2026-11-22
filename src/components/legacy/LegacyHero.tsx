"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { whenRevealed } from "@/lib/gate";
import { prefersReducedMotion } from "@/lib/motion";
import { BRAND } from "@/lib/company";
import { Pic } from "../site/Pic";

/**
 * Opening of the Legacy page: the year 1978 rolls into place digit by digit like a lift indicator,
 * then the elevation photograph opens upward behind it.
 */
export function LegacyHero() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.querySelectorAll<HTMLElement>(".lh-reel").forEach((r) => gsap.set(r, { yPercent: -((10 + Number(r.dataset.digit)) * 100) / 20 }));
      return;
    }
    let ctx: gsap.Context | null = null;
    const cancel = whenRevealed(() => {
      ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>(".lh-reel").forEach((reel, i) => {
          const target = Number(reel.dataset.digit);
          gsap.fromTo(reel, { yPercent: 0 }, { yPercent: -(10 + target) * (100 / 20), duration: 2.2 + i * 0.25, ease: "expo.inOut", delay: 0.1 });
        });
        gsap.fromTo(".lh-photo", { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.8, ease: "expo.inOut", delay: 0.5 });
        gsap.fromTo(".lh-photo img", { scale: 1.25 }, { scale: 1, duration: 2.6, ease: "expo.out", delay: 0.5 });
        gsap.fromTo(".lh-fade", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", stagger: 0.08, delay: 1.4 });
      }, el);
    });
    return () => {
      cancel();
      ctx?.revert();
    };
  }, []);

  const digits = "1978".split("").map(Number);

  return (
    <section ref={root} className="relative overflow-hidden bg-stone pt-28 md:pt-32">
      <div className="px-6 md:px-10">
        <div className="lh-fade flex items-center justify-between border-b border-graphite/15 pb-5">
          <p className="kicker">Legacy &middot; Our journey</p>
          <p className="kicker hidden md:block">Thane, 1978 &rarr; Mumbai, Thane &amp; Pune, today</p>
        </div>

        <h1 className="sr-only">Runwal Realty, since 1978</h1>
        <div aria-hidden className="relative mt-6 flex justify-between overflow-hidden leading-none md:mt-4">
          {digits.map((d, i) => (
            <span key={i} className="display relative block h-[0.86em] overflow-hidden text-[33vw] md:text-[29vw]">
              {/* 20-digit reel (0-9 twice); lands on the target digit in the second run */}
              <span
                className="lh-reel block [html:not(.js)_&]:[transform:translateY(var(--final))]"
                data-digit={d}
                style={{ "--final": `-${((10 + d) * 100) / 20}%` } as React.CSSProperties}
              >
                {Array.from({ length: 20 }, (_, k) => (
                  <span key={k} className="block h-[0.86em]">
                    {k % 10}
                  </span>
                ))}
              </span>
            </span>
          ))}
        </div>

        <div className="grid gap-10 pb-16 pt-10 md:grid-cols-12 md:pb-24">
          <p className="lh-fade title text-3xl md:col-span-5 md:text-[2.6rem]">
            One home in Thane.
            <br />
            <span className="accent text-mute">Forty-eight years of addresses since.</span>
          </p>
          <div className="lh-fade flex flex-col gap-6 md:col-span-5 md:col-start-8">
            <p className="text-[1.02rem] leading-relaxed text-graphite-2">{BRAND.who}</p>
            <p className="kicker text-mute">Founded by {BRAND.founder} &middot; Led by {BRAND.md}</p>
          </div>
        </div>
      </div>

      <div className="lh-photo relative h-[70svh] w-full overflow-hidden md:h-[88svh]">
        <Pic src="/images/company/brand/elevation-crown.webp" alt="A Runwal Realty residential tower rising over Mumbai" fill priority sizes="100vw" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-graphite/50 to-transparent" />
        <p className="kicker absolute bottom-6 left-6 text-white md:bottom-10 md:left-10">{BRAND.taglines.hero}</p>
        <p className="kicker absolute bottom-6 right-6 text-white/80 md:bottom-10 md:right-10">Artist&rsquo;s impression</p>
      </div>
    </section>
  );
}
