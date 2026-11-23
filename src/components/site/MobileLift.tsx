"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { CONTACT, ENQUIRY_PROJECTS, SOCIALS } from "@/lib/company";
import { prefersReducedMotion } from "@/lib/motion";
import { SECTIONS, type NavLink } from "@/lib/site-sections";
import { TLink } from "./Transition";

const HOMES = ENQUIRY_PROJECTS.filter((p) => p.kind === "home");

type Floor = { code: string; title: string; links: NavLink[] };

// Lift buttons, top floor first: the panel reads like a real lift.
const FLOORS: Floor[] = [
  { code: "6", ...SECTIONS[4] },
  { code: "5", ...SECTIONS[3] },
  { code: "4", ...SECTIONS[2] },
  {
    code: "3",
    title: "Residences",
    links: HOMES.map((p) => ({ href: `/residences/${p.slug}`, label: p.name.replace("Runwal ", "").replace("The Central Park", "Central Park") })),
  },
  { code: "2", ...SECTIONS[1] },
  { code: "1", ...SECTIONS[0] },
];

/**
 * Mobile footer: a lift control panel. Each section is a round floor button; pressing one lights
 * it, the floor display travels there, and the doors open on that floor's links.
 */
export function MobileLift({ onTop }: { onTop: () => void }) {
  const [floor, setFloor] = useState<number | null>(null);
  const display = useRef<HTMLSpanElement>(null);
  const arrow = useRef<HTMLSpanElement>(null);
  const doors = useRef<HTMLDivElement>(null);
  const shown = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );

  const press = (i: number) => {
    const target = Number(FLOORS[i].code);
    if (floor === i) {
      setFloor(null);
      return;
    }
    setFloor(i);
    if (timer.current) clearInterval(timer.current);
    const reduced = prefersReducedMotion();
    const show = (n: number, dir: string) => {
      if (display.current) display.current.textContent = n === 0 ? "G" : String(n);
      if (arrow.current) arrow.current.dataset.dir = dir;
    };
    if (reduced) {
      shown.current = target;
      show(target, "idle");
    } else {
      const dir = target > shown.current ? "up" : "down";
      timer.current = setInterval(() => {
        if (shown.current === target) {
          if (timer.current) clearInterval(timer.current);
          show(target, "idle");
          return;
        }
        shown.current += dir === "up" ? 1 : -1;
        show(shown.current, dir);
      }, 110);
    }
    requestAnimationFrame(() => {
      if (!doors.current || reduced) return;
      gsap.fromTo(doors.current.querySelectorAll(".ml-door"), { scaleX: 1 }, { scaleX: 0, duration: 0.7, ease: "expo.inOut", delay: 0.15 });
      gsap.fromTo(doors.current.querySelectorAll(".ml-link"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, ease: "expo.out", stagger: 0.04, delay: 0.45 });
    });
  };

  const open = floor === null ? null : FLOORS[floor];

  return (
    <div className="relative px-6 pb-10 pt-4">
      {/* the panel */}
      <div className="border border-stone/15 bg-[linear-gradient(180deg,#1c2027,#121519)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div className="flex items-center justify-between border-b border-stone/10 pb-4">
          <div>
            <p className="kicker text-stone/40">Now at floor</p>
            <p className="kicker mt-1 text-stone/60">{open ? open.title : "Lobby · Sion (East)"}</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              ref={arrow}
              data-dir="idle"
              aria-hidden
              className="text-sm text-amber opacity-25 transition-[opacity,transform] duration-200 data-[dir=down]:rotate-180 data-[dir=down]:opacity-100 data-[dir=up]:opacity-100"
            >
              &#9650;
            </span>
            <span ref={display} className="w-14 text-right font-mono text-5xl leading-none text-amber tabular-nums [text-shadow:0_0_10px_rgba(242,166,90,.55)]">
              G
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4">
          {FLOORS.map((f, i) => {
            const on = floor === i;
            return (
              <button
                key={f.code}
                type="button"
                onClick={() => press(i)}
                aria-expanded={on}
                className="flex items-center gap-3 text-left"
              >
                <span
                  className={`flex size-14 shrink-0 items-center justify-center rounded-full border-2 font-mono text-lg transition-all duration-300 ${
                    on
                      ? "border-amber bg-amber/15 text-amber shadow-[0_0_0_4px_rgba(242,166,90,0.12),0_0_22px_rgba(242,166,90,0.5)]"
                      : "border-stone/25 bg-black/30 text-stone/80 active:scale-95"
                  }`}
                >
                  {f.code}
                </span>
                <span className={`text-[0.95rem] leading-tight transition-colors ${on ? "text-stone" : "text-stone/70"}`}>{f.title}</span>
              </button>
            );
          })}
        </div>

        {/* the floor behind the doors */}
        {open && (
          <div ref={doors} className="relative mt-5 overflow-hidden border border-amber/30 bg-black/30">
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 p-4">
              {open.links.map((l) => (
                <li key={`${l.href}-${l.label}`} className="ml-link">
                  <TLink href={l.href} className="block py-2 text-[0.95rem] text-stone/90 active:text-amber">
                    {l.label}
                  </TLink>
                </li>
              ))}
            </ul>
            <span aria-hidden className="ml-door absolute inset-y-0 left-0 w-1/2 origin-left border-r border-stone/20 bg-[#20252d]" />
            <span aria-hidden className="ml-door absolute inset-y-0 right-0 w-1/2 origin-right border-l border-stone/20 bg-[#20252d]" />
          </div>
        )}
      </div>

      {/* thumb row */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        <a href={`tel:${CONTACT.sales.replace(/-/g, "")}`} className="flex flex-col items-center gap-1 border border-stone/15 py-4">
          <span className="text-lg">&#9742;</span>
          <span className="kicker text-stone/60">Call</span>
        </a>
        <a href={`mailto:${CONTACT.email}`} className="flex flex-col items-center gap-1 border border-stone/15 py-4">
          <span className="text-lg">&#9993;</span>
          <span className="kicker text-stone/60">Write</span>
        </a>
        <a href={CONTACT.maps} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 border border-stone/15 py-4">
          <span className="text-lg">&#8599;</span>
          <span className="kicker text-stone/60">Visit HQ</span>
        </a>
      </div>
      <button type="button" onClick={onTop} className="mt-2 flex w-full items-center justify-center gap-3 border border-stone/15 py-4">
        <span className="text-amber">&#9650;</span>
        <span className="kicker text-stone/70">Take the lift up</span>
      </button>
      <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2">
        {SOCIALS.map((so) => (
          <a key={so.label} href={so.href} target="_blank" rel="noreferrer" className="kicker py-1 text-stone/60">
            {so.label} &#8599;
          </a>
        ))}
      </div>
    </div>
  );
}
