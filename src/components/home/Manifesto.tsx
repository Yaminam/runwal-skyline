"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { whenRevealed } from "@/lib/gate";
import { prefersReducedMotion } from "@/lib/motion";
import { DONE, FLOORS, NEXT, NOW, PER, record, type BandPoint, type RecordGroup } from "../three/record-state";

const RecordTower = dynamic(() => import("../three/RecordTower"), { ssr: false });

const LINE =
  "Forty-eight years ago, Subhash Runwal built one home in Thane. Today the name stands on 35 finished landmarks across Mumbai, Thane and Pune, and every one was built to be handed down.";

// Runwal Developers Limited DRHP (filed with SEBI, September 2025); figures as of 30 June 2025.
const SQFT = 11.22;
const NUMBERS: Array<{ g: RecordGroup; n: number; label: string; note: string; cls: string }> = [
  { g: "next", n: NEXT, label: "Upcoming projects", note: "On the drawing board", cls: "text-transparent [-webkit-text-stroke:1.5px_rgba(238,235,229,0.9)]" },
  { g: "now", n: NOW, label: "Developments under way", note: "Rising now", cls: "text-dusk-soft" },
  { g: "done", n: DONE, label: "Projects completed", note: "Lit and lived in", cls: "text-amber" },
];
const LINE_COLOR: Record<RecordGroup, string> = { done: "#f2a65a", now: "#8aa0f0", next: "rgba(238,235,229,0.75)" };

/**
 * The brand line lights up word by word, then "the tower of the record": a 3D tower, one window
 * column per Runwal project, built floor by floor as you scroll. Completed floors glow, floors under
 * way stand in scaffold, upcoming ones are blueprint glass under a crane. The big numbers count the
 * built windows and each draws a live leader line to its floors on the turning tower.
 */
