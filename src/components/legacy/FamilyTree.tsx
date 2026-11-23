"use client";

import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SPLIT_2016 } from "@/lib/company";
import { whenRevealed } from "@/lib/gate";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(Flip);

type Bin = "tray" | "realty" | "other";
type Chip = { id: string; name: string; place: string; owner: "realty" | "other" };

// Ownership as stated on runwalrealty.com (company overview FAQ and project listings).
const CHIPS: Chip[] = [
  { id: "gc-dombivli", name: "Runwal Garden City", place: "Dombivli", owner: "other" },
  { id: "malabar", name: "Runwal Malabar", place: "Malabar Hill", owner: "realty" },
  { id: "bliss", name: "Runwal Bliss", place: "Kanjurmarg", owner: "other" },
  { id: "rcity", name: "R City", place: "Ghatkopar West", owner: "realty" },
  { id: "gc-thane", name: "Runwal Garden City", place: "Thane", owner: "realty" },
  { id: "avenue", name: "Runwal Avenue", place: "Kanjurmarg", owner: "other" },
  { id: "raaya", name: "Runwal Raaya", place: "Worli", owner: "realty" },
  { id: "tcp", name: "Runwal The Central Park", place: "Pune", owner: "realty" },
];

/**
 * 2016 as a family tree: one trunk from 1978 splits into two companies (the branches draw on scroll).
 * Below, "Whose project is it?": tap a name and it flies to the right side of the line.
 */
