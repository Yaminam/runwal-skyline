"use client";

import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { bhkLabel } from "@/lib/project-format";
import { COMMERCIAL, PROJECTS, REGIONS, type Project, type Region } from "@/lib/projects";
import { Pic } from "../site/Pic";
import { TLink } from "../site/Transition";
import { MapFinderSection } from "./MapFinderSection";

gsap.registerPlugin(Flip);

const BEDS = [1, 2, 3, 4, 5] as const;

/** Segmented control: a sliding graphite pill under the active option. */
function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  render,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  render?: (v: T) => string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const w = wrap.current;
    const el = w?.querySelector<HTMLElement>(`[data-v="${String(value)}"]`);
    if (!w || !el || !pill.current) return;
    gsap.to(pill.current, {
      x: el.offsetLeft,
      width: el.offsetWidth,
      duration: prefersReducedMotion() ? 0 : 0.6,
      ease: "expo.out",
    });
  }, [value]);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span className="kicker text-mute">{label}</span>
      <div ref={wrap} role="radiogroup" aria-label={label} className="no-scrollbar relative flex overflow-x-auto border border-graphite/15 p-1">
        <span ref={pill} aria-hidden className="absolute bottom-1 left-0 top-1 w-0 bg-graphite" />
        {options.map((o) => {
          const on = o === value;
          return (
            <button
              key={String(o)}
              type="button"
              role="radio"
              aria-checked={on}
              data-v={String(o)}
              onClick={() => onChange(o)}
              className={`relative z-10 shrink-0 whitespace-nowrap px-3.5 py-2 text-[0.8rem] font-medium transition-colors duration-500 ${on ? "text-stone" : "text-graphite/70 hover:text-graphite"}`}
            >
              {render ? render(o) : String(o)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ResidencesBrowser() {
  const [region, setRegion] = useState<"All" | Region>("All");
  const [beds, setBeds] = useState<"Any" | (typeof BEDS)[number]>("Any");
  const [view, setView] = useState<"Grid" | "Index">("Grid");
  const grid = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const follow = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Project | null>(null);

  const shown = useMemo(
    () =>
      PROJECTS.filter((p) => (region === "All" || p.region === region) && (beds === "Any" || p.bhk.includes(beds) || (beds === 5 && p.bhk.some((b) => b >= 5)))),
    [region, beds],
  );

  // what the map shows: residences that pass, plus offices when no bedroom filter is set
  const match = useMemo(
    () => [
      ...shown.map((p) => p.slug),
      ...(beds === "Any" ? COMMERCIAL.filter((p) => region === "All" || p.region === region).map((p) => p.slug) : []),
    ],
    [shown, beds, region],
  );

  // /residences?region=Thane (from the home page) pre-selects a region
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("region");
    const r = REGIONS.find((x) => x === q);
    if (!r) return;
    const id = requestAnimationFrame(() => setRegion(r));
    return () => cancelAnimationFrame(id);
  }, []);

  const capture = () => {
    if (grid.current) flipState.current = Flip.getState(grid.current.querySelectorAll("[data-card]"));
  };

  // animate the re-order after React has committed the new list
  useLayoutEffect(() => {
    const st = flipState.current;
    flipState.current = null;
    if (!st || !grid.current || prefersReducedMotion()) return;
    Flip.from(st, {
      duration: 0.9,
      ease: "expo.inOut",
      stagger: 0.03,
      absolute: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.05 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.96, duration: 0.4 }),
      onComplete: () => ScrollTrigger.refresh(),
    });
  }, [shown, view]);

  // index view: an image that trails the cursor
  useEffect(() => {
    const el = follow.current;
    if (!el || view !== "Index" || window.matchMedia("(pointer: coarse)").matches) return;
    gsap.set(el, { xPercent: -50, yPercent: -50 });
    const xTo = gsap.quickTo(el, "x", { duration: 0.7, ease: "expo.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.7, ease: "expo.out" });
    const move = (e: PointerEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [view]);

  useEffect(() => {
    if (!follow.current) return;
    gsap.to(follow.current, { opacity: hover ? 1 : 0, scale: hover ? 1 : 0.85, duration: 0.5, ease: "expo.out" });
  }, [hover]);

  return (
    <div>
      <MapFinderSection
        match={match}
        region={region}
        onRegion={(r) => {
          capture();
          setRegion(r);
        }}
        count={shown.length}
        total={PROJECTS.length}
      />

      {/* filters */}
      <div className="sticky top-0 z-30 -mx-6 border-y border-graphite/10 bg-stone/85 px-6 py-5 backdrop-blur-xl md:-mx-10 md:px-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 flex-col gap-5 md:flex-row md:gap-8">
            <Segmented
              label="Where"
              options={["All", ...REGIONS] as const}
              value={region}
              onChange={(v) => {
                capture();
                setRegion(v);
              }}
            />
            <Segmented
              label="Bedrooms"
              options={["Any", ...BEDS] as const}
              value={beds}
              render={(v) => (v === "Any" ? "Any" : v === 5 ? "5+" : String(v))}
              onChange={(v) => {
                capture();
                setBeds(v);
              }}
            />
          </div>
          <div className="flex items-end justify-between gap-6 lg:justify-end">
            <p className="kicker pb-3 text-mute" aria-live="polite">
              <span className="text-graphite">{String(shown.length).padStart(2, "0")}</span> / {String(PROJECTS.length).padStart(2, "0")} addresses
            </p>
            <Segmented
              label="View"
              options={["Grid", "Index"] as const}
              value={view}
              onChange={(v) => {
                setHover(null);
                setView(v);
              }}
            />
          </div>
        </div>
      </div>

      {shown.length === 0 && (
        <div className="flex flex-col items-start gap-4 py-28">
          <p className="title text-3xl">No residence matches that yet.</p>
          <button
            type="button"
            className="ulink text-sm font-medium"
            onClick={() => {
              capture();
              setRegion("All");
              setBeds("Any");
            }}
          >
            Clear filters
          </button>
        </div>
      )}

      {view === "Grid" ? (
        <div ref={grid} className="grid grid-cols-1 gap-x-6 gap-y-16 pt-14 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((p) => {
            const i = PROJECTS.indexOf(p);
            return (
              <TLink key={p.slug} href={`/residences/${p.slug}`} data-card data-flip-id={p.slug} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-2">
                  <Pic src={p.images.card} alt={`${p.name}, ${p.area}`} fill sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw" className="transition-transform duration-[1.6s] ease-[var(--ease-out-expo)] group-hover:scale-[1.06]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-graphite/45 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                  <span className="kicker absolute left-4 top-4 bg-stone/90 px-2.5 py-1.5 text-graphite backdrop-blur">{p.region}</span>
                  <span className="absolute bottom-4 right-4 flex size-12 translate-y-3 items-center justify-center bg-amber text-graphite opacity-0 transition-all duration-700 group-hover:translate-y-0 group-hover:opacity-100">
                    &rarr;
                  </span>
                </div>
                <div className="relative mt-5 flex items-start justify-between gap-4 border-t border-graphite/15 pt-5">
                  <span className="dusk-line absolute -top-px left-0 h-px w-full origin-left scale-x-0 transition-transform duration-1000 ease-[var(--ease-out-expo)] group-hover:scale-x-100" />
                  <div>
                    <p className="kicker text-mute">
                      {String(i + 1).padStart(2, "0")} &middot; {p.area}
                    </p>
                    <h3 className="title mt-2 text-[1.7rem]">{p.name}</h3>
                    <p className="mt-1.5 text-sm text-graphite-2">{p.tagline}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium">{bhkLabel(p)}</p>
                    <p className="kicker mt-1.5 text-mute">{p.priceFrom ? `From ${p.priceFrom}` : "Price on request"}</p>
                  </div>
                </div>
              </TLink>
            );
          })}
        </div>
      ) : (
        <div ref={grid} className="pt-8" onPointerLeave={() => setHover(null)}>
          {shown.map((p) => {
            const i = PROJECTS.indexOf(p);
            return (
              <TLink
                key={p.slug}
                href={`/residences/${p.slug}`}
                data-card
                data-flip-id={p.slug}
                onPointerEnter={() => setHover(p)}
                className="group relative grid grid-cols-[auto_1fr_auto] items-baseline gap-5 border-b border-graphite/15 py-7 md:grid-cols-[4rem_1fr_14rem_10rem] md:gap-8"
              >
                <span className="kicker text-mute">{String(i + 1).padStart(2, "0")}</span>
                <span className="display text-[9vw] transition-[color,transform] duration-700 ease-[var(--ease-out-expo)] group-hover:translate-x-3 group-hover:text-dusk md:text-[min(4.6vw,5.4rem)]">{p.short}</span>
                <span className="hidden text-sm text-graphite-2 md:block">
                  {p.area}
                  <br />
                  <span className="text-mute">{bhkLabel(p)}</span>
                </span>
                <span className="kicker text-right text-mute">{p.priceFrom ?? "On request"}</span>
              </TLink>
            );
          })}
          <div ref={follow} aria-hidden className="pointer-events-none fixed left-0 top-0 z-20 hidden aspect-[4/3] w-[26rem] opacity-0 md:block">
            {PROJECTS.map((p) => (
              <div key={p.slug} className={`absolute inset-0 overflow-hidden transition-opacity duration-500 ${hover?.slug === p.slug ? "opacity-100" : "opacity-0"}`}>
                <Pic src={p.images.card} alt="" fill sizes="26rem" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
