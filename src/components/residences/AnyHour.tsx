"use client";

import gsap from "gsap";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { DIMS } from "@/lib/dims";
import { prefersReducedMotion } from "@/lib/motion";

/*
  "See it at any hour": one render of the residence, re-lit from sunrise to late night.
  The photo is never swapped. It is graded live with layered effects:
   - CSS filter on the base image (exposure, contrast, saturation)
   - a soft-light sky tint and a multiply dusk/night shade
   - a "luminance key": a high-contrast warm copy of the same render, confined to the building,
     screen-blended at night so the real windows and lamps in the render come alive
   - seeded window glints on a canvas, switching on through the evening and off late at night
   - a sun (then moon) glow travelling an arc across the frame
  Everything is driven from one number (the hour) written straight to the DOM, never React state.
*/

type Region = { x: number; y: number; w: number; h: number; cols?: number; rows?: number; key?: boolean; dots?: number; wide?: boolean };
type Lamp = { x: number; y: number; r: number };
type Look = {
  /** which image to light */
  img: "feature" | "hero";
  /**
   * Areas (percent of the image) that light up at night:
   *  cols/rows: a tower facade, lit window by window on a grid (wide: full-width glass bands)
   *  dots: scattered city lights
   *  key: the render already has lit windows/lamps here, so bring its own bright points up
   */
  lit: Region[];
  /** warm lamps (interiors, terraces, gardens) */
  lamps?: Lamp[];
  /** index into project.lines for the caption */
  line?: number;
};

const LOOKS: Record<string, Look> = {
  "runwal-malabar": { img: "feature", lit: [{ x: 40.5, y: 34, w: 26, h: 62, cols: 3, rows: 13, wide: true }], lamps: [{ x: 53, y: 25, r: 16 }], line: 1 },
  "runwal-raaya": {
    img: "feature",
    lit: [
      { x: 45.6, y: 12, w: 10.8, h: 69, cols: 9, rows: 46 },
      { x: 62.2, y: 5, w: 11.6, h: 76, cols: 10, rows: 50 },
    ],
    lamps: [{ x: 58, y: 88, r: 10 }],
    line: 0,
  },
  "runwal-timeless": { img: "feature", lit: [], lamps: [{ x: 59, y: 30, r: 22 }, { x: 36, y: 71, r: 9 }, { x: 90, y: 47, r: 12 }, { x: 8, y: 42, r: 10 }], line: 0 },
  "runwal-rare": {
    img: "feature",
    lit: [{ x: 3, y: 44, w: 94, h: 8, dots: 150 }],
    lamps: [{ x: 21, y: 77, r: 8 }, { x: 43, y: 71, r: 9 }, { x: 70, y: 59, r: 7 }, { x: 97, y: 55, r: 6 }],
    line: 1,
  },
  "runwal-auris": {
    img: "feature",
    lit: [
      { x: 40.5, y: 8, w: 17.5, h: 77, cols: 11, rows: 52, key: true },
      { x: 0, y: 29, w: 100, h: 32, dots: 160, key: true },
    ],
    line: 0,
  },
  "runwal-sanctuary": { img: "feature", lit: [{ x: 0, y: 0, w: 100, h: 50, key: true, dots: 60 }], lamps: [{ x: 46, y: 64, r: 14 }], line: 0 },
  "runwal-one": { img: "feature", lit: [{ x: 79.5, y: 0, w: 20.5, h: 62, cols: 8, rows: 30 }], lamps: [{ x: 26, y: 40, r: 18 }, { x: 52, y: 66, r: 10 }], line: 0 },
  "runwal-zenith": {
    img: "feature",
    lit: [
      { x: 0, y: 36, w: 32, h: 26, dots: 120, key: true },
      { x: 20, y: 91, w: 80, h: 9, key: true },
    ],
    lamps: [{ x: 52, y: 22, r: 12 }, { x: 62, y: 64, r: 10 }],
    line: 0,
  },
  "runwal-lands-end": { img: "feature", lit: [{ x: 8, y: 55, w: 50, h: 30, dots: 22 }], lamps: [{ x: 36, y: 83, r: 9 }, { x: 82, y: 92, r: 8 }], line: 0 },
  "runwal-the-central-park": {
    img: "feature",
    lit: [
      { x: 60.5, y: 9, w: 38, h: 61, cols: 24, rows: 40, key: true },
      { x: 12, y: 60, w: 50, h: 22, key: true },
    ],
    line: 0,
  },
  "r-square-andheri": { img: "hero", lit: [{ x: 4, y: 0, w: 56, h: 32, cols: 16, rows: 6 }], lamps: [{ x: 60, y: 48, r: 18 }, { x: 22, y: 60, r: 12 }], line: 0 },
  "r-square-mulund": {
    img: "hero",
    lit: [
      { x: 28, y: 2, w: 17, h: 90, cols: 2, rows: 18, wide: true },
      { x: 48.5, y: 3, w: 25, h: 88, cols: 3, rows: 18, wide: true },
    ],
    line: 0,
  },
};

