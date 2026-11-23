"use client";

import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";
import { OASIS } from "@/lib/coverage";
import { useReducedMotion } from "@/lib/motion";
import { getLenis } from "../../SmoothScroll";
import { Pic } from "../../site/Pic";

const N = OASIS.expressions.length;

// the word fills the frame but never overflows it (wide display face, about 0.82em per letter)
const fit = (w: string) => `min(17vw, 12rem, ${(74 / (w.length * 0.86)).toFixed(2)}vw)`;

/**
 * The six expressions of belonging as full-screen chapters. The frame holds still (sticky) while the
 * page scrolls through it: each chapter cross-fades its image, sets its word in huge type and its line
 * from the site, and a rail on the right tracks where you are. Click the rail to jump.
 */
export function OasisChapters() {
  const root = useRef<HTMLElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [i, setI] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (reduced) return;
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const p = self.progress;
        setI(Math.min(N - 1, Math.floor(p * N)));
        if (bar.current) bar.current.style.transform = `scaleY(${p})`;
      },
    });
    return () => st.kill();
  }, [reduced]);

  const jump = (k: number) => {
    const el = root.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const span = el.offsetHeight - window.innerHeight;
    const y = top + span * ((k + 0.5) / N);
    const l = getLenis();
    if (l) l.scrollTo(y, { duration: 1.4 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  if (reduced) {
    return (
      <section data-tone="dark" className="bg-graphite px-6 py-24 text-stone md:px-10">
        <ul className="grid gap-10 md:grid-cols-2">
          {OASIS.expressions.map((e, k) => (
            <li key={e.k}>
              <div className="relative aspect-[4/3] overflow-hidden">
                <Pic src={e.image} alt={`${e.k} at Club Oasis`} fill sizes="(min-width: 768px) 50vw, 100vw" />
              </div>
              <p className="kicker mt-5 text-amber">0{k + 1}</p>
              <p className="display mt-2 text-5xl">{e.k}</p>
              <p className="mt-3 text-stone/75">{e.text}</p>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const cur = OASIS.expressions[i];
  return (
    <section ref={root} data-tone="dark" className="relative bg-night text-stone" style={{ height: `${N * 90 + 30}svh` }} aria-label="The six expressions of belonging">
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* images */}
        {OASIS.expressions.map((e, k) => (
          <div
            key={e.k}
            className={`absolute inset-0 transition-[opacity,transform,filter] duration-[1.4s] ease-[var(--ease-out-expo)] ${
              k === i ? "scale-100 opacity-100 blur-0" : k < i ? "scale-[1.04] opacity-0 blur-[2px]" : "scale-[1.1] opacity-0"
            }`}
            aria-hidden={k !== i}
          >
            <Pic src={e.image} alt={`${e.k} at Club Oasis`} fill sizes="100vw" priority={k === 0} />
          </div>
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,16,21,.88)_0%,rgba(13,16,21,.55)_42%,rgba(13,16,21,.08)_75%),linear-gradient(0deg,rgba(13,16,21,.75),rgba(13,16,21,0)_40%)]" />

        {/* copy */}
        <div className="absolute inset-x-6 bottom-20 md:inset-x-10 md:bottom-24">
          <p className="kicker flex items-center gap-3 text-amber">
            <span className="hidden md:inline">The six expressions of belonging</span>
            <span className="md:hidden">Belonging</span>
            <span className="tabular-nums text-stone/60">
              0{i + 1} / 0{N}
            </span>
          </p>
          <div className="relative mt-4 overflow-hidden" style={{ height: `calc(${fit(cur.k)} * 1.02)` }} aria-live="polite">
            {OASIS.expressions.map((e, k) => (
              <span
                key={e.k}
                style={{ fontSize: fit(e.k) }}
                className={`display absolute left-0 top-0 block whitespace-nowrap transition-[transform,opacity] duration-[1.1s] ease-[var(--ease-out-expo)] ${
                  k === i ? "translate-y-0 opacity-100" : k < i ? "-translate-y-[105%] opacity-0" : "translate-y-[105%] opacity-0"
                }`}
              >
                {e.k}
              </span>
            ))}
          </div>
          <p key={cur.k} className="mt-6 max-w-md text-[1.05rem] leading-relaxed text-stone/85 md:text-[1.15rem]">
            {cur.text}
          </p>
          <p className="kicker mt-6 text-stone/40">Club Oasis &middot; artist impression</p>
        </div>

        {/* rail */}
        <nav className="absolute right-5 top-1/2 flex -translate-y-1/2 items-stretch gap-3 md:right-10" aria-label="Chapters">
          <ol className="flex flex-col justify-between gap-3 py-1 text-right">
            {OASIS.expressions.map((e, k) => (
              <li key={e.k}>
                <button
                  type="button"
                  onClick={() => jump(k)}
                  className={`kicker transition-colors ${k === i ? "text-amber" : "text-stone/40 hover:text-stone"}`}
                  aria-current={k === i ? "step" : undefined}
                >
                  <span className="hidden md:inline">{e.k} </span>0{k + 1}
                </button>
              </li>
            ))}
          </ol>
          <span className="relative w-px bg-stone/20">
            <span ref={bar} className="dusk-line absolute inset-0 origin-top scale-y-0" />
          </span>
        </nav>
      </div>
    </section>
  );
}
