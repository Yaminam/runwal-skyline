"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { COMMERCIAL, HOSPITALITY, RETAIL } from "@/lib/company";
import { prefersReducedMotion } from "@/lib/motion";
import { getLenis } from "../SmoothScroll";
import { TLink } from "../site/Transition";
import { PHASES, district, focusAt, hourAt, light, pAt, smooth, type BuildingKey } from "./district-state";

const DistrictScene = dynamic(() => import("../three/DistrictScene"), { ssr: false });

const office = COMMERCIAL[0];
const rcity = RETAIL[0];

type Caption = {
  key: BuildingKey;
  time: string;
  kicker: string;
  title: React.ReactNode;
  body: string;
  facts?: string[];
  link?: { href: string; label: string; external?: boolean };
};

const CAPTIONS: Caption[] = [
  {
    key: "office",
    time: "07:00 – 11:30",
    kicker: "Morning · Offices",
    title: (
      <>
        The commute <span className="accent">arrives</span>
      </>
    ),
    body: `${office.name}, ${office.area}. ${office.line}`,
    facts: office.facts.slice(0, 3).map(([v, l]) => `${v} ${l}`),
    link: { href: `/residences/${office.slug}`, label: `Explore ${office.name}` },
  },
  {
    key: "plaza",
    time: "12:00 – 14:45",
    kicker: "Midday · The plaza",
    title: (
      <>
        Lunch, <span className="accent">outdoors</span>
      </>
    ),
    body: "Offices, shops and homes share one walkable block, so a lunch break is a short walk to the trees, not a drive across town.",
  },
  {
    key: "mall",
    time: "15:15 – 19:45",
    kicker: "Evening · Retail",
    title: (
      <>
        The city <span className="accent">comes out</span>
      </>
    ),
    body: `${rcity.name}, ${rcity.area}. ${rcity.line}`,
    facts: rcity.facts,
    link: rcity.url ? { href: rcity.url, label: "Visit rcity.in", external: true } : undefined,
  },
  {
    key: "hotel",
    time: "20:00 – 22:20",
    kicker: "Night · Hospitality",
    title: (
      <>
        Now, <span className="accent">hotels</span>
      </>
    ),
    body: HOSPITALITY.text,
    facts: HOSPITALITY.places.map((p) => p.name),
    link: { href: "#hosp-h", label: "See the hotel cities" },
  },
  {
    key: "home",
    time: "22:25 – 24:00",
    kicker: "Late · Home",
    title: (
      <>
        Lights on, <span className="accent">at home</span>
      </>
    ),
    body: "The last lights in the block are the homes. Runwal has completed 35 projects across Mumbai, Thane and Pune since 1978.",
    link: { href: "/residences", label: "Find a Runwal home" },
  },
];

const NAMES: Record<BuildingKey, string> = {
  office: "R Square · Offices",
  plaza: "The plaza",
  mall: "R City · Retail",
  hotel: "Runwal Hotel · Upcoming",
  home: "Runwal Residences",
};