/* ------------------------------------------------------------ the day, as keyframes */

type Key = {
  t: number;
  bri: number;
  con: number;
  sat: number;
  /** soft-light sky tint (top, bottom) and strength */
  tintTop: string;
  tintBot: string;
  tint: number;
  /** multiply shade (top, bottom) and strength */
  shadeTop: string;
  shadeBot: string;
  shade: number;
  /** sun or moon glow */
  glow: string;
  glowAmt: number;
  /** 0..1 artificial light */
  night: number;
  /** page surround */
  bg: string;
};

const KEYS: Key[] = [
  { t: 6, bri: 0.78, con: 1.04, sat: 0.9, tintTop: "#8a8fd0", tintBot: "#ffb08a", tint: 0.6, shadeTop: "#5a5f9e", shadeBot: "#e0a08a", shade: 0.28, glow: "#ffb27a", glowAmt: 0.8, night: 0.3, bg: "#3b3546" },
  { t: 8, bri: 0.97, con: 1.03, sat: 1.0, tintTop: "#dfe9ff", tintBot: "#ffe6c8", tint: 0.32, shadeTop: "#ffffff", shadeBot: "#ffffff", shade: 0, glow: "#fff0d8", glowAmt: 0.45, night: 0, bg: "#e7e4de" },
  { t: 12.5, bri: 1.06, con: 1.06, sat: 1.06, tintTop: "#e8f0ff", tintBot: "#ffffff", tint: 0.12, shadeTop: "#ffffff", shadeBot: "#ffffff", shade: 0, glow: "#ffffff", glowAmt: 0.25, night: 0, bg: "#eeebe5" },
  { t: 16, bri: 1.02, con: 1.07, sat: 1.1, tintTop: "#fff0d6", tintBot: "#ffd6a8", tint: 0.32, shadeTop: "#ffffff", shadeBot: "#ffffff", shade: 0, glow: "#ffd9a0", glowAmt: 0.45, night: 0, bg: "#ebe5da" },
  { t: 17.8, bri: 0.97, con: 1.1, sat: 1.2, tintTop: "#ffc27a", tintBot: "#ff8c4a", tint: 0.62, shadeTop: "#e9b48a", shadeBot: "#c56a3c", shade: 0.12, glow: "#ffaa5c", glowAmt: 0.85, night: 0.08, bg: "#c9a585" },
  { t: 19, bri: 0.6, con: 1.12, sat: 0.92, tintTop: "#3b5bdb", tintBot: "#f39a62", tint: 0.48, shadeTop: "#22337a", shadeBot: "#a86a5a", shade: 0.55, glow: "#ff9a62", glowAmt: 0.45, night: 0.62, bg: "#262c45" },
  { t: 20.5, bri: 0.56, con: 1.12, sat: 0.8, tintTop: "#2a3c8f", tintBot: "#33386a", tint: 0.5, shadeTop: "#1a2660", shadeBot: "#2a2f50", shade: 0.62, glow: "#c9d4ff", glowAmt: 0.22, night: 1, bg: "#12151d" },
  { t: 23, bri: 0.46, con: 1.15, sat: 0.72, tintTop: "#1c2a6a", tintBot: "#252a4a", tint: 0.5, shadeTop: "#111a48", shadeBot: "#1f2440", shade: 0.7, glow: "#c9d4ff", glowAmt: 0.28, night: 0.78, bg: "#0d1015" },
];

