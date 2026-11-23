"use client";

import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { INVESTORS } from "@/lib/coverage";
import { whenRevealed } from "@/lib/gate";
import { clamp, prefersReducedMotion, smoothstep } from "@/lib/motion";

const TOTAL = INVESTORS.split.reduce((a, b) => a + b.cr, 0);
const FRESH = INVESTORS.split[0];
const OFS = INVESTORS.split[1];
const fmt = (n: number) => Math.round(n).toLocaleString("en-IN");

/**
 * The offer, told by scroll: one amber bar fills to the full issue size while the figure counts up,
 * then it breaks into the fresh issue and the promoter's offer for sale, each with its own counter,
 * and finally the listing details settle underneath.
 */
export function IpoStory() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = <T extends HTMLElement>(s: string) => el.querySelector<T>(s);
    const total = q("[data-total]");
    const fresh = q("[data-fresh]");
    const ofs = q("[data-ofs]");
    const freshN = q("[data-fresh-n]");
    const ofsN = q("[data-ofs-n]");
    const labels = el.querySelectorAll<HTMLElement>("[data-split-label]");
    const tail = el.querySelectorAll<HTMLElement>("[data-tail]");
    const step = el.querySelectorAll<HTMLElement>("[data-step]");
    const freshShare = FRESH.cr / TOTAL;

    const render = (p: number) => {
      const fill = smoothstep(0.04, 0.42, p);
      const split = smoothstep(0.48, 0.74, p);
      const rest = smoothstep(0.78, 0.94, p);
      if (total) total.textContent = fmt(TOTAL * fill);
      if (fresh) fresh.style.width = `${freshShare * 100 * fill}%`;
      if (ofs) {
        // the offer for sale peels away: right, then down onto its own line
        ofs.style.left = `${freshShare * 100 * fill}%`;
        ofs.style.width = `${(1 - freshShare) * 100 * fill}%`;
        ofs.style.transform = `translateY(${split * 115}%)`;
        if (fresh) fresh.style.width = `calc(${freshShare * 100 * fill}% - ${split * 0.6}rem)`;
        ofs.style.opacity = String(fill > 0 ? 1 : 0);
        ofs.dataset.split = split > 0.5 ? "1" : "0";
      }
      if (freshN) freshN.textContent = fmt(FRESH.cr * split);
      if (ofsN) ofsN.textContent = fmt(OFS.cr * split);
      labels.forEach((l) => {
        l.style.opacity = String(split);
        l.style.transform = `translateY(${(1 - split) * 12}px)`;
      });
      tail.forEach((t, i) => {
        const a = clamp(rest * 1.6 - i * 0.2);
        t.style.opacity = String(a);
        t.style.transform = `translateY(${(1 - a) * 18}px)`;
      });
      step.forEach((s, i) => {
        const on = i === 0 ? p < 0.46 : i === 1 ? p >= 0.46 && p < 0.77 : p >= 0.77;
        s.dataset.on = on ? "1" : "0";
      });
    };

    if (prefersReducedMotion()) {
      render(1);
      return;
    }
    render(0);
    let st: ScrollTrigger | null = null;
    const cancel = whenRevealed(() => {
      st = ScrollTrigger.create({ trigger: el, start: "top top", end: "bottom bottom", scrub: 0.5, onUpdate: (s) => render(s.progress) });
    });
    return () => {
      cancel();
      st?.kill();
    };
  }, []);

  return (
    <section ref={root} data-tone="dark" className="relative h-[260vh] bg-graphite text-stone md:h-[300vh]" aria-label="The proposed IPO">
      <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden px-6 md:px-10">
        <div className="blueprint-dark pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="kicker text-amber">Proposed IPO &middot; DRHP filed {INVESTORS.drhp}</p>
            <ol className="flex gap-5" aria-hidden>
              {["The issue", "The split", "The listing"].map((s, i) => (
                <li key={s} data-step data-on={i === 0 ? "1" : "0"} className="kicker text-stone/35 transition-colors duration-500 data-[on=1]:text-stone">
                  0{i + 1} {s}
                </li>
              ))}
            </ol>
          </div>

          <p className="display mt-8 text-[15vw] tabular-nums md:text-[min(9.5vw,11rem)]">
            ₹<span data-total>{fmt(TOTAL)}</span> <span className="accent normal-case">crore</span>
          </p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone/60">Up to ₹{fmt(TOTAL)} crore, 100% book built. Scroll to see how the offer is made up.</p>

          {/* the bar */}
          <div className="relative mt-12 h-16 md:mt-16 md:h-20">
            <div className="absolute inset-0 border border-stone/10" aria-hidden />
            <div data-fresh className="absolute inset-y-0 left-0 bg-amber shadow-[0_0_40px_rgba(242,166,90,0.35)]" style={{ width: `${(FRESH.cr / TOTAL) * 100}%` }} />
            <div
              data-ofs
              className="absolute inset-y-0 border border-stone/40 bg-stone/10 bg-[repeating-linear-gradient(135deg,rgba(238,235,229,0.14)_0_6px,transparent_6px_12px)]"
              style={{ left: `${(FRESH.cr / TOTAL) * 100}%`, width: `${(OFS.cr / TOTAL) * 100}%` }}
            />
          </div>

          <div className="mt-24 grid gap-6 md:mt-32 md:grid-cols-2">
            <div data-split-label className="opacity-0">
              <p className="kicker text-amber">{FRESH.label}</p>
              <p className="title mt-2 text-4xl tabular-nums md:text-6xl">
                ₹<span data-fresh-n>{fmt(FRESH.cr)}</span> Cr
              </p>
              <p className="mt-2 text-sm text-stone/55">New equity shares issued by the company</p>
            </div>
            <div data-split-label className="opacity-0 md:text-right">
              <p className="kicker text-stone/60">{OFS.label}</p>
              <p className="title mt-2 text-4xl tabular-nums md:text-6xl">
                ₹<span data-ofs-n>{fmt(OFS.cr)}</span> Cr
              </p>
              <p className="mt-2 text-sm text-stone/55">By the promoter selling shareholder, {INVESTORS.promoter}</p>
            </div>
          </div>

          <ul className="mt-10 flex flex-wrap gap-2 md:mt-14">
            {["Face value ₹1 per share", "Proposed listing on BSE", "Proposed listing on NSE", `CIN ${INVESTORS.cin}`].map((t) => (
              <li key={t} data-tail className="kicker border border-stone/20 px-3 py-2 text-stone/75 opacity-0">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