export function Manifesto() {
  const root = useRef<HTMLElement>(null);
  const band = useRef<HTMLDivElement>(null);
  const canvasBox = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const nums = useRef<Partial<Record<RecordGroup | "sqft", HTMLElement | null>>>({});
  const anchors = useRef<Partial<Record<RecordGroup, HTMLElement | null>>>({});
  const [active, setActive] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [focus, setFocus] = useState<RecordGroup | null>(null);

  useEffect(() => {
    record.focus = focus;
  }, [focus]);

  useEffect(() => {
    const el = root.current;
    const bd = band.current;
    if (!el || !bd) return;
    const isMobile = window.innerWidth < 768;
    setMobile(isMobile);

    const counts = (p: number) => {
      record.p = p;
      const shown = Math.max(0, Math.min(FLOORS * PER, Math.floor(p * (FLOORS + 1.5) * PER)));
      const set = (k: RecordGroup | "sqft", v: string) => {
        const c = nums.current[k];
        if (c && c.textContent !== v) c.textContent = v;
      };
      set("done", String(Math.min(DONE, shown)));
      set("now", String(Math.min(NOW, Math.max(0, shown - DONE))));
      set("next", String(Math.min(NEXT, Math.max(0, shown - DONE - NOW))));
      set("sqft", (Math.min(1, p * 1.08) * SQFT).toFixed(2));
    };

    // leader lines from each number to its floors, refreshed every frame by the 3D scene
    record.project = (pts: BandPoint[]) => {
      const s = svg.current;
      const cb = canvasBox.current;
      if (!s || !cb) return;
      const base = bd.getBoundingClientRect();
      const cr = cb.getBoundingClientRect();
      pts.forEach((pt) => {
        const a = anchors.current[pt.g];
        const path = s.querySelector<SVGPathElement>(`[data-l="${pt.g}"]`);
        const dot = s.querySelector<SVGCircleElement>(`[data-d="${pt.g}"]`);
        if (!a || !path || !dot) return;
        const ar = a.getBoundingClientRect();
        const tx = cr.left - base.left + pt.x;
        const ty = cr.top - base.top + pt.y;
        const nx = ar.left - base.left - 18;
        const ny = ar.top - base.top + ar.height / 2;
        const ex = nx - Math.max(24, (nx - tx) * 0.35);
        path.setAttribute("d", `M${tx.toFixed(1)},${ty.toFixed(1)} L${ex.toFixed(1)},${ny.toFixed(1)} L${nx.toFixed(1)},${ny.toFixed(1)}`);
        const o = String(Math.min(1, pt.on * 1.4) * (record.focus && record.focus !== pt.g ? 0.25 : 1));
        path.style.opacity = o;
        dot.setAttribute("cx", tx.toFixed(1));
        dot.setAttribute("cy", ty.toFixed(1));
        dot.style.opacity = o;
      });
    };

    const vis = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "200px" });
    vis.observe(bd);

    if (prefersReducedMotion()) {
      counts(1);
      return () => {
        vis.disconnect();
        record.project = null;
      };
    }
    counts(0);
    let ctx: gsap.Context | null = null;
    const cancel = whenRevealed(() => {
      ctx = gsap.context(() => {
        gsap.fromTo(
          el.querySelectorAll(".mf-word"),
          { opacity: 0.14 },
          { opacity: 1, ease: "none", stagger: 0.05, scrollTrigger: { trigger: el.querySelector(".mf-line"), start: "top 80%", end: "bottom 45%", scrub: 0.5 } },
        );
        if (isMobile) {
          const o = { p: 0 };
          gsap.to(o, { p: 1, duration: 4, ease: "power2.inOut", scrollTrigger: { trigger: bd, start: "top 60%", once: true }, onUpdate: () => counts(o.p) });
        } else {
          ScrollTrigger.create({
            trigger: bd,
            start: "top top",
            end: "+=150%",
            pin: true,
            scrub: 0.5,
            onUpdate: (self) => counts(Math.min(1, self.progress * 1.12)),
          });
        }
      }, el);
    });
    return () => {
      cancel();
      ctx?.revert();
      vis.disconnect();
      record.project = null;
    };
  }, []);

  return (
    <section ref={root} className="relative bg-stone pt-32 md:pt-48">
      <div className="px-6 pb-24 md:px-10 md:pb-32">
        <div className="mb-14 flex flex-col gap-2 border-b border-graphite/15 pb-5 md:flex-row md:items-center md:justify-between">
          <p className="kicker">The Runwal record</p>
          <p className="kicker text-mute">Est. 1978 &middot; Sion, Mumbai</p>
        </div>
        <p className="mf-line title max-w-[68rem] text-[2rem] leading-[1.08] md:text-[3.9rem]">
          {LINE.split(" ").map((w, i) => (
            <span key={i} className="mf-word inline-block pr-[0.26em]">
              {w}
            </span>
          ))}
        </p>
      </div>

      {/* the tower of the record */}
      <div ref={band} data-tone="dark" className="relative overflow-hidden bg-night text-stone md:h-svh">
        <div className="blueprint-dark pointer-events-none absolute inset-0 opacity-45" aria-hidden />

        <div className="relative grid h-full gap-8 px-6 pb-20 pt-20 md:grid-cols-12 md:gap-6 md:px-10 md:py-0">
          {/* the year */}
          <div className="flex flex-col justify-center md:col-span-3">
            <p className="kicker flex items-center gap-3 text-amber">
              <span className="live-dot inline-block size-1.5 rounded-full bg-amber" /> The tower of the record
            </p>
            <p className="display mt-5 text-[24vw] leading-[0.85] md:text-[min(8.2vw,10rem)]">
              <span className="dusk-text">1978</span>
            </p>
            <p className="mt-5 max-w-xs text-[0.98rem] leading-relaxed text-stone/70">
              One home in Thane. Every window in this tower is a Runwal project since: built, rising, or on the drawing board.
            </p>
            <div className="mt-8 border-t border-stone/15 pt-5">
              <p className="title text-[2.6rem] leading-none tabular-nums md:text-[min(3.6vw,4.2rem)]">
                <span
                  ref={(n) => {
                    nums.current.sqft = n;
                  }}
                >
                  0.00
                </span>
              </p>
              <p className="mt-2 text-[0.95rem] text-stone/85">Mn sq ft handed over</p>
              <p className="kicker mt-1 text-stone/40">Homes, offices and malls</p>
            </div>
          </div>

          {/* the tower */}
          <div ref={canvasBox} className="relative h-[62svh] md:col-span-5 md:h-full">
            <RecordTower active={active} mobile={mobile} />
          </div>

          {/* the numbers, fixed layout; lines are drawn to them */}
          <div className="grid grid-cols-3 gap-4 md:col-span-4 md:flex md:flex-col md:justify-center md:gap-[5svh] md:pl-[8%]">
            {NUMBERS.map((x) => (
              <div
                key={x.g}
                tabIndex={0}
                onMouseEnter={() => setFocus(x.g)}
                onMouseLeave={() => setFocus(null)}
                onFocus={() => setFocus(x.g)}
                onBlur={() => setFocus(null)}
                className={`relative outline-none transition-opacity duration-500 ${focus && focus !== x.g ? "opacity-30" : "opacity-100"}`}
              >
                <span
                  ref={(n) => {
                    anchors.current[x.g] = n;
                  }}
                  className={`display block leading-none tabular-nums text-[13vw] md:text-[min(6.4vw,7.6rem)] ${x.cls}`}
                >
                  <span
                    ref={(n) => {
                      nums.current[x.g] = n;
                    }}
                  >
                    0
                  </span>
                </span>
                <p className="mt-2 text-[0.8rem] leading-snug text-stone/85 md:mt-3 md:text-[1rem]">{x.label}</p>
                <p className="kicker mt-1 hidden text-stone/40 md:block">{x.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* leader lines (desktop) */}
        <svg ref={svg} className="pointer-events-none absolute inset-0 hidden h-full w-full md:block" aria-hidden>
          {NUMBERS.map((x) => (
            <g key={x.g}>
              <path data-l={x.g} d="" fill="none" stroke={LINE_COLOR[x.g]} strokeWidth="1" strokeDasharray="4 4" style={{ opacity: 0 }} />
              <circle data-d={x.g} r="3.5" fill={LINE_COLOR[x.g]} style={{ opacity: 0 }} />
            </g>
          ))}
        </svg>

        <p className="kicker absolute bottom-6 left-6 text-stone/35 md:left-10">Source: Runwal Developers Ltd. DRHP, filed with SEBI, Sept 2025 (as of 30 June 2025)</p>
      </div>
    </section>
  );
}