export function FamilyTree() {
  const root = useRef<HTMLElement>(null);
  const [where, setWhere] = useState<Record<string, Bin>>(() => Object.fromEntries(CHIPS.map((c) => [c.id, "tray"])));
  const [last, setLast] = useState<string | null>(null);
  const flipState = useRef<Flip.FlipState | null>(null);

  const sorted = Object.values(where).filter((b) => b !== "tray").length;

  const capture = () => {
    if (!prefersReducedMotion()) flipState.current = Flip.getState(".ft-chip");
  };
  const sort = (c: Chip) => {
    if (where[c.id] !== "tray") return;
    capture();
    setLast(c.id);
    setWhere((w) => ({ ...w, [c.id]: c.owner }));
  };
  const sortAll = () => {
    capture();
    setLast(null);
    setWhere(Object.fromEntries(CHIPS.map((c) => [c.id, c.owner])));
  };
  const reset = () => {
    capture();
    setLast(null);
    setWhere(Object.fromEntries(CHIPS.map((c) => [c.id, "tray"])));
  };

  // animate chips from their old spots to the new bins
  useLayoutEffect(() => {
    if (!flipState.current) return;
    Flip.from(flipState.current, { duration: 0.9, ease: "expo.inOut", stagger: 0.04, absolute: true, scale: true });
    flipState.current = null;
  }, [where]);

  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let ctx: gsap.Context | null = null;
    const cancel = whenRevealed(() => {
      ctx = gsap.context(() => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: ".ft-tree", start: "top 75%", end: "bottom 60%", scrub: 0.6 } });
        el.querySelectorAll<SVGPathElement>(".ft-path").forEach((p) => {
          const len = p.getTotalLength();
          gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
        });
        tl.to(".ft-trunk", { strokeDashoffset: 0, ease: "none", duration: 0.45 })
          .fromTo(".ft-knot", { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.08 })
          .to(".ft-branch", { strokeDashoffset: 0, ease: "none", duration: 0.45 }, ">")
          .fromTo(".ft-leaf", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.15, stagger: 0.05 }, "-=0.1");
      }, el);
    });
    return () => {
      cancel();
      ctx?.revert();
    };
  }, []);

  const chip = (c: Chip) => {
    const placed = where[c.id];
    const fresh = last === c.id;
    return (
      <button
        key={c.id}
        type="button"
        data-flip-id={c.id}
        onClick={() => sort(c)}
        disabled={placed !== "tray"}
        className={`ft-chip group flex items-baseline gap-2 border px-4 py-3 text-left transition-colors ${
          placed === "tray"
            ? "border-stone/25 bg-stone/[0.04] text-stone hover:border-amber hover:bg-amber/10"
            : placed === "realty"
              ? "border-amber/60 bg-amber/15 text-stone"
              : "border-stone/15 bg-transparent text-stone/55"
        } ${fresh ? "ring-1 ring-amber" : ""}`}
      >
        <span className="text-[0.95rem]">{c.name}</span>
        <span className="kicker text-[0.62rem] text-stone/50">{c.place}</span>
        {placed === "realty" && <span className="text-amber">&#10003;</span>}
      </button>
    );
  };

  return (
    <section ref={root} data-tone="dark" className="relative overflow-hidden bg-graphite px-6 py-28 text-stone md:px-10 md:py-40">
      <div className="blueprint-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden />

      <div className="relative grid gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="kicker text-amber">Since 2016</p>
          <h2 className="title mt-5 text-4xl leading-[1.05] md:text-6xl">
            Two companies,
            <br />
            <span className="accent">one founding name</span>
          </h2>
        </div>
        <p className="text-[1.02rem] leading-relaxed text-stone/75 md:col-span-6 md:col-start-7 md:pt-10">{SPLIT_2016.text}</p>
      </div>

      {/* the tree */}
      <div className="ft-tree relative mx-auto mt-16 max-w-5xl md:mt-20">
        <svg viewBox="0 0 1000 300" className="h-auto w-full overflow-visible" aria-hidden>
          <path className="ft-path ft-trunk" d="M500 0 V150" fill="none" stroke="rgba(238,235,229,.55)" strokeWidth="2" />
          <path className="ft-path ft-branch" d="M500 150 C500 230, 230 200, 230 290" fill="none" stroke="#f2a65a" strokeWidth="3" />
          <path className="ft-path ft-branch" d="M500 150 C500 230, 770 200, 770 290" fill="none" stroke="rgba(238,235,229,.28)" strokeWidth="2" />
          <g className="ft-knot">
            <circle cx="500" cy="150" r="9" fill="#16181b" stroke="#f2a65a" strokeWidth="2" />
          </g>
        </svg>
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[130%] whitespace-nowrap text-center">
          <p className="title text-xl md:text-2xl">Runwal</p>
          <p className="kicker mt-1 text-stone/50">Founded 1978 by Subhash Runwal</p>
        </div>
        <span className="kicker absolute left-1/2 top-[50%] ml-6 -translate-y-1/2 text-amber">2016</span>

        <div className="mt-2 grid grid-cols-2 gap-6 md:gap-16">
          <div className="ft-leaf border border-amber/50 bg-amber/[0.07] p-5 text-center md:p-7">
            <p className="kicker text-amber">You are here</p>
            <p className="title mt-3 text-2xl md:text-3xl">Runwal Realty</p>
            <p className="mt-2 text-sm text-stone/65">Runwal Developers Ltd &middot; led by Sandeep Runwal</p>
          </div>
          <div className="ft-leaf border border-stone/15 p-5 text-center md:p-7">
            <p className="kicker text-stone/45">Separate company</p>
            <p className="title mt-3 text-2xl text-stone/60 md:text-3xl">Runwal Enterprises</p>
            <p className="mt-2 text-sm text-stone/45">Led by Subodh Runwal</p>
          </div>
        </div>
      </div>

      {/* sorter */}
      <div className="relative mx-auto mt-24 max-w-5xl border-t border-stone/15 pt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker text-amber">A quick game</p>
            <h3 className="title mt-3 text-3xl md:text-4xl">
              Whose project <span className="accent">is it?</span>
            </h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-stone/60">Tap a name. It goes to the side of the family it belongs to.</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="kicker tabular-nums text-stone/60">
              {sorted}/{CHIPS.length} sorted
            </span>
            {sorted < CHIPS.length ? (
              <button type="button" onClick={sortAll} className="kicker border border-stone/25 px-4 py-2.5 transition-colors hover:border-amber hover:text-amber">
                Show me
              </button>
            ) : (
              <button type="button" onClick={reset} className="kicker border border-stone/25 px-4 py-2.5 transition-colors hover:border-amber hover:text-amber">
                Play again
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 flex min-h-[3.5rem] flex-wrap gap-2.5">{CHIPS.filter((c) => where[c.id] === "tray").map(chip)}</div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="min-h-[12rem] border border-amber/30 p-5">
            <p className="kicker mb-4 text-amber">Runwal Realty projects</p>
            <div className="flex flex-wrap gap-2.5">{CHIPS.filter((c) => where[c.id] === "realty").map(chip)}</div>
          </div>
          <div className="min-h-[12rem] border border-dashed border-stone/20 p-5">
            <p className="kicker mb-4 text-stone/45">Not Runwal Realty projects</p>
            <div className="flex flex-wrap gap-2.5">{CHIPS.filter((c) => where[c.id] === "other").map(chip)}</div>
          </div>
        </div>
        <p className="mt-6 text-xs leading-relaxed text-stone/40">{SPLIT_2016.note}</p>
      </div>
    </section>
  );
}
