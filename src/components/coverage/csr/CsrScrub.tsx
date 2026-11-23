"use client";

import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { CSR } from "@/lib/coverage";
import { whenRevealed } from "@/lib/gate";
import { clamp, prefersReducedMotion, smoothstep } from "@/lib/motion";
import { Pic } from "../../site/Pic";

// leaves along the stem: [height 0..1, side -1|1, size]
const LEAVES: Array<[number, number, number]> = [
  [0.14, 1, 1],
  [0.24, -1, 0.9],
  [0.35, 1, 1.15],
  [0.47, -1, 1],
  [0.58, 1, 0.85],
  [0.69, -1, 1.1],
  [0.8, 1, 0.95],
  [0.9, -1, 0.8],
];

/**
 * The two causes on one pinned screen. Scrolling slides the divide from Empowering Minds across to
 * Health for All; the divide itself is a stem that grows a leaf at a time as you go, so the whole
 * section reads as one thing growing.
 */
export function CsrScrub() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const left = el.querySelector<HTMLElement>("[data-left]");
    const right = el.querySelector<HTMLElement>("[data-right]");
    const stem = el.querySelector<HTMLElement>("[data-stem]");
    const path = el.querySelector<SVGPathElement>("[data-path]");
    const leaves = el.querySelectorAll<SVGPathElement>("[data-leaf]");
    const copyA = el.querySelector<HTMLElement>("[data-copy-a]");
    const copyB = el.querySelector<HTMLElement>("[data-copy-b]");
    const bar = el.querySelector<HTMLElement>("[data-bar]");
    const len = path?.getTotalLength() ?? 1;
    if (path) {
      path.style.strokeDasharray = `${len}`;
    }
    const mobile = () => window.innerWidth < 768;

    const render = (p: number) => {
      const s = smoothstep(0.08, 0.92, p);
      // divide travels from 68% to 32% of the width (or height on phones)
      const at = 68 - 36 * s;
      if (mobile()) {
        if (left) left.style.clipPath = `inset(0 0 ${100 - at}% 0)`;
        if (right) right.style.clipPath = `inset(${at}% 0 0 0)`;
        if (stem) {
          stem.style.left = "50%";
          stem.style.top = `${at}%`;
          stem.style.transform = "translate(-50%,-50%) rotate(90deg)";
        }
      } else {
        if (left) left.style.clipPath = `inset(0 ${100 - at}% 0 0)`;
        if (right) right.style.clipPath = `inset(0 0 0 ${at}%)`;
        if (stem) {
          stem.style.left = `${at}%`;
          stem.style.top = "50%";
          stem.style.transform = "translate(-50%,-50%)";
        }
      }
      const g = clamp(p * 1.15);
      if (path) path.style.strokeDashoffset = String(len * (1 - g));
      leaves.forEach((l, i) => {
        const h = LEAVES[i][0];
        const k = clamp((g - h) / 0.08);
        l.style.transform = `scale(${k})`;
        l.style.opacity = String(k);
      });
      const a = 1 - smoothstep(0.38, 0.5, p);
      const b = smoothstep(0.5, 0.62, p);
      if (copyA) {
        copyA.style.opacity = String(a);
        copyA.style.transform = `translateY(${(1 - a) * -24}px)`;
      }
      if (copyB) {
        copyB.style.opacity = String(b);
        copyB.style.transform = `translateY(${(1 - b) * 24}px)`;
      }
      if (bar) bar.style.transform = `scaleX(${p})`;
    };

    if (prefersReducedMotion()) {
      render(0.5);
      return;
    }
    render(0);
    let st: ScrollTrigger | null = null;
    const cancel = whenRevealed(() => {
      st = ScrollTrigger.create({ trigger: el, start: "top top", end: "bottom bottom", scrub: 0.6, onUpdate: (x) => render(x.progress) });
    });
    const onResize = () => st && render(st.progress);
    window.addEventListener("resize", onResize);
    return () => {
      cancel();
      st?.kill();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const [edu, health] = CSR.areas;

  return (
    <section ref={root} data-tone="dark" className="relative h-[320vh] bg-graphite text-stone" aria-label="Our two causes">
      <div className="sticky top-0 h-svh overflow-hidden">
        <div data-left className="absolute inset-0">
          <Pic src={edu.image} alt={edu.title} fill sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />
        </div>
        <div data-right className="absolute inset-0">
          <Pic src={health.image} alt={health.title} fill sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />
        </div>

        {/* the growing stem on the divide */}
        <div data-stem className="pointer-events-none absolute h-[92%] w-24" aria-hidden>
          <svg viewBox="0 0 100 1000" preserveAspectRatio="none" className="h-full w-full overflow-visible">
            <path data-path d="M50 1000 C 46 820, 56 700, 50 560 S 44 300, 50 0" fill="none" stroke="#f2a65a" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
            {LEAVES.map(([h, side, sz], i) => {
              const y = 1000 - h * 1000;
              const dx = side * 46 * sz;
              return (
                <path
                  key={i}
                  data-leaf
                  d={`M50 ${y} Q ${50 + dx * 0.5} ${y - 40 * sz}, ${50 + dx} ${y - 22 * sz} Q ${50 + dx * 0.6} ${y + 6 * sz}, 50 ${y} Z`}
                  fill="#f2a65a"
                  fillOpacity="0.9"
                  style={{ transformOrigin: `50px ${y}px`, transformBox: "view-box", transform: "scale(0)", opacity: 0 }}
                />
              );
            })}
          </svg>
        </div>

        {/* copy */}
        <div className="absolute inset-x-6 bottom-20 md:inset-x-10 md:bottom-24">
          <div className="relative min-h-[16rem] md:min-h-[14rem]">
            {[edu, health].map((a, i) => (
              <div key={a.key} {...(i === 0 ? { "data-copy-a": "" } : { "data-copy-b": "" })} className={`absolute inset-x-0 bottom-0 max-w-2xl ${i === 1 ? "opacity-0 md:ml-auto md:text-right" : ""}`}>
                <p className="kicker text-amber">
                  0{i + 1} &middot; {a.key === "education" ? "Education" : "Healthcare"}
                </p>
                <h2 className="display mt-4 text-[9.6vw] md:text-[min(5.5vw,6.5rem)]">{a.title}</h2>
                <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-stone/80 md:inline-block">{a.text}</p>
                <ul className={`mt-5 flex flex-wrap gap-2 ${i === 1 ? "md:justify-end" : ""}`}>
                  {a.groups.map((g) => (
                    <li key={g} className="kicker border border-stone/30 bg-black/20 px-3 py-2 text-stone/85 backdrop-blur-sm">
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* progress */}
        <div className="absolute inset-x-6 bottom-8 flex items-center gap-4 md:inset-x-10">
          <span className="kicker text-stone/60">Minds</span>
          <div className="relative h-px flex-1 bg-stone/20">
            <div data-bar className="absolute inset-0 origin-left scale-x-0 bg-amber" />
          </div>
          <span className="kicker text-stone/60">Health</span>
        </div>
      </div>
    </section>
  );
}