const FALLBACK: Look = { img: "hero", lit: [{ x: 20, y: 5, w: 60, h: 80, dots: 80 }] };

const START = 6;
const END = 23;

function hex(s: string): [number, number, number] {
  const n = parseInt(s.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const HEX = new Map(KEYS.flatMap((k) => [k.tintTop, k.tintBot, k.shadeTop, k.shadeBot, k.glow, k.bg]).map((c) => [c, hex(c)]));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mixHex = (a: string, b: string, t: number) => {
  const A = HEX.get(a) ?? hex(a);
  const B = HEX.get(b) ?? hex(b);
  return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`;
};

function sample(t: number) {
  let i = 0;
  while (i < KEYS.length - 2 && t > KEYS[i + 1].t) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const u = Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t)));
  const e = u * u * (3 - 2 * u);
  return {
    bri: lerp(a.bri, b.bri, e),
    con: lerp(a.con, b.con, e),
    sat: lerp(a.sat, b.sat, e),
    tintTop: mixHex(a.tintTop, b.tintTop, e),
    tintBot: mixHex(a.tintBot, b.tintBot, e),
    tint: lerp(a.tint, b.tint, e),
    shadeTop: mixHex(a.shadeTop, b.shadeTop, e),
    shadeBot: mixHex(a.shadeBot, b.shadeBot, e),
    shade: lerp(a.shade, b.shade, e),
    glow: mixHex(a.glow, b.glow, e),
    glowAmt: lerp(a.glowAmt, b.glowAmt, e),
    night: lerp(a.night, b.night, e),
    bg: mixHex(a.bg, b.bg, e),
    bgLum: (() => {
      const A = hex(a.bg);
      const B = hex(b.bg);
      const r = lerp(A[0], B[0], e);
      const g = lerp(A[1], B[1], e);
      const bb = lerp(A[2], B[2], e);
      return (0.2126 * r + 0.7152 * g + 0.0722 * bb) / 255;
    })(),
  };
}

function phase(t: number) {
  if (t < 7.2) return "Sunrise";
  if (t < 11) return "Morning";
  if (t < 15.6) return "Afternoon";
  if (t < 18.4) return "Golden hour";
  if (t < 19.7) return "Blue hour";
  if (t < 22.3) return "Evening";
  return "Late night";
}

const clockText = (t: number) => {
  const h = Math.floor(t);
  const m = Math.floor((t - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

function rng(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
const hashStr = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

type Glint = { x: number; y: number; w: number; h: number; on: number; off: number; warm: number; tw: number; window: boolean };

/* ------------------------------------------------------------ component */

type Props = {
  slug: string;
  name: string;
  short: string;
  lines: string[];
  tagline: string;
  feature: string | null;
  hero: string;
};

export function AnyHour({ slug, name, short, lines, tagline, feature, hero }: Props) {
  const look = LOOKS[slug] ?? FALLBACK;
  const line = lines[look.line ?? 0] ?? tagline;
  const src = look.img === "feature" && feature ? feature : hero;
  const [iw, ih] = DIMS[src] ?? [1600, 1000];

  const section = useRef<HTMLElement>(null);
  const base = useRef<HTMLImageElement>(null);
  const tint = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  const keys = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const dialSun = useRef<SVGCircleElement>(null);
  const time = useRef(16);
  const touched = useRef(false);
  const dragging = useRef(false);
  const tween = useRef<gsap.core.Animation | null>(null);

  const glints = useMemo<Glint[]>(() => {
    const r = rng(hashStr(slug));
    const out: Glint[] = [];
    for (const g of look.lit) {
      if (g.cols && g.rows) {
        // a facade: windows on a grid, coming on one by one through the evening
        const cw = g.w / g.cols;
        const ch = g.h / g.rows;
        for (let c = 0; c < g.cols; c++) {
          for (let row = 0; row < g.rows; row++) {
            if (r() < 0.4) continue;
            out.push({
              x: g.x + (c + 0.5) * cw,
              y: g.y + (row + 0.5) * ch,
              w: cw * (g.wide ? 0.84 : 0.5),
              h: ch * (g.wide ? 0.42 : 0.44),
              on: 17.9 + r() * 2.4,
              off: r() < 0.5 ? 21.4 + r() * 1.7 : 99,
              warm: r(),
              tw: r() * 6.28,
              window: true,
            });
          }
        }
      }
      for (let i = 0; i < (g.dots ?? 0); i++) {
        out.push({
          x: g.x + r() * g.w,
          y: g.y + r() * g.h,
          w: 0.18 + r() * 0.2,
          h: 0.18 + r() * 0.2,
          on: 18 + r() * 2,
          off: r() < 0.3 ? 22 + r() : 99,
          warm: r(),
          tw: r() * 6.28,
          window: false,
        });
      }
    }
    return out;
  }, [slug, look.lit]);

  const drawGlints = useCallback(
    (t: number, night: number) => {
      const cv = canvas.current;
      if (!cv) return;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (cv.width !== Math.round(w * dpr)) {
        cv.width = Math.round(w * dpr);
        cv.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (night < 0.02) return;
      ctx.globalCompositeOperation = "lighter";
      // warm lamps first, as soft pools of light
      for (const l of look.lamps ?? []) {
        const a = Math.min(1, Math.max(0, (t - 17.6) / 1.4)) * night;
        if (a < 0.01) continue;
        const x = (l.x / 100) * w;
        const y = (l.y / 100) * h;
        const rad = (l.r / 100) * w;
        const lg = ctx.createRadialGradient(x, y, 0, x, y, rad);
        lg.addColorStop(0, `rgba(255,214,150,${0.55 * a})`);
        lg.addColorStop(0.25, `rgba(255,170,90,${0.28 * a})`);
        lg.addColorStop(1, "rgba(255,150,70,0)");
        ctx.fillStyle = lg;
        ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      for (const g of glints) {
        const on = Math.min(1, Math.max(0, (t - g.on) / 0.3)) * Math.min(1, Math.max(0, (g.off - t) / 0.3));
        if (on <= 0.01) continue;
        const flick = 0.75 + 0.25 * Math.sin(g.tw + t * 7) ** 2;
        const a = on * night * flick;
        const x = (g.x / 100) * w;
        const y = (g.y / 100) * h;
        const ww = Math.max(1, (g.w / 100) * w);
        const hh = Math.max(1, (g.h / 100) * h);
        const col = g.warm > 0.85 ? "255,240,214" : g.warm > 0.3 ? "255,196,122" : "255,166,86";
        if (g.window) {
          // a lit room: soft spill around the pane, light pooling at the floor of the window
          ctx.fillStyle = `rgba(${col},${0.12 * a})`;
          ctx.fillRect(x - ww * 0.8, y - hh * 1.1, ww * 1.6, hh * 2.2);
          const pane = ctx.createLinearGradient(0, y - hh / 2, 0, y + hh / 2);
          pane.addColorStop(0, `rgba(${col},${0.4 * a})`);
          pane.addColorStop(1, `rgba(${col},${0.82 * a})`);
          ctx.fillStyle = pane;
          ctx.fillRect(x - ww / 2, y - hh / 2, ww, hh);
        } else {
          // a distant light: crisp point, faint halo
          const core = Math.max(1, Math.min(2.2, ww * 0.9));
          const halo = ctx.createRadialGradient(x, y, 0, x, y, core * 3.2);
          halo.addColorStop(0, `rgba(${col},${0.28 * a})`);
          halo.addColorStop(1, `rgba(${col},0)`);
          ctx.fillStyle = halo;
          ctx.fillRect(x - core * 3.2, y - core * 3.2, core * 6.4, core * 6.4);
          ctx.fillStyle = `rgba(${col},${0.9 * a})`;
          ctx.fillRect(x - core / 2, y - core / 2, core, core);
        }
      }
      ctx.globalCompositeOperation = "source-over";
    },
    [glints, look.lamps],
  );

  const apply = useCallback(
    (t: number) => {
      time.current = t;
      const k = sample(t);
      if (base.current) base.current.style.filter = `brightness(${k.bri.toFixed(3)}) contrast(${k.con.toFixed(3)}) saturate(${k.sat.toFixed(3)})`;
      if (tint.current) {
        tint.current.style.background = `linear-gradient(to bottom, ${k.tintTop}, ${k.tintBot})`;
        tint.current.style.opacity = k.tint.toFixed(3);
      }
      if (shade.current) {
        shade.current.style.background = `linear-gradient(to bottom, ${k.shadeTop}, ${k.shadeBot})`;
        shade.current.style.opacity = k.shade.toFixed(3);
      }
      if (keys.current) keys.current.style.opacity = (k.night * 0.62).toFixed(3);
      if (glow.current) {
        // sun arcs left to right until dusk; the moon takes over after
        const isMoon = t > 19.6;
        const u = isMoon ? (t - 19.6) / (END - 19.6) : (t - START) / (19.2 - START);
        const x = isMoon ? 62 + u * 26 : 6 + Math.min(1, u) * 88;
        const y = isMoon ? 18 - Math.sin(u * Math.PI) * 6 : 82 - Math.sin(Math.min(1, u) * Math.PI) * 70;
        glow.current.style.left = `${x}%`;
        glow.current.style.top = `${y}%`;
        glow.current.style.background = `radial-gradient(circle, ${k.glow} 0%, transparent 62%)`;
        glow.current.style.opacity = k.glowAmt.toFixed(3);
        glow.current.style.width = isMoon ? "16%" : "46%";
      }
      drawGlints(t, k.night);
      if (clock.current) clock.current.textContent = clockText(t);
      if (label.current) label.current.textContent = phase(t);
      const f = (t - START) / (END - START);
      if (thumb.current) thumb.current.style.left = `${f * 100}%`;
      if (fill.current) fill.current.style.transform = `scaleX(${f})`;
      if (track.current) track.current.setAttribute("aria-valuetext", `${clockText(t)}, ${phase(t)}`);
      if (track.current) track.current.setAttribute("aria-valuenow", t.toFixed(2));
      if (dialSun.current) {
        const a = Math.PI * (1 - f);
        dialSun.current.setAttribute("cx", String(60 + Math.cos(a) * 50));
        dialSun.current.setAttribute("cy", String(58 - Math.sin(a) * 50));
      }
      const el = section.current;
      if (el) {
        el.style.backgroundColor = k.bg;
        const dark = k.bgLum < 0.45;
        el.dataset.tone = dark ? "dark" : "light";
        el.dataset.ink = dark ? "light" : "dark";
      }
    },
    [drawGlints],
  );

  const setTime = useCallback(
    (t: number) => {
      apply(Math.min(END, Math.max(START, t)));
    },
    [apply],
  );

  // first paint + resize
  useEffect(() => {
    apply(time.current);
    const ro = new ResizeObserver(() => drawGlints(time.current, sample(time.current).night));
    if (canvas.current) ro.observe(canvas.current);
    return () => ro.disconnect();
  }, [apply, drawGlints]);

  // play the day once when the section comes into view
  useEffect(() => {
    const el = section.current;
    if (!el || prefersReducedMotion()) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || touched.current) return;
        io.disconnect();
        const o = { t: 6.2 };
        apply(o.t);
        tween.current = gsap
          .timeline()
          .to(o, { t: 21.2, duration: 7.5, ease: "sine.inOut", onUpdate: () => apply(o.t) })
          .to(o, { t: 18.1, duration: 2.2, ease: "power2.inOut", onUpdate: () => apply(o.t) });
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      tween.current?.kill();
    };
  }, [apply]);

  const stopAuto = () => {
    touched.current = true;
    tween.current?.kill();
    tween.current = null;
  };

  const fromPointer = (clientX: number) => {
    const r = track.current?.getBoundingClientRect();
    if (!r) return;
    const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    setTime(START + f * (END - START));
  };

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    stopAuto();
    dragging.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* capture is a nicety; dragging still works within the track */
    }
    fromPointer(e.clientX);
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragging.current) fromPointer(e.clientX);
  };
  const onUp = () => {
    dragging.current = false;
  };
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 1 : 0.25;
    let t = time.current;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") t += step;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") t -= step;
    else if (e.key === "Home") t = START;
    else if (e.key === "End") t = END;
    else return;
    e.preventDefault();
    stopAuto();
    setTime(t);
  };

  const jump = (t: number) => {
    stopAuto();
    const o = { t: time.current };
    tween.current = gsap.to(o, { t, duration: 1.4, ease: "power3.inOut", onUpdate: () => apply(o.t) });
  };

  // key layer: the same render, thresholded to its brightest points and warmed, per lit region
  const keyFilter = "grayscale(1) contrast(5.5) brightness(0.52) sepia(1) saturate(4.5) hue-rotate(-14deg)";

  return (
    <section
      ref={section}
      data-tone="light"
      data-ink="dark"
      className="group/ah relative overflow-hidden px-6 py-24 text-graphite transition-colors duration-300 data-[ink=light]:text-stone md:px-10 md:py-32"
      aria-labelledby="ah-h"
    >
      <div className="grid gap-10 md:grid-cols-12 md:grid-rows-[auto_1fr] md:gap-x-12 md:gap-y-0">
        <div className="md:col-span-4 md:row-start-1">
          <p className="kicker mb-6 opacity-70 group-data-[ink=light]/ah:text-amber group-data-[ink=light]/ah:opacity-100">See it at any hour</p>
          <h2 id="ah-h" className="title text-4xl md:text-[3.2rem]">
            {short}, from first light <span className="accent">to the last</span>
          </h2>
        </div>

        <div className="md:col-span-8 md:col-start-5 md:row-span-2 md:row-start-1">
          <div className="relative w-full overflow-hidden bg-night" style={{ aspectRatio: `${iw} / ${ih}` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={base} src={src} alt={`${name} at different times of day: artist's impression`} className="absolute inset-0 h-full w-full object-cover will-change-[filter]" draggable={false} />
            <div ref={tint} className="pointer-events-none absolute inset-0 mix-blend-soft-light" aria-hidden />
            <div ref={shade} className="pointer-events-none absolute inset-0 mix-blend-multiply" aria-hidden />

            {/* lights coming on: the render's own bright points, warmed, only within the buildings */}
            <div ref={keys} className="pointer-events-none absolute inset-0 opacity-0 mix-blend-screen" aria-hidden>
              {look.lit.filter((g) => g.key).map((g, i) => (
                <div
                  key={i}
                  className="absolute overflow-hidden"
                  style={{
                    left: `${g.x}%`,
                    top: `${g.y}%`,
                    width: `${g.w}%`,
                    height: `${g.h}%`,
                    maskImage: "radial-gradient(closest-side, #000 72%, transparent 100%)",
                    WebkitMaskImage: "radial-gradient(closest-side, #000 72%, transparent 100%)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    className="absolute max-w-none"
                    style={{
                      width: `${(100 / g.w) * 100}%`,
                      height: `${(100 / g.h) * 100}%`,
                      left: `${(-g.x / g.w) * 100}%`,
                      top: `${(-g.y / g.h) * 100}%`,
                      filter: keyFilter,
                    }}
                    draggable={false}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    className="absolute max-w-none opacity-40"
                    style={{
                      width: `${(100 / g.w) * 100}%`,
                      height: `${(100 / g.h) * 100}%`,
                      left: `${(-g.x / g.w) * 100}%`,
                      top: `${(-g.y / g.h) * 100}%`,
                      filter: `${keyFilter} blur(7px)`,
                    }}
                    draggable={false}
                  />
                </div>
              ))}
            </div>

            <canvas ref={canvas} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />
            <div ref={glow} className="pointer-events-none absolute aspect-square -translate-x-1/2 -translate-y-1/2 mix-blend-screen" aria-hidden />
            <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.35)]" aria-hidden />
            <span className="kicker absolute bottom-4 right-4 text-white/70 [text-shadow:0_1px_6px_rgba(0,0,0,.5)]">Artist&rsquo;s impression, re-lit</span>
          </div>

          {/* the scrubber: the day as a strip of sky */}
          <div className="mt-8">
            <div
              ref={track}
              role="slider"
              tabIndex={0}
              aria-label="Time of day"
              aria-valuemin={START}
              aria-valuemax={END}
              aria-valuenow={16}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              onKeyDown={onKey}
              className="relative h-14 cursor-grab touch-none select-none active:cursor-grabbing"
            >
              <div
                className="absolute inset-x-0 top-1/2 h-[0.1875rem] -translate-y-1/2 opacity-90"
                style={{
                  background:
                    "linear-gradient(90deg,#3a4a86 0%,#ffb98a 6%,#dfe9ff 18%,#ffffff 38%,#ffe0b0 58%,#ff9a55 70%,#3b5bdb 77%,#1b2a6b 86%,#0b1230 100%)",
                }}
              />
              <div ref={fill} className="absolute inset-x-0 top-1/2 h-px origin-left -translate-y-[0.375rem] bg-current opacity-40" />
              {Array.from({ length: END - START + 1 }, (_, i) => (
                <span
                  key={i}
                  className="absolute top-1/2 h-2 w-px -translate-y-[calc(50%+0.625rem)] bg-current opacity-30"
                  style={{ left: `${(i / (END - START)) * 100}%` }}
                  aria-hidden
                />
              ))}
              <div ref={thumb} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: "58.8%" }}>
                <div className="flex size-9 items-center justify-center rounded-full border border-current/30 bg-amber shadow-[0_0_0_6px_rgba(242,166,90,0.18),0_6px_20px_rgba(0,0,0,0.25)]">
                  <span className="size-2 rounded-full bg-white" />
                </div>
              </div>
            </div>
            <div className="kicker relative mt-1 h-4 opacity-55" aria-hidden>
              {[6, 9, 12, 15, 18, 21, 23].map((h) => (
                <span
                  key={h}
                  className={`absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full ${h % 6 === 3 ? "hidden md:block" : ""}`}
                  style={{ left: `${((h - START) / (END - START)) * 100}%` }}
                >
                  {String(h).padStart(2, "0")}:00
                </span>
              ))}
            </div>
            <p className="kicker mt-6 opacity-55">Drag the sun &middot; or press a moment</p>
          </div>
        </div>
        <div className="flex flex-col md:col-span-4 md:row-start-2">
          <div className="flex items-end gap-6 md:mt-14">
            <svg viewBox="0 0 120 64" className="h-16 w-auto shrink-0 opacity-80" aria-hidden>
              <path d="M10 58 A50 50 0 0 1 110 58" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeDasharray="2 4" />
              <line x1="4" x2="116" y1="58" y2="58" stroke="currentColor" strokeOpacity="0.3" />
              <circle ref={dialSun} cx="60" cy="8" r="5" fill="#f2a65a" />
            </svg>
            <div>
              <span ref={clock} className="title block text-6xl tabular-nums md:text-7xl">
                16:00
              </span>
              <span ref={label} className="kicker mt-2 block opacity-70">
                Afternoon
              </span>
            </div>
          </div>

          {line && (
            <p className="mt-10 max-w-sm border-l border-amber pl-5 leading-relaxed opacity-85">
              <span className="accent text-xl">&ldquo;{line}&rdquo;</span>
            </p>
          )}

          <div className="mt-10 flex flex-wrap gap-2 md:mt-auto md:pt-10">
            {[
              { t: 6.6, l: "Sunrise" },
              { t: 12.5, l: "Noon" },
              { t: 17.9, l: "Golden hour" },
              { t: 19.1, l: "Blue hour" },
              { t: 21.4, l: "Night" },
            ].map((b) => (
              <button
                key={b.l}
                type="button"
                onClick={() => jump(b.t)}
                className="kicker border border-current/20 px-3 py-2 opacity-75 transition-[opacity,border-color] hover:border-amber hover:opacity-100"
              >
                {b.l}
              </button>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
