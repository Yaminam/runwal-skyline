"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CONTACT, ENQUIRY_PROJECTS, RERA_NOTE, SOCIALS } from "@/lib/company";
import { prefersReducedMotion } from "@/lib/motion";
import { getLenis } from "../SmoothScroll";
import { RunwalMark } from "./BrandLogo";
import { NightSkyline } from "./NightSkyline";
import { TLink } from "./Transition";

const HOMES = ENQUIRY_PROJECTS.filter((p) => p.kind === "home");

// Floor order for the lift: G (lobby) = 0, residences 1..10, then the upper levels.
type Floor = { code: string; level: number };
const HOME_FLOORS: Array<Floor & { slug: string; name: string; area: string }> = HOMES.map((p, i) => ({
  code: String(HOMES.length - i).padStart(2, "0"),
  level: HOMES.length - i,
  slug: p.slug,
  name: p.name,
  area: p.area,
}));
const UPPER = [
  { code: "PH", level: 14, href: "/enquire", name: "Book a private site visit", note: "Penthouse" },
  { code: "13", level: 13, href: "/places", name: "Places", note: "Offices, malls & hotels" },
  { code: "12", level: 12, href: "/legacy", name: "Legacy", note: "Since 1978" },
  { code: "11", level: 11, href: "/residences", name: "All residences", note: "Find your address" },
];
const TOWERS = HOMES.map((p) => ({ slug: p.slug, name: p.name, area: p.area }));

const codeFor = (level: number) => (level === 0 ? "G" : level >= 14 ? "PH" : String(level).padStart(2, "0"));

