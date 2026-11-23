"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { GlobeBridge, GlobeCity } from "../../three/NriGlobe";

const NriGlobe = dynamic(() => import("../../three/NriGlobe"), { ssr: false });

type City = GlobeCity & { tz: string };

// Mumbai is the hub; the others are the cities on the NRI corner world clock.
const CITIES: City[] = [
  { name: "Mumbai", tz: "Asia/Kolkata", lat: 19.076, lon: 72.878 },
  { name: "Dubai", tz: "Asia/Dubai", lat: 25.205, lon: 55.271 },
  { name: "Singapore", tz: "Asia/Singapore", lat: 1.352, lon: 103.82 },
  { name: "London", tz: "Europe/London", lat: 51.507, lon: -0.128 },
  { name: "New York", tz: "America/New_York", lat: 40.713, lon: -74.006 },
  { name: "Sydney", tz: "Australia/Sydney", lat: -33.869, lon: 151.209 },
];

/** UTC offset in minutes for a time zone at a given instant. */
function offsetOf(tz: string, d: Date) {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(d).find((x) => x.type === "timeZoneName")?.value ?? "GMT";
  const m = p.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!m) return 0;
  return (m[1] === "-" ? -1 : 1) * (parseInt(m[2], 10) * 60 + (m[3] ? parseInt(m[3], 10) : 0));
}

function clock(tz: string, d: Date) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
}

function gapText(mins: number, other: string) {
  if (mins === 0) return { lead: "Mumbai keeps", value: "the same time", tail: `as ${other}` };
  const a = Math.abs(mins);
  const v = `${Math.floor(a / 60)}h${a % 60 ? ` ${a % 60}m` : ""}`;
  return { lead: "Mumbai is", value: v, tail: `${mins > 0 ? "ahead of" : "behind"} ${other}` };
}

/**
 * NRI corner set-piece: a dot-matrix globe with amber great-circle arcs from the cities NRI buyers
 * write from to Mumbai. Pick a city (or let it cycle) and the globe turns to show the route, with the
 * live time gap. The visitor's own gap to Mumbai sits on top.
 */
export function GlobeSection() {
  const bridge = useRef<GlobeBridge>({ selected: 1, dragX: 0, dragY: 0, dragging: false, labels: [] });
  const [sel, setSel] = useState(1);
  const [now, setNow] = useState<Date | null>(null);
  const touched = useRef(false);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);

  // gently cycle through the cities until the visitor picks one
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      if (touched.current) return;
      setSel((s) => {
        const n = s >= CITIES.length - 1 ? 1 : s + 1;
        bridge.current.selected = n;
        bridge.current.dragX = 0;
        bridge.current.dragY = 0;
        return n;
      });
    }, 5200);
    return () => clearInterval(id);
  }, []);

  const pick = (i: number) => {
    touched.current = true;
    bridge.current.selected = i;
    bridge.current.dragX = 0;
    bridge.current.dragY = 0;
    setSel(i);
  };

  const city = CITIES[sel];
  const mumbaiOff = now ? offsetOf("Asia/Kolkata", now) : 330;
  const cityOff = now ? offsetOf(city.tz, now) : 0;
  const g = gapText(mumbaiOff - cityOff, city.name);
  const youGap = now ? 330 + now.getTimezoneOffset() : 0;
  const youText = youGap === 0 ? "You are on Mumbai time" : `Mumbai is ${Math.floor(Math.abs(youGap) / 60)}h${Math.abs(youGap) % 60 ? ` ${Math.abs(youGap) % 60}m` : ""} ${youGap > 0 ? "ahead of" : "behind"} you`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone/15 pb-5">
        <p className="kicker text-stone/60">Your time, our time</p>
        <p className="kicker flex items-center gap-2">
          <span className="live-dot inline-block size-1.5 rounded-full bg-amber" />
          {now ? youText : " "}
        </p>
      </div>

      <div className="mt-10 grid items-center gap-10 md:mt-14 md:grid-cols-12 md:gap-8">
        <div className="order-2 md:order-1 md:col-span-5">
          <p className="kicker text-amber">Route &middot; {city.name} to Mumbai</p>
          <p className="title mt-4 text-3xl leading-[1.1] md:text-[3.2rem]" aria-live="polite">
            {g.lead} <span className="accent text-amber">{g.value}</span>
            <br />
            {g.tail}
          </p>

          <ul className="mt-10 border-b border-stone/15" role="listbox" aria-label="Choose a city">
            {CITIES.slice(1).map((c, k) => {
              const i = k + 1;
              const on = sel === i;
              const off = now ? offsetOf("Asia/Kolkata", now) - offsetOf(c.tz, now) : 0;
              const sign = off === 0 ? "±0" : `${off > 0 ? "+" : "−"}${Math.floor(Math.abs(off) / 60)}h${Math.abs(off) % 60 ? ` ${Math.abs(off) % 60}m` : ""}`;
              return (
                <li key={c.name}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => pick(i)}
                    onMouseEnter={() => pick(i)}
                    className="group grid w-full grid-cols-[1fr_auto_auto] items-baseline gap-4 border-t border-stone/15 py-4 text-left"
                  >
                    <span className={`title text-xl transition-[transform,color] duration-500 ease-[var(--ease-out-expo)] md:text-2xl ${on ? "translate-x-2 text-amber" : "text-stone/75 group-hover:text-stone"}`}>{c.name}</span>
                    <span className="font-mono text-xs tabular-nums text-stone/45">{sign}</span>
                    <span className="title w-16 text-right text-lg tabular-nums text-stone/85">{now ? clock(c.tz, now) : "--:--"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="kicker mt-5 flex items-center justify-between text-stone/45">
            <span>Mumbai &middot; home</span>
            <span className="title text-lg tabular-nums text-amber">{now ? clock("Asia/Kolkata", now) : "--:--"}</span>
          </p>
        </div>

        <div className="order-1 md:order-2 md:col-span-7">
          <div className="relative mx-auto aspect-square w-full max-w-[38rem]">
            <NriGlobe cities={CITIES} bridgeRef={bridge} />
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              {CITIES.map((c, i) => (
                <div
                  key={c.name}
                  ref={(el) => {
                    bridge.current.labels[i] = el;
                  }}
                  className="absolute left-0 top-0 whitespace-nowrap opacity-0 will-change-transform"
                >
                  <span
                    className={`kicker block border px-2 py-1 backdrop-blur-sm ${
                      i === 0 ? "border-amber/60 bg-amber/15 text-amber" : i === sel ? "border-stone/40 bg-night/70 text-stone" : "border-stone/15 bg-night/50 text-stone/55"
                    }`}
                  >
                    {c.name}
                  </span>
                </div>
              ))}
            </div>
            <p className="kicker absolute bottom-0 left-1/2 -translate-x-1/2 text-stone/35">Drag to spin</p>
          </div>
        </div>
      </div>
    </div>
  );
}
