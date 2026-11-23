"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion, useReducedMotion } from "@/lib/motion";
import { getLenis } from "../SmoothScroll";
import { Pic } from "../site/Pic";
import { MILESTONES, START_YEAR } from "./legacy-state";

/*
  "The Architect's Tape": a draggable scale ruler graduated in years. Drag it (with momentum),
  use the arrow keys or the buttons; it springs to the nearest milestone. A mechanical odometer reads
  the year, and a deck of photographs "develops" each milestone in the look of its era:
  sepia prints for the early years, film prints for the 2000s, glass for today.
*/

const END_YEAR = 2025;
const YEARS = END_YEAR - START_YEAR; // 47 spans, 48 graduations
const STARTS = MILESTONES.map((m) => parseInt(m.year.slice(0, 4), 10));

type Era = "sepia" | "film" | "glass";
const eraOf = (y: number): Era => (y < 2000 ? "sepia" : y < 2012 ? "film" : "glass");

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

const ERA_FILTER: Record<Era, string> = {
  sepia: "sepia(0.85) saturate(0.75) contrast(1.06) brightness(1.03)",
  film: "contrast(1.1) saturate(1.18) sepia(0.14) brightness(0.98)",
  glass: "none",
};

/** Snap target after a drag: prefer the next milestone in the direction of travel unless the one behind is much closer. */
const snapTarget = (v: number, dir: number) => {
  const ahead = dir > 0 ? STARTS.findIndex((y) => y >= v) : STARTS.map((y, i) => (y <= v ? i : -1)).filter((i) => i >= 0).pop() ?? -1;
  const behind = nearest(v);
  if (dir === 0 || ahead < 0) return behind;
  const dA = Math.abs(STARTS[ahead] - v);
  const dB = Math.abs(STARTS[behind] - v);
  return dA < dB * 2.2 || ahead === behind ? ahead : behind;
};

function nearest(v: number) {
  let best = 0;
  STARTS.forEach((y, i) => {
    if (Math.abs(y - v) < Math.abs(STARTS[best] - v)) best = i;
  });
  return best;
}

/* ---------------------------------------------------------------- odometer */