/** Live Mumbai time for the legal strip. */
function useMumbaiTime() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });
    const set = () => setNow(fmt.format(new Date()));
    set();
    const id = setInterval(set, 20_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/**
 * "The Lobby": the footer is the ground floor of a Runwal tower. A lift display travels to whichever
 * floor you hover in the building directory, the call button rides you back up, and the night
 * skyline underneath lights up wherever you point.
 */
export function Footer() {
  const pathname = usePathname();
  const compact = pathname === "/enquire";
  const time = useMumbaiTime();

  const display = useRef<HTMLSpanElement>(null);
  const arrow = useRef<HTMLSpanElement>(null);
  const level = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [riding, setRiding] = useState(false);

  // step the lift one floor at a time towards the target, then "ding"
  const travel = (to: number, speed = 70) => {
    if (timer.current) clearInterval(timer.current);
    const reduced = prefersReducedMotion();
    const show = (l: number, dir: "up" | "down" | null) => {
      if (display.current) display.current.textContent = codeFor(l);
      if (arrow.current) arrow.current.dataset.dir = dir ?? "idle";
    };
    if (reduced || to === level.current) {
      level.current = to;
      show(to, null);
      return;
    }
    const dir = to > level.current ? "up" : "down";
    timer.current = setInterval(() => {
      level.current += dir === "up" ? 1 : -1;
      const arrived = level.current === to;
      show(level.current, arrived ? null : dir);
      if (arrived && timer.current) {
        clearInterval(timer.current);
        timer.current = null;
        display.current?.animate([{ textShadow: "0 0 24px rgba(242,166,90,1)" }, { textShadow: "0 0 10px rgba(242,166,90,.55)" }], { duration: 600 });
      }
    }, speed);
  };

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );

  const ride = () => {
    setRiding(true);
    travel(14, 120);
    const l = getLenis();
    if (l) l.scrollTo(0, { duration: 2.2, onComplete: () => setRiding(false) });
    else {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => setRiding(false), 1500);
    }
  };

  const row = "group grid grid-cols-[2.6rem_1fr_auto] items-baseline gap-3 border-t border-stone/10 py-3 transition-colors hover:bg-stone/[0.03]";
  const floorCls = "kicker tabular-nums text-stone/35 transition-colors duration-300 group-hover:text-amber";

  return (
    <footer data-tone="dark" className="relative overflow-hidden bg-night text-stone">
      <div className="blueprint-dark pointer-events-none absolute inset-0 opacity-40" aria-hidden />

      {!compact && (
        <div className="relative grid gap-12 px-6 pt-24 md:grid-cols-12 md:gap-10 md:px-10 md:pt-32">
          {/* lift panel */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-3">
              <RunwalMark className="h-9 w-auto text-amber" />
              <p className="kicker text-stone/50">The Lobby &middot; Runwal</p>
            </div>

            <div className="mt-10 border border-stone/15 bg-black/30 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex items-center justify-between">
                <p className="kicker text-stone/40">Now at floor</p>
                <span
                  ref={arrow}
                  data-dir="idle"
                  aria-hidden
                  className="text-sm text-amber opacity-20 transition-[opacity,transform] duration-200 data-[dir=down]:rotate-180 data-[dir=down]:opacity-100 data-[dir=up]:opacity-100"
                >
                  &#9650;
                </span>
              </div>
              <span
                ref={display}
                aria-live="off"
                className="mt-3 block font-mono text-[5.5rem] leading-none tracking-tight text-amber tabular-nums [text-shadow:0_0_10px_rgba(242,166,90,.55)] md:text-[6.5rem]"
              >
                G
              </span>
              <p className="mt-4 text-sm leading-relaxed text-stone/60">
                {CONTACT.address[0]},
                <br />
                {CONTACT.address[1]}, {CONTACT.address[2]}
              </p>
              <div className="mt-6 flex items-center gap-4 border-t border-stone/10 pt-5">
                <button
                  type="button"
                  onClick={ride}
                  aria-label="Back to top"
                  className={`group relative flex size-14 shrink-0 items-center justify-center rounded-full border transition-all duration-500 ${
                    riding ? "border-amber shadow-[0_0_0_6px_rgba(242,166,90,0.15),0_0_24px_rgba(242,166,90,0.45)]" : "border-stone/25 hover:border-amber"
                  }`}
                >
                  <span className={`text-lg transition-colors ${riding ? "text-amber" : "text-stone/80 group-hover:text-amber"}`}>&#9650;</span>
                </button>
                <div>
                  <p className="text-sm text-stone/85">{riding ? "Going up…" : "Call the lift"}</p>
                  <p className="kicker mt-1 text-stone/40">Back to the top</p>
                </div>
              </div>
            </div>

            <ul className="mt-6 flex flex-col gap-2 text-sm">
              <li className="flex justify-between gap-4">
                <span className="kicker text-stone/40">Sales</span>
                <a href={`tel:${CONTACT.sales.replace(/-/g, "")}`} className="ulink text-stone/85">
                  {CONTACT.sales}
                </a>
              </li>
              <li className="flex justify-between gap-4">
                <span className="kicker text-stone/40">Office</span>
                <a href={`tel:${CONTACT.phone.replace(/-/g, "")}`} className="ulink text-stone/85">
                  {CONTACT.phone}
                </a>
              </li>
              <li className="flex justify-between gap-4">
                <span className="kicker text-stone/40">Write</span>
                <a href={`mailto:${CONTACT.email}`} className="ulink text-stone/85">
                  {CONTACT.email}
                </a>
              </li>
            </ul>
          </div>

          {/* building directory */}
          <div className="md:col-span-8" onMouseLeave={() => travel(0)}>
            <div className="flex items-end justify-between border-b border-stone/20 pb-4">
              <h2 className="title text-3xl md:text-[2.6rem]">
                Building <span className="accent">directory</span>
              </h2>
              <p className="kicker hidden text-stone/40 sm:block">Hover a floor &middot; the lift will take you</p>
            </div>

            <div className="grid gap-x-10 md:grid-cols-2">
              <div>
                <p className="kicker pb-3 pt-6 text-stone/40">Upper levels</p>
                {UPPER.map((f) => (
                  <TLink key={f.code} href={f.href} className={row} onMouseEnter={() => travel(f.level)} onFocus={() => travel(f.level)}>
                    <span className={floorCls}>{f.code}</span>
                    <span className="text-[0.95rem] text-stone/85 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1.5 group-hover:text-stone">{f.name}</span>
                    <span className="kicker text-stone/35">{f.note}</span>
                  </TLink>
                ))}
                <p className="kicker pb-3 pt-8 text-stone/40">Rooftop</p>
                <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-stone/10 pt-4">
                  {SOCIALS.map((s) => (
                    <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="kicker ulink text-stone/70 hover:text-amber" onMouseEnter={() => travel(14)}>
                      {s.label} &#8599;
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <p className="kicker pb-3 pt-6 text-stone/40">Residences &middot; floors 01&ndash;{String(HOMES.length).padStart(2, "0")}</p>
                {HOME_FLOORS.map((f) => (
                  <TLink key={f.slug} href={`/residences/${f.slug}`} className={row} onMouseEnter={() => travel(f.level)} onFocus={() => travel(f.level)}>
                    <span className={floorCls}>{f.code}</span>
                    <span className="text-[0.95rem] text-stone/85 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1.5 group-hover:text-stone">{f.name.replace("Runwal ", "")}</span>
                    <span className="kicker text-stone/35">{f.area}</span>
                  </TLink>
                ))}
                <div className={`${row} border-b`}>
                  <span className="kicker text-amber">G</span>
                  <span className="text-[0.95rem] text-stone/85">Lobby &middot; Sion (East)</span>
                  <a href={CONTACT.maps} target="_blank" rel="noreferrer" className="kicker ulink text-stone/50 hover:text-amber">
                    Directions &#8599;
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* the city outside */}
      <div className="relative mt-16 md:mt-20">
        <NightSkyline towers={TOWERS} />
      </div>

      <div className="relative flex flex-col gap-5 border-t border-stone/10 bg-night px-6 py-8 md:px-10">
        <p className="max-w-4xl text-xs leading-relaxed text-stone/40">
          {RERA_NOTE} Runwal Realty is the brand name of Runwal Developers Limited. Runwal Realty and Runwal Enterprises Limited are separate companies.
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone/40">
          <p>&copy; 2026 Runwal Developers Limited</p>
          <p className="flex items-center gap-2">
            <span className="live-dot inline-block size-1.5 rounded-full bg-amber" />
            Lights on in Mumbai {time ? <span className="tabular-nums text-stone/70">{time} IST</span> : null}
          </p>
          <p>Concept demo by Garage Collective &middot; not the official website</p>
        </div>
      </div>
    </footer>
  );
}
