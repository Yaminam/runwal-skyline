"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useMemo, useRef, useState } from "react";
import { CAREERS, OPENINGS } from "@/lib/coverage";
import { whenRevealed } from "@/lib/gate";
import { prefersReducedMotion } from "@/lib/motion";

const deptOf = (d: string) => d.replace(/ \(.*\)$/, "");
const DEPTS = Array.from(new Set(OPENINGS.map((o) => deptOf(o.dept))));
const COLS = 6;

/**
 * Every opening is a window in a Runwal tower. Windows light up one by one when the tower comes into
 * view; picking a department leaves only its windows lit in amber. Hover or tap a window to read the
 * role, and apply from the card.
 */
export function OpeningsTower() {
  const root = useRef<HTMLElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const [dept, setDept] = useState<string | null>(null);
  const [sel, setSel] = useState<number>(0);
  const [lit, setLit] = useState(() => typeof window !== "undefined" && prefersReducedMotion());

  // pad the facade with a few permanently dark windows so the tower reads as a building
  const rows = Math.ceil((OPENINGS.length + 4) / COLS);
  const slots = rows * COLS;
  const order = useMemo(() => {
    // scatter roles over the facade in a stable way
    const idx = Array.from({ length: slots }, (_, i) => i);
    let s = 1978;
    for (let i = idx.length - 1; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    const map = new Map<number, number>();
    OPENINGS.forEach((_, k) => map.set(idx[k], k));
    return map;
  }, [slots]);

  const shown = OPENINGS.map((o, i) => ({ o, i })).filter(({ o }) => !dept || deptOf(o.dept) === dept);
  const current = OPENINGS[sel];

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const n = { v: 0 };
    if (prefersReducedMotion()) {
      if (countRef.current) countRef.current.textContent = String(OPENINGS.length);
      return;
    }
    let st: ScrollTrigger | null = null;
    const cancel = whenRevealed(() => {
      st = ScrollTrigger.create({
        trigger: el,
        start: "top 65%",
        once: true,
        onEnter: () => {
          setLit(true);
          gsap.to(n, { v: OPENINGS.length, duration: 1.6, ease: "power2.out", onUpdate: () => countRef.current && (countRef.current.textContent = String(Math.round(n.v))) });
        },
      });
    });
    return () => {
      cancel();
      st?.kill();
    };
  }, []);

  return (
    <section ref={root} data-tone="dark" className="relative overflow-hidden bg-night px-6 py-24 text-stone md:px-10 md:py-32" aria-label="Current openings">
      <style>{`@keyframes rw-fade-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}`}</style>
      <div className="blueprint-dark pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="relative grid gap-12 md:grid-cols-12 md:gap-10">
        <div className="md:col-span-5">
          <p className="kicker text-amber">Current openings</p>
          <h2 className="display mt-5 text-[11vw] md:text-[min(5vw,6rem)]">
            <span ref={countRef} className="tabular-nums">
              0
            </span>{" "}
            <span className="accent normal-case">lights on</span>
          </h2>
          <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-stone/65">
            Every lit window is a role open right now. Pick a team to see where it sits, then hover a window to read the brief.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDept(null)}
              className={`border px-4 py-2.5 text-sm transition-colors ${dept === null ? "border-amber bg-amber text-graphite" : "border-stone/20 text-stone/75 hover:border-stone/50"}`}
            >
              All teams
            </button>
            {DEPTS.map((d) => {
              const c = OPENINGS.filter((o) => deptOf(o.dept) === d).length;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setDept(d);
                    const first = OPENINGS.findIndex((o) => deptOf(o.dept) === d);
                    if (first >= 0) setSel(first);
                  }}
                  className={`border px-4 py-2.5 text-sm transition-colors ${dept === d ? "border-amber bg-amber text-graphite" : "border-stone/20 text-stone/75 hover:border-stone/50"}`}
                >
                  {d} <span className="kicker ml-1 opacity-60">{c}</span>
                </button>
              );
            })}
          </div>

          {/* role card */}
          {current ? (
            <div key={sel} className="mt-10 border border-amber/40 bg-black/30 p-6 [animation:rw-fade-up_.55s_cubic-bezier(0.16,1,0.3,1)]">
              <p className="kicker text-amber">
                Window {String(sel + 1).padStart(2, "0")} &middot; {deptOf(current.dept)}
              </p>
              <p className="title mt-3 text-2xl md:text-3xl">{current.role}</p>
              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="kicker text-stone/45">Location</dt>
                  <dd className="mt-1 text-stone/85">{current.location}</dd>
                </div>
                <div>
                  <dt className="kicker text-stone/45">Experience</dt>
                  <dd className="mt-1 text-stone/85">{current.experience}</dd>
                </div>
                {current.qualification ? (
                  <div className="col-span-2">
                    <dt className="kicker text-stone/45">Qualification</dt>
                    <dd className="mt-1 text-stone/85">{current.qualification}</dd>
                  </div>
                ) : null}
              </dl>
              <a
                href={CAREERS.apply}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-3 bg-amber px-5 py-3 text-sm font-medium text-graphite transition-colors hover:bg-stone"
              >
                Apply on runwalrealty.com &#8599;
              </a>
            </div>
          ) : null}
        </div>

        {/* the tower */}
        <div className="md:col-span-6 md:col-start-7">
          <div className="mx-auto flex w-full max-w-[26rem] flex-col items-center">
            <div className="h-6 w-1/3 border-x border-t border-stone/25" aria-hidden />
            <div className="w-[82%] border-x border-t border-stone/25 px-3 pb-3 pt-4 md:px-4">
              <div className="grid gap-2 md:gap-2.5" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }} role="list">
                {Array.from({ length: slots }, (_, slot) => {
                  const k = order.get(slot);
                  if (k === undefined) return <span key={slot} className="aspect-[3/4] border border-stone/10 bg-white/[0.02]" aria-hidden />;
                  const o = OPENINGS[k];
                  const on = lit && (!dept || deptOf(o.dept) === dept);
                  const active = sel === k;
                  return (
                    <button
                      key={slot}
                      type="button"
                      role="listitem"
                      aria-label={`${o.role}, ${o.location}`}
                      onMouseEnter={() => on && setSel(k)}
                      onFocus={() => setSel(k)}
                      onClick={() => {
                        setSel(k);
                        if (!on) setDept(null);
                      }}
                      style={{ transitionDelay: lit && !dept ? `${(slot % 13) * 55}ms` : "0ms" }}
                      className={`relative aspect-[3/4] border transition-[background-color,box-shadow,border-color] duration-500 ${
                        on
                          ? active
                            ? "border-stone bg-[#ffd9a8] shadow-[0_0_22px_rgba(242,166,90,0.9)]"
                            : "border-amber/60 bg-amber/85 shadow-[0_0_14px_rgba(242,166,90,0.55)] hover:bg-[#ffd9a8]"
                          : "border-stone/15 bg-white/[0.03]"
                      }`}
                    >
                      <span className="absolute inset-x-0 top-1/2 h-px bg-black/15" aria-hidden />
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="h-10 w-full border-x border-t border-stone/25 bg-white/[0.02]" aria-hidden>
              <p className="kicker pt-3 text-center text-[0.6rem] text-stone/40">Runwal Realty &middot; Head office, Sion</p>
            </div>
            <div className="h-px w-[130%] bg-stone/25" aria-hidden />
          </div>
          <p className="kicker mt-6 text-center text-stone/45">
            {String(shown.length).padStart(2, "0")} of {OPENINGS.length} roles lit
          </p>
        </div>
      </div>
    </section>
  );
}