function Odometer({ label, reduced }: { label: string; reduced: boolean }) {
  const range = label.length > 4;
  return (
    <div
      aria-live="polite"
      aria-label={`Year ${label}`}
      className={`display flex items-end whitespace-nowrap tabular-nums leading-none transition-[font-size] duration-500 ${
        range ? "text-[10.5vw] md:text-[min(5.6vw,10.5vh)]" : "text-[14.5vw] md:text-[min(7.8vw,14.5vh)]"
      }`}
    >
      {label.split("").map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={i} aria-hidden className="relative block h-[1em] overflow-hidden">
            <span
              className="block"
              style={{
                transform: `translateY(-${Number(ch) * 10}%)`,
                transition: reduced ? "none" : `transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${i * 70}ms`,
              }}
            >
              {Array.from({ length: 10 }, (_, d) => (
                <span key={d} className="block h-[1em] leading-[1em]">
                  {d}
                </span>
              ))}
            </span>
          </span>
        ) : (
          <span key={i} aria-hidden className="block h-[1em] leading-[1em] text-amber-deep">
            {ch}
          </span>
        ),
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- deck card */

function Card({ m, offset, reduced }: { m: (typeof MILESTONES)[number]; offset: number; reduced: boolean }) {
  const y = STARTS[m.idx];
  const era = eraOf(y);
  const front = offset === 0;
  const past = offset < 0;
  const depth = Math.abs(offset);
  const tilt = era === "sepia" ? (m.idx % 2 ? 2.2 : -2.6) : era === "film" ? (m.idx % 2 ? -1.2 : 1) : 0;

  const transform = reduced
    ? "none"
    : front
      ? `translate3d(0,0,0) rotateZ(${tilt}deg)`
      : past
        ? `translate3d(${-18 - depth * 4}%, ${depth * 3}%, ${-140 - depth * 40}px) rotateY(58deg) rotateZ(${tilt}deg)`
        : `translate3d(${depth * 5}%, ${-depth * 4.5}%, ${-depth * 70}px) rotateZ(${tilt + depth * 1.5}deg)`;
  const opacity = front ? 1 : reduced ? 0 : past ? Math.max(0, 0.5 - depth * 0.25) : Math.max(0, 1 - depth * 0.28);

  return (
    <figure
      data-front={front ? "1" : "0"}
      className="tm-card absolute inset-0 m-0 will-change-transform"
      style={{
        transform,
        opacity,
        zIndex: 50 - depth * 2 - (past ? 1 : 0),
        transition: reduced ? "opacity 0.6s ease" : "transform 1.1s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease",
        pointerEvents: front ? "auto" : "none",
      }}
      aria-hidden={!front}
    >
      <div
        className={`relative h-full w-full ${
          era === "sepia"
            ? "bg-[#f6f1e6] p-[4.5%] pb-[14%] shadow-[0_24px_50px_-22px_rgba(40,30,20,0.55)]"
            : era === "film"
              ? "rounded-[3px] bg-[#fbfaf7] p-[2.6%] shadow-[0_24px_50px_-20px_rgba(0,0,0,0.5)]"
              : "border border-white/60 bg-white/10 p-0 shadow-[0_40px_80px_-30px_rgba(22,24,27,0.6)] [-webkit-box-reflect:below_10px_linear-gradient(transparent_72%,rgba(255,255,255,0.16))]"
        }`}
      >
        <div className="tm-photo relative h-full w-full overflow-hidden bg-stone-2">
          {m.image && (
            <div className="tm-img absolute inset-0" style={{ filter: ERA_FILTER[era] }}>
              {/* oversized so the photo can pan inside its border, opposite to the frame */}
              <div className="tm-pan absolute inset-[-6%] will-change-transform">
                <Pic src={m.image} alt={front ? `${m.year}: ${m.title}` : ""} fill sizes="(min-width: 768px) 44vw, 88vw" />
              </div>
            </div>
          )}
          {era !== "glass" && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ backgroundImage: GRAIN, opacity: era === "sepia" ? 0.5 : 0.32, mixBlendMode: era === "sepia" ? "multiply" : "overlay" }}
            />
          )}
          {era === "film" && (
            <>
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.42))]" />
              <span className="absolute bottom-[5%] right-[5%] font-mono text-[clamp(0.7rem,1.3vw,1rem)] font-bold tracking-[0.12em] text-[#ff8a2a] [text-shadow:0_0_6px_rgba(255,120,30,0.85)]">
                {y}
              </span>
            </>
          )}
          {era === "sepia" && <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(80,50,20,0.25))]" />}
          {/* soft light that follows the cursor across the print / glass */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 mix-blend-soft-light"
            style={{ background: "radial-gradient(circle at var(--mx, 50%) var(--my, 35%), rgba(255,255,255,0.7), rgba(255,255,255,0) 48%)" }}
          />
          {era === "glass" && (
            <>
              <div aria-hidden className="pointer-events-none absolute inset-[6px] border border-white/35" />
              <div aria-hidden className="tm-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_38%,rgba(255,255,255,0.28)_50%,transparent_62%)] bg-[length:250%_100%] bg-[position:120%_0]" />
            </>
          )}
        </div>
        {era === "sepia" && (
          <figcaption className="accent absolute inset-x-[6%] bottom-[3%] truncate whitespace-nowrap text-[clamp(0.85rem,1.6vw,1.25rem)] text-[#5b4a36]">
            {m.year} &middot; {m.title}
          </figcaption>
        )}
      </div>
    </figure>
  );
}

/* ---------------------------------------------------------------- section */

const N = MILESTONES.length;

/** Tape value (years) for a scroll progress through the pin: every milestone gets an equal share of scroll. */
const valueAt = (p: number) => {
  const f = Math.max(0, Math.min(1, p)) * (N - 1);
  const i = Math.min(N - 2, Math.floor(f));
  const t = f - i;
  return STARTS[i] + (STARTS[i + 1] - STARTS[i]) * t;
};