const fmt = (h: number) => {
  const hh = Math.floor(h) % 24;
  const mm = Math.floor((h % 1) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};

// Sun dial geometry (SVG units): a half circle, 06:00 on the left horizon, 24:00 on the right.
const DIAL = { cx: 60, cy: 58, r: 48 };
const dialPoint = (p: number) => {
  const a = Math.PI - p * Math.PI;
  return { x: DIAL.cx + Math.cos(a) * DIAL.r, y: DIAL.cy - Math.sin(a) * DIAL.r };
};

/**
 * "A day in a Runwal district": a pinned section where the scroll is the clock. The model fills with
 * commuters, lunch crowds, shoppers and hotel guests as the hours pass, the camera cuts to whichever
 * Runwal place is busy, and the sun dial can be dragged to scrub the day directly.
 */
export function District() {
  const section = useRef<HTMLElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const sunIcon = useRef<SVGGElement>(null);
  const sunDisc = useRef<SVGCircleElement>(null);
  const moonDisc = useRef<SVGGElement>(null);
  const arcDone = useRef<SVGPathElement>(null);
  const dialSvg = useRef<SVGSVGElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const ink = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const labelText = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(false);
  const [still, setStill] = useState(false);
  const dragging = useRef(false);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const reduced = prefersReducedMotion();
    setStill(reduced);
    district.still = reduced;
    district.label = label.current;
    const caps = el.querySelectorAll<HTMLElement>("[data-cap]");
    const intro = el.querySelector<HTMLElement>("[data-intro]");
    const arcLen = arcDone.current?.getTotalLength() ?? 1;

    const render = (p: number) => {
      district.p = p;
      const h = hourAt(p);
      const f = focusAt(h);
      district.focus = f;
      if (labelText.current && f) labelText.current.textContent = NAMES[f];
      if (clockRef.current) clockRef.current.textContent = fmt(h);
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      // the sun (or, after 19:30, the moon) travels along the dial
      const pt = dialPoint(p);
      sunIcon.current?.setAttribute("transform", `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)})`);
      const moon = smooth(19, 20, h);
      sunDisc.current?.setAttribute("opacity", String(1 - moon));
      moonDisc.current?.setAttribute("opacity", String(moon));
      if (arcDone.current) arcDone.current.style.strokeDashoffset = String(arcLen * (1 - p));
      dialSvg.current?.setAttribute("aria-valuenow", String(Math.round(h * 10) / 10));
      dialSvg.current?.setAttribute("aria-valuetext", fmt(h));

      const { night, dusk } = light(h);
      const dark = night > 0.3 || dusk > 0.8;
      el.dataset.tone = dark ? "dark" : "light";
      if (ink.current) ink.current.dataset.ink = dark ? "light" : "dark";
      if (intro) {
        const o = 1 - smooth(0.02, 0.055, p);
        intro.style.opacity = String(o);
        intro.style.transform = `translateY(${(1 - o) * -24}px)`;
      }
      caps.forEach((n, i) => {
        const ph = PHASES[i];
        const a = smooth(pAt(ph.from), pAt(ph.from) + 0.012, p) * (1 - smooth(pAt(ph.to) - 0.012, pAt(ph.to), p));
        n.style.opacity = String(a);
        n.style.transform = `translateY(${(1 - a) * 22}px)`;
        n.style.visibility = a < 0.01 ? "hidden" : "visible";
        n.style.pointerEvents = a > 0.6 ? "auto" : "none";
      });
    };

    if (reduced) {
      render(pAt(19));
      district.rise = 1;
      const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting));
      io.observe(el);
      return () => io.disconnect();
    }

    render(0);
    district.rise = 0;
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.6,
      onUpdate: (self) => render(self.progress),
    });
    const riseSt = ScrollTrigger.create({
      trigger: el,
      start: "top 75%",
      once: true,
      onEnter: () => gsap.to(district, { rise: 1, duration: 2.6, ease: "power3.out" }),
    });
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "200px" });
    io.observe(el);
    return () => {
      st.kill();
      riseSt.kill();
      io.disconnect();
      district.label = null;
    };
  }, []);

  // Dial scrubbing: map the pointer angle to a time, then scroll the page to that point of the pin.
  const scrubTo = (p: number) => {
    const el = section.current;
    if (!el || still) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const y = top + Math.min(1, Math.max(0, p)) * (el.offsetHeight - window.innerHeight);
    const l = getLenis();
    if (l) l.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
  };
  const fromPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = dialSvg.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 120;
    const y = ((e.clientY - r.top) / r.height) * 70;
    const a = Math.atan2(DIAL.cy - y, x - DIAL.cx);
    const ang = Math.min(Math.PI, Math.max(0, a < -Math.PI / 2 ? Math.PI : a));
    scrubTo(1 - ang / Math.PI);
  };

  return (
    <>
      <section
        ref={section}
        data-tone="light"
        aria-label="A day in a Runwal district"
        className={`relative bg-stone ${still ? "h-svh" : "h-[560vh]"}`}
      >
        <div className="sticky top-0 h-svh w-full overflow-hidden bg-stone">
          <div className="absolute inset-0">
            <DistrictScene active={active} />
          </div>

          {/* building tag, placed every frame by the scene */}
          <div ref={label} className="pointer-events-none absolute left-0 top-0 opacity-0 transition-opacity duration-500" aria-hidden>
            <div className="flex flex-col items-center gap-1.5">
              <span ref={labelText} className="whitespace-nowrap border border-amber/60 bg-graphite/85 px-3 py-1.5 text-[11px] font-medium tracking-wide text-white backdrop-blur-md">
                R Square
              </span>
              <span className="h-8 w-px bg-gradient-to-b from-amber to-transparent" />
            </div>
          </div>

          <div
            ref={ink}
            data-ink="dark"
            className="group/ink pointer-events-none absolute inset-0 text-graphite transition-colors duration-700 data-[ink=light]:text-stone"
          >
            {/* soft scrim behind the copy column so text always reads over the scene */}
            <div
              aria-hidden
              className="absolute inset-y-0 left-0 w-full bg-[linear-gradient(to_right,rgba(238,235,229,0.55),rgba(238,235,229,0)_45%)] transition-opacity duration-700 group-data-[ink=light]/ink:opacity-0 md:w-2/3"
            />
            <div
              aria-hidden
              className="absolute inset-y-0 left-0 w-full bg-[linear-gradient(to_right,rgba(8,10,14,0.55),rgba(8,10,14,0)_45%)] opacity-0 transition-opacity duration-700 group-data-[ink=light]/ink:opacity-100 md:w-2/3"
            />

            {/* intro */}
            <div data-intro className="absolute bottom-16 left-6 right-6 max-w-xl md:bottom-auto md:left-10 md:right-auto md:top-28">
              <p className="kicker mb-4 flex items-center gap-3">
                <span className="live-dot inline-block size-1.5 rounded-full bg-amber" /> A day in a Runwal district
              </p>
              <h2 className="display text-[12vw] md:text-[min(5.6vw,6.6rem)]">
                One block,
                <br />
                <span className="accent normal-case">all</span> day
              </h2>
              <p className="mt-5 max-w-sm text-[0.95rem] leading-relaxed opacity-80">
                Offices, a mall, a hotel and homes on one street. Scroll, or drag the sun, to run the clock from first light to midnight.
              </p>
              <p className="kicker mt-5 opacity-55">Illustrative model &middot; not to scale</p>
            </div>

            {/* clock + draggable sun dial */}
            <div className="pointer-events-auto absolute right-5 top-20 flex items-end gap-3 md:right-10 md:top-28 md:gap-4">
              <div className="flex flex-col items-center">
                <svg
                  ref={dialSvg}
                  viewBox="0 0 120 70"
                  role="slider"
                  tabIndex={0}
                  aria-label="Time of day"
                  aria-valuemin={6}
                  aria-valuemax={24}
                  className="h-14 w-24 cursor-grab touch-none select-none outline-none active:cursor-grabbing md:h-[4.5rem] md:w-[7.5rem]"
                  onPointerDown={(e) => {
                    dragging.current = true;
                    e.currentTarget.setPointerCapture(e.pointerId);
                    fromPointer(e);
                  }}
                  onPointerMove={(e) => {
                    if (dragging.current) fromPointer(e);
                  }}
                  onPointerUp={() => {
                    dragging.current = false;
                  }}
                  onPointerCancel={() => {
                    dragging.current = false;
                  }}
                  onKeyDown={(e) => {
                    const step = e.shiftKey ? 2 : 0.5;
                    const h = hourAt(district.p);
                    if (e.key === "ArrowRight" || e.key === "ArrowUp") scrubTo(pAt(Math.min(24, h + step)));
                    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") scrubTo(pAt(Math.max(6, h - step)));
                    else return;
                    e.preventDefault();
                  }}
                >
                  <path d="M12 58 A48 48 0 0 1 108 58" fill="none" stroke="currentColor" strokeOpacity="0.22" strokeDasharray="2 3" />
                  <path ref={arcDone} d="M12 58 A48 48 0 0 1 108 58" fill="none" stroke="#f2a65a" strokeWidth="1.4" strokeDasharray="151 151" strokeDashoffset="151" />
                  <line x1="2" y1="58" x2="118" y2="58" stroke="currentColor" strokeOpacity="0.25" />
                  {[0, 0.5, 1].map((t) => {
                    const q = dialPoint(t);
                    return <circle key={t} cx={q.x} cy={q.y} r="1.3" fill="currentColor" opacity="0.45" />;
                  })}
                  <g ref={sunIcon} transform="translate(12 58)">
                    <circle r="11" fill="#f2a65a" opacity="0.18" />
                    <circle ref={sunDisc} r="6" fill="#f2a65a" />
                    <g ref={moonDisc} opacity="0">
                      <circle r="6" fill="#f4efe2" />
                      <circle r="5.4" cx="2.6" cy="-1.8" fill="#10141c" />
                    </g>
                  </g>
                </svg>
                <span className="kicker mt-1 text-[0.58rem] opacity-55">Drag the sun</span>
              </div>
              <div className="text-right">
                <span className="kicker block opacity-60">Local time</span>
                <span ref={clockRef} className="title block text-4xl tabular-nums group-data-[ink=light]/ink:[text-shadow:0_1px_14px_rgba(0,0,0,0.45)] md:text-5xl">
                  06:00
                </span>
              </div>
            </div>

            {/* captions: light paper by day, dark glass after dark */}
            {CAPTIONS.map((c) => (
              <div
                key={c.key}
                data-cap
                className="invisible absolute inset-x-4 bottom-14 opacity-0 md:inset-x-auto md:bottom-24 md:left-10 md:w-[27rem]"
              >
                <div className="border border-graphite/15 bg-stone/85 p-5 text-graphite shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-colors duration-700 group-data-[ink=light]/ink:border-white/15 group-data-[ink=light]/ink:bg-graphite/70 group-data-[ink=light]/ink:text-stone md:p-7">
                  <div className="flex items-center justify-between">
                    <p className="kicker text-amber-deep group-data-[ink=light]/ink:text-amber">{c.kicker}</p>
                    <p className="kicker tabular-nums text-mute group-data-[ink=light]/ink:text-stone/55">{c.time}</p>
                  </div>
                  <h3 className="title mt-3 text-2xl md:mt-4 md:text-[2.3rem]">{c.title}</h3>
                  <p className="mt-2 line-clamp-3 text-[0.82rem] leading-relaxed text-graphite-2 group-data-[ink=light]/ink:text-stone/75 md:mt-3 md:line-clamp-none md:text-sm">
                    {c.body}
                  </p>
                  {c.facts && (
                    <ul className="mt-4 hidden flex-wrap gap-2 md:flex">
                      {c.facts.map((f) => (
                        <li
                          key={f}
                          className="kicker border border-graphite/15 px-2 py-1 text-[0.62rem] text-graphite-2 group-data-[ink=light]/ink:border-white/15 group-data-[ink=light]/ink:text-stone/75"
                        >
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  {c.link &&
                    (c.link.external ? (
                      <a href={c.link.href} target="_blank" rel="noreferrer" className="ulink mt-5 inline-block text-sm font-medium">
                        {c.link.label} &#8599;
                      </a>
                    ) : c.link.href.startsWith("#") ? (
                      <a href={c.link.href} className="ulink mt-5 inline-block text-sm font-medium">
                        {c.link.label} &rarr;
                      </a>
                    ) : (
                      <TLink href={c.link.href} className="ulink mt-5 inline-block text-sm font-medium">
                        {c.link.label} &rarr;
                      </TLink>
                    ))}
                </div>
              </div>
            ))}

            {/* timeline */}
            <div className="absolute inset-x-6 bottom-6 md:inset-x-10 md:bottom-8">
              <div className="relative h-px w-full bg-current/20">
                <div ref={bar} className="dusk-line absolute inset-0 origin-left scale-x-0" />
                {PHASES.map((ph, i) => (
                  <span
                    key={ph.key}
                    className="kicker absolute top-3 hidden -translate-x-1/2 whitespace-nowrap opacity-60 md:block"
                    style={{ left: `${pAt((ph.from + Math.min(ph.to, 24)) / 2) * 100}%` }}
                  >
                    {CAPTIONS[i].kicker.split(" · ")[1]}
                  </span>
                ))}
                <span className="kicker absolute -top-6 left-0 opacity-50">06:00</span>
                <span className="kicker absolute -top-6 right-0 opacity-50">24:00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {still && (
        <section className="bg-stone px-6 pb-20 md:px-10">
          <ol className="grid gap-6 md:grid-cols-5">
            {CAPTIONS.map((c) => (
              <li key={c.key} className="border-t border-graphite/15 pt-4">
                <p className="kicker text-amber-deep">{c.time}</p>
                <p className="title mt-2 text-xl">{c.title}</p>
                <p className="mt-2 text-sm text-graphite-2">{c.body}</p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  );
}