export function TimeMachine() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [label, setLabel] = useState(MILESTONES[0].year);
  const activeRef = useRef(0);
  const labelRef = useRef(MILESTONES[0].year);
  const tapeWrap = useRef<HTMLDivElement>(null);
  const tape = useRef<HTMLDivElement>(null);
  const deck = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLElement>(null);
  const swing = useRef<HTMLDivElement>(null);
  const ghost = useRef<HTMLDivElement>(null);
  const copyCol = useRef<HTMLDivElement>(null);
  const chip = useRef<HTMLDivElement>(null);
  const prevActive = useRef(0);
  const state = useRef({ v: START_YEAR, px: 64, dragging: false, lastX: 0, lastT: 0, vel: 0, raf: 0, v0: START_YEAR, samples: [] as Array<[number, number]>, syncing: false });
  const tween = useRef<gsap.core.Tween | null>(null);
  const targetRef = useRef(0);
  const trigger = useRef<ScrollTrigger | null>(null);
  const skew = useRef<{ to: ((v: number) => void) | null; last: number; timer: ReturnType<typeof setTimeout> | null }>({ to: null, last: START_YEAR, timer: null });

  // write the tape position and derived readouts (React only re-renders when the card or year text changes)
  const paint = useCallback(() => {
    const s = state.current;
    const wrap = tapeWrap.current;
    if (tape.current && wrap) {
      const x = wrap.clientWidth / 2 - (s.v - START_YEAR) * s.px;
      tape.current.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    }
    wrap?.setAttribute("aria-valuenow", String(Math.round(s.v)));
    const sk = skew.current;
    if (sk.to) {
      const dv = s.v - sk.last;
      sk.to(Math.max(-16, Math.min(16, -dv * 30)));
      if (sk.timer) clearTimeout(sk.timer);
      sk.timer = setTimeout(() => sk.to?.(0), 70);
    }
    sk.last = s.v;
    const k = nearest(s.v);
    const near = Math.abs(STARTS[k] - s.v) < 0.55;
    if (near && k !== activeRef.current) {
      activeRef.current = k;
      setActive(k);
    }
    const nextLabel = near && Math.abs(STARTS[k] - s.v) < 0.25 ? MILESTONES[k].year : String(Math.min(END_YEAR, Math.max(START_YEAR, Math.round(s.v))));
    if (nextLabel !== labelRef.current) {
      labelRef.current = nextLabel;
      setLabel(nextLabel);
    }
  }, []);

  /** Scroll position (px) at which milestone k sits in the pin. */
  const posFor = (k: number) => {
    const st = trigger.current;
    if (!st) return null;
    return st.start + ((st.end - st.start) * k) / (N - 1);
  };

  // move to a milestone: the tape glides there and the page scrolls with it, so they never disagree
  const goTo = useCallback(
    (k: number) => {
      const s = state.current;
      const idx = Math.max(0, Math.min(N - 1, k));
      targetRef.current = idx;
      tween.current?.kill();
      cancelAnimationFrame(s.raf);
      const lenis = getLenis();
      const y = posFor(idx);
      const done = () => {
        s.syncing = false;
      };
      if (prefersReducedMotion()) {
        s.v = STARTS[idx];
        paint();
        if (y !== null) window.scrollTo(0, y);
        return;
      }
      s.syncing = true;
      tween.current = gsap.to(s, { v: STARTS[idx], duration: 1.1, ease: "power3.inOut", onUpdate: paint });
      if (y !== null && lenis) {
        lenis.scrollTo(y, { duration: 1.1, onComplete: done });
        setTimeout(done, 1400); // in case the user interrupts the scroll
      }
      else if (y !== null) {
        window.scrollTo({ top: y, behavior: "smooth" });
        setTimeout(done, 1100);
      } else done();
    },
    [paint],
  );

  // tape scale per viewport
  useEffect(() => {
    const onResize = () => {
      const px = window.innerWidth < 768 ? 44 : 66;
      state.current.px = px;
      tapeWrap.current?.style.setProperty("--tm-px", `${px}px`);
      if (tape.current) tape.current.style.width = `${(YEARS + 1) * px}px`;
      paint();
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [paint]);

  // the pin: page scroll drives the tape; when scrolling stops, settle on the nearest milestone
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const s = state.current;
    let idle: ReturnType<typeof setTimeout> | null = null;
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        if (!s.dragging && !s.syncing) {
          s.v = valueAt(self.progress);
          paint();
        }
        if (idle) clearTimeout(idle);
        idle = setTimeout(() => {
          const p = self.progress;
          if (s.dragging || s.syncing || p <= 0.001 || p >= 0.999) return;
          const f = p * (N - 1);
          const k = Math.round(f);
          if (Math.abs(f - k) > 0.015) goTo(k);
        }, 160);
      },
    });
    trigger.current = st;
    return () => {
      if (idle) clearTimeout(idle);
      st.kill();
      trigger.current = null;
    };
  }, [paint, goTo]);

  // drag with momentum; on release the page scrolls to the chosen milestone
  useEffect(() => {
    const el = tapeWrap.current;
    if (!el) return;
    const s = state.current;
    const clampV = (v: number) => {
      if (v < START_YEAR) return START_YEAR - (START_YEAR - v) * 0.35;
      if (v > END_YEAR) return END_YEAR + (v - END_YEAR) * 0.35;
      return v;
    };
    const release = () => {
      const glide = () => {
        s.vel *= 0.9;
        s.v = clampV(s.v + s.vel);
        paint();
        if (Math.abs(s.vel) > 0.004 && s.v > START_YEAR - 1 && s.v < END_YEAR + 1) s.raf = requestAnimationFrame(glide);
        else {
          s.dragging = false;
          goTo(snapTarget(s.v, Math.sign(s.v - s.v0)));
        }
      };
      if (prefersReducedMotion()) {
        s.dragging = false;
        goTo(snapTarget(s.v, Math.sign(s.v - s.v0)));
      } else s.raf = requestAnimationFrame(glide);
    };
    const down = (e: PointerEvent) => {
      tween.current?.kill();
      cancelAnimationFrame(s.raf);
      s.dragging = true;
      s.syncing = false;
      s.lastX = e.clientX;
      s.lastT = performance.now();
      s.vel = 0;
      s.v0 = s.v;
      s.samples = [[s.lastT, s.v]];
      el.setPointerCapture(e.pointerId);
      el.dataset.drag = "1";
    };
    const move = (e: PointerEvent) => {
      if (el.dataset.drag !== "1") return;
      const dx = e.clientX - s.lastX;
      const now = performance.now();
      s.v = clampV(s.v - dx / s.px);
      s.samples.push([now, s.v]);
      if (s.samples.length > 12) s.samples.shift();
      s.lastX = e.clientX;
      s.lastT = now;
      paint();
    };
    const up = (e: PointerEvent) => {
      if (el.dataset.drag !== "1") return;
      el.dataset.drag = "0";
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      // release velocity (years per ~16ms frame) from the last ~120ms of movement
      const now = performance.now();
      const recent = s.samples.filter(([t]) => now - t < 120);
      if (recent.length >= 2) {
        const [t0, v0] = recent[0];
        const [t1, v1] = recent[recent.length - 1];
        s.vel = Math.max(-1.2, Math.min(1.2, ((v1 - v0) / Math.max(16, t1 - t0)) * 16));
      } else s.vel = 0;
      release();
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      cancelAnimationFrame(s.raf);
      tween.current?.kill();
    };
  }, [paint, goTo]);

  // "develop" the new front photograph in its era's style
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const front = deck.current?.querySelector<HTMLElement>('.tm-card[data-front="1"]');
    if (!front) return;
    const era = eraOf(STARTS[active]);
    const img = front.querySelector(".tm-img");
    const sheen = front.querySelector(".tm-sheen");
    const tl = gsap.timeline();
    if (img) {
      if (era === "glass") tl.fromTo(img, { filter: "blur(10px) brightness(1.3)", scale: 1.08 }, { filter: "blur(0px) brightness(1)", scale: 1, duration: 1.1, ease: "expo.out" }, 0);
      else
        tl.fromTo(
          img,
          { filter: `${ERA_FILTER[era]} brightness(2.2) contrast(0.4) blur(3px)` },
          { filter: `${ERA_FILTER[era]} brightness(1) contrast(1) blur(0px)`, duration: 1.6, ease: "power2.out" },
          0,
        );
    }
    if (sheen) tl.fromTo(sheen, { backgroundPosition: "120% 0" }, { backgroundPosition: "-60% 0", duration: 1.4, ease: "power2.inOut" }, 0.2);
    return () => {
      tl.kill();
    };
  }, [active]);

  // momentum skew driver (CSS vars on the tape)
  useEffect(() => {
    const el = tapeWrap.current;
    if (!el || prefersReducedMotion()) return;
    const o = { v: 0 };
    const sk = skew.current;
    sk.to = gsap.quickTo(o, "v", {
      duration: 0.35,
      ease: "power3.out",
      onUpdate: () => {
        el.style.setProperty("--tm-skew", o.v.toFixed(2));
        el.style.setProperty("--tm-blur", (Math.abs(o.v) * 0.07).toFixed(2));
      },
    });
    return () => {
      sk.to = null;
      if (sk.timer) clearTimeout(sk.timer);
    };
  }, []);

  // depth layers: gentle drift through the pin, cursor parallax on fine pointers
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const st = { trigger: el, start: "top top", end: "bottom bottom", scrub: true };
      gsap.fromTo(ghost.current, { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: st });
      gsap.fromTo(swing.current, { y: 14 }, { y: -14, ease: "none", scrollTrigger: st });
      gsap.fromTo(copyCol.current, { y: 26 }, { y: -26, ease: "none", scrollTrigger: st });
    }, el);

    if (!window.matchMedia("(pointer: fine)").matches) return () => ctx.revert();
    const q = (t: Element | null, prop: string, d = 0.9) => (t ? gsap.quickTo(t, prop, { duration: d, ease: "power3.out" }) : () => {});
    const gx = q(ghost.current, "x", 1.4);
    const ry = q(deck.current, "rotationY", 1);
    const rx = q(deck.current, "rotationX", 1);
    const cx = q(copyCol.current, "x", 0.8);
    const hx = q(chip.current, "x", 0.6);
    const light = { x: 50, y: 35 };
    const lx = gsap.quickTo(light, "x", { duration: 0.8, ease: "power3.out", onUpdate: () => deck.current?.style.setProperty("--mx", `${light.x}%`) });
    const ly = gsap.quickTo(light, "y", { duration: 0.8, ease: "power3.out", onUpdate: () => deck.current?.style.setProperty("--my", `${light.y}%`) });
    const panTo = (nx: number, ny: number) => {
      const img = deck.current?.querySelector('.tm-card[data-front="1"] .tm-pan');
      if (img) gsap.to(img, { x: -nx * 16, y: -ny * 12, duration: 1, ease: "power3.out", overwrite: "auto" });
    };
    const move = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      gx(nx * -36);
      ry(nx * 9);
      rx(-ny * 6);
      cx(-nx * 16);
      hx(-nx * 8);
      lx(50 + nx * 38);
      ly(35 + ny * 30);
      panTo(nx, ny);
    };
    const leave = () => {
      gx(0);
      ry(0);
      rx(0);
      cx(0);
      hx(0);
      lx(50);
      ly(35);
      panTo(0, 0);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      ctx.revert();
    };
  }, []);

  // travelling between years is a dolly shot: the ghost year rolls first, the deck swings, the words arrive last
  useEffect(() => {
    const dir = Math.sign(active - prevActive.current) || 1;
    prevActive.current = active;
    if (prefersReducedMotion()) return;
    const tl = gsap.timeline();
    const g = ghost.current?.firstElementChild;
    if (g) tl.fromTo(g, { xPercent: dir * 12, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.9, ease: "expo.out" }, 0);
    if (swing.current) tl.fromTo(swing.current, { rotationY: dir * -18, x: dir * 40, transformPerspective: 1600 }, { rotationY: 0, x: 0, duration: 1.3, ease: "elastic.out(1, 0.8)" }, 0.1);
    const copy = copyCol.current?.querySelector(".tm-copy");
    if (copy) tl.fromTo(copy, { x: dir * 56, opacity: 0 }, { x: 0, opacity: 1, duration: 0.9, ease: "expo.out" }, 0.26);
    return () => {
      tl.kill();
    };
  }, [active]);

  const onKey = (e: React.KeyboardEvent) => {
    const map: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 };
    if (e.key in map) {
      e.preventDefault();
      goTo(targetRef.current + map[e.key]);
    } else if (e.key === "Home") {
      e.preventDefault();
      goTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      goTo(N - 1);
    }
  };

  const skip = () => {
    const el = root.current;
    if (!el) return;
    const y = window.scrollY + el.getBoundingClientRect().bottom;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, { duration: 1.4 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  const m = MILESTONES[active];
  const era = eraOf(STARTS[active]);
  const counter = `${String(active + 1).padStart(2, "0")} / ${String(N).padStart(2, "0")}`;

  return (
    <section
      ref={root}
      className="relative z-10 bg-paper"
      style={{ height: reduced ? "auto" : `${100 + (N - 1) * 80}svh` }}
      aria-label="The architect's tape: Runwal milestones"
    >
      <div className={`blueprint ${reduced ? "relative" : "sticky top-0 h-svh"} flex flex-col overflow-hidden`}>
        {/* far layer: the year as a giant ghost numeral */}
        <div ref={ghost} aria-hidden className="pointer-events-none absolute inset-x-0 top-[24%] flex justify-center will-change-transform">
          <span className="display whitespace-nowrap text-[40vw] leading-none text-transparent [-webkit-text-stroke:1.5px_rgba(22,24,27,0.08)]">{STARTS[active]}</span>
        </div>

        {/* header row: intro + odometer */}
        <div className="relative flex flex-col gap-1 px-6 pt-20 md:flex-row md:items-end md:justify-between md:gap-6 md:px-10 md:pt-24">
          <div className="min-w-0">
            <p className="kicker text-dusk">The architect&rsquo;s tape</p>
            <h2 className="display mt-2 whitespace-nowrap text-[6.4vw] md:mt-3 md:text-[min(3.8vw,7vh)]">
              Measure <span className="accent normal-case">the years</span>
            </h2>
            <p className="mt-2 hidden max-w-sm text-[0.9rem] leading-relaxed text-graphite-2 md:block">Scroll, drag the tape or use the arrow keys.</p>
          </div>
          <div className="self-end">
            <Odometer label={label} reduced={reduced} />
          </div>
        </div>

        {/* deck + story */}
        <div className="relative grid min-h-0 flex-1 items-center gap-4 px-6 py-3 md:grid-cols-12 md:gap-10 md:px-10 md:py-4">
          <div className="flex min-h-0 items-center justify-center md:col-span-7">
            <div ref={swing} className="relative aspect-[4/3] h-[23svh] will-change-transform [perspective:1600px] md:h-[min(46svh,34vw)]">
              <div ref={deck} className="absolute inset-0 will-change-transform [transform-style:preserve-3d]">
                {MILESTONES.map((mm) => (
                  <Card key={mm.idx} m={mm} offset={mm.idx - active} reduced={reduced} />
                ))}
              </div>
            </div>
          </div>

          <div ref={copyCol} className="will-change-transform md:col-span-5">
            <div className="flex items-center justify-between border-b border-graphite/15 pb-3">
              <p className="kicker tabular-nums">{counter}</p>
              <p className="kicker whitespace-nowrap text-amber-deep">
                {m.year} &middot; {era === "sepia" ? "Print" : era === "film" ? "Film" : "Today"}
              </p>
            </div>
            <div key={active} className="tm-copy min-h-[8.5rem] md:min-h-[11rem]">
              <h3 className="title mt-3 text-2xl md:mt-5 md:text-[min(2.4vw,4.4vh)]">{m.title}</h3>
              <p className="mt-2 line-clamp-4 max-w-md text-[0.88rem] leading-relaxed text-graphite-2 md:mt-3 md:text-[0.98rem]">{m.text}</p>
            </div>
            <div className="mt-3 flex items-center gap-3 md:mt-5">
              <button
                type="button"
                onClick={() => goTo(targetRef.current - 1)}
                disabled={active === 0}
                aria-label="Previous milestone"
                className="flex size-11 items-center justify-center border border-graphite/25 transition-colors hover:border-graphite hover:bg-graphite hover:text-stone disabled:pointer-events-none disabled:opacity-30"
              >
                &larr;
              </button>
              <button
                type="button"
                onClick={() => goTo(targetRef.current + 1)}
                disabled={active === N - 1}
                aria-label="Next milestone"
                className="flex size-11 items-center justify-center border border-graphite/25 transition-colors hover:border-graphite hover:bg-graphite hover:text-stone disabled:pointer-events-none disabled:opacity-30"
              >
                &rarr;
              </button>
              {!reduced && (
                <button type="button" onClick={skip} className="kicker ulink ml-auto whitespace-nowrap text-mute hover:text-graphite">
                  Skip timeline &darr;
                </button>
              )}
            </div>
          </div>
        </div>

        {/* the tape: its own row, anchored to the bottom */}
        <div className="relative mb-6 mt-8 shrink-0">
          <div ref={chip} className="pointer-events-none absolute left-1/2 top-[-1.6rem] z-10 flex -translate-x-1/2 flex-col items-center" aria-hidden>
            <span className="kicker whitespace-nowrap bg-graphite px-2 py-1 text-[0.62rem] text-stone tabular-nums">
              {label} &middot; {counter}
            </span>
            <span className="mt-1 h-0 w-0 border-x-[6px] border-t-[7px] border-x-transparent border-t-graphite" />
          </div>
          <div className="pointer-events-none absolute bottom-0 left-1/2 top-0 z-10 w-px -translate-x-1/2 bg-graphite" aria-hidden />

          <div
            ref={tapeWrap}
            role="slider"
            tabIndex={0}
            aria-label="Timeline tape, drag to travel through the years"
            aria-valuemin={START_YEAR}
            aria-valuemax={END_YEAR}
            aria-valuenow={START_YEAR}
            aria-valuetext={label}
            onKeyDown={onKey}
            data-drag="0"
            className="relative h-20 cursor-grab touch-pan-y select-none overflow-hidden border-y border-graphite/25 bg-[#fbfaf7] shadow-[inset_0_8px_14px_-10px_rgba(22,24,27,0.25)] data-[drag=1]:cursor-grabbing md:h-24"
          >
            <div ref={tape} className="absolute inset-y-0 left-0 will-change-transform" style={{ width: `${(YEARS + 1) * 66}px` }}>
              <Tape />
            </div>
            <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#fbfaf7] to-transparent md:w-40" />
            <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#fbfaf7] to-transparent md:w-40" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Graduations: a tick per year, numbers every five, amber notches at milestones. Scale comes from --tm-px. */
function Tape() {
  return (
    <div className="relative h-full">
      {Array.from({ length: YEARS + 1 }, (_, i) => {
        const y = START_YEAR + i;
        const k = STARTS.indexOf(y);
        const five = y % 5 === 0 || i === 0;
        return (
          <div key={y} className="tm-year absolute inset-y-0" style={{ left: `calc(${i} * var(--tm-px, 66px))` }}>
            {/* minor ticks between this year and the next */}
            {i < YEARS &&
              [0.25, 0.5, 0.75].map((f) => (
                <span key={f} className="absolute top-0 w-px bg-graphite/35" style={{ left: `calc(${f} * var(--tm-px, 66px))`, height: f === 0.5 ? "26%" : "14%" }} />
              ))}
            <span
              className={`absolute top-0 ${five ? "h-[50%] w-[2px] bg-graphite shadow-[1px_0_0_rgba(255,255,255,0.9)]" : "h-[36%] w-px bg-graphite/70 shadow-[1px_0_0_rgba(255,255,255,0.7)]"}`}
            />
            <span
              className={`absolute origin-bottom-left font-mono tabular-nums ${five ? "left-1.5 top-[52%] text-[11px] font-medium tracking-[0.06em] text-graphite" : "left-1 top-[40%] text-[9px] text-graphite/45"}`}
              style={{ transform: "skewX(calc(var(--tm-skew, 0) * 1deg))", filter: "blur(calc(var(--tm-blur, 0) * 1px))" }}
            >
              {five ? y : <>&rsquo;{String(y).slice(2)}</>}
            </span>
            {k >= 0 && (
              <span className="absolute bottom-0 -translate-x-1/2" aria-hidden>
                <span className="block h-0 w-0 border-x-[7px] border-b-[11px] border-x-transparent border-b-amber" />
                <span className="block h-2 w-[14px] bg-amber" />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
