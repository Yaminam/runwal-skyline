"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { LANDMARKS } from "../three/skyline-state";
import { useTransition } from "./Transition";

type Tower = { slug: string; name: string; area: string };
type Win = { x: number; y: number; ambient: number; cur: number };
type Bldg = { x: number; w: number; h: number; depth: number; tower?: Tower };

/** Baked by _tools/realcity/bake.py from OpenStreetMap: [x 0..1 north->south, width, height m, depth 0 sea..1 inland] */
type Elevation = { latN: number; latS: number; maxH: number; b: Array<[number, number, number, number]> };

const CELL_W = 6;
const CELL_H = 8;
const RADIUS = 150;

let elevation: Promise<Elevation> | null = null;
const loadElevation = () => (elevation ??= fetch("/data/skyline-elevation.json").then((r) => r.json() as Promise<Elevation>));

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// where each residence stands on the skyline (Runwal Central Park is in Pune: shown at the far edge)
const PLACE: Record<string, { lat: number; floors: number }> = Object.fromEntries(LANDMARKS.map((l) => [l.slug, { lat: l.lat, floors: l.floors }]));

/**
 * The footer skyline: Mumbai at night, drawn on a canvas. A few windows are lit at random and slowly
 * change; the cursor works like a torch, warming every window near it. Runwal's towers stand taller
 * with an amber crown, and hovering one names it (click to open the residence).
 */
export function NightSkyline({ towers }: { towers: Tower[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const { go } = useTransition();
  const goRef = useRef(go);
  useEffect(() => {
    goRef.current = go;
  }, [go]);
  const tipName = useRef<HTMLSpanElement>(null);
  const tipArea = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const host = wrap.current;
    const cv = canvas.current;
    if (!host || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduced = prefersReducedMotion();

    let W = 0;
    let H = 0;
    let dpr = 1;
    let bldgs: Bldg[] = [];
    let wins: Win[] = [];
    let base: HTMLCanvasElement | null = null;
    let raf = 0;
    let visible = false;
    const mouse = { x: -9999, y: -9999, on: false };
    let hovered: Bldg | null = null;

    const build = () => {
      const r = rng(1978);
      W = host.clientWidth;
      H = host.clientHeight;
      // hidden at this breakpoint (display: none): nothing to draw until it has a size
      if (!W || !H) {
        base = null;
        return;
      }
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      cv.style.width = `${W}px`;
      cv.style.height = `${H}px`;

      bldgs = [];
      const data = ele;
      if (!data) return;
      const span = data.latN - data.latS;
      const scaleH = (H * 0.86) / data.maxH;
      const narrow = W < 700;
      const rows = narrow ? data.b.filter((b) => b[2] >= 45) : data.b;
      // the real city: far (inland) buildings first, the seafront last
      for (const [x, w, h, d] of rows) {
        bldgs.push({ x: Math.round(x * W), w: Math.max(narrow ? 3 : 4, Math.round(w * W * (narrow ? 1.6 : 2.2))), h: Math.max(6, Math.round(h * scaleH)), depth: d });
      }
      // Runwal towers at their real places along the coast, nudged apart so each can be pointed at
      const placed = towers
        .map((t) => {
          const at = PLACE[t.slug];
          return { t, x: at ? (data.latN - at.lat) / span : 0.985, floors: at?.floors ?? 40 };
        })
        .sort((a, b) => a.x - b.x);
      const gap = narrow ? 0.07 : 0.03;
      for (let i = 1; i < placed.length; i++) placed[i].x = Math.max(placed[i].x, placed[i - 1].x + gap);
      const over = placed.length ? placed[placed.length - 1].x - 0.985 : 0;
      if (over > 0) placed.forEach((p, i) => (p.x -= over * (i / Math.max(1, placed.length - 1))));
      for (const p of placed) {
        const w = narrow ? 12 : 16 + Math.round(r() * 4);
        const h = Math.min(H * 0.94, Math.max(H * 0.42, p.floors * 3.4 * scaleH * 1.25));
        bldgs.push({ x: Math.round(p.x * W - w / 2), w, h: Math.round(h), depth: -1, tower: p.t });
      }

      // windows
      wins = [];
      for (const b of bldgs) {
        const top = H - b.h;
        if (b.w < 9 && !b.tower) continue;
        const cols = Math.max(1, Math.floor((b.w - 3) / CELL_W));
        const rows = Math.floor((b.h - 8) / CELL_H);
        const ox = b.x + (b.w - cols * CELL_W) / 2 + 1.5;
        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            const lit = r() < (b.tower ? 0.32 : 0.09 + (1 - Math.max(0, b.depth)) * 0.06) ? 0.22 + r() * 0.55 : 0;
            wins.push({ x: ox + i * CELL_W, y: top + 8 + j * CELL_H, ambient: lit, cur: lit });
          }
        }
      }

      // static layer: horizon glow, building bodies, unlit panes, tower crowns
      base = document.createElement("canvas");
      base.width = cv.width;
      base.height = cv.height;
      const b2 = base.getContext("2d");
      if (!b2) return;
      b2.scale(dpr, dpr);
      for (const b of bldgs) {
        const top = H - b.h;
        const g = b2.createLinearGradient(0, top, 0, H);
        // inland buildings recede into the night, the seafront reads lighter
        const near = b.tower ? 1 : 1 - b.depth;
        const c0 = Math.round(19 + near * 16);
        g.addColorStop(0, b.tower ? "#2c313a" : `rgb(${c0}, ${c0 + 4}, ${c0 + 10})`);
        g.addColorStop(1, "#101318");
        b2.fillStyle = g;
        b2.fillRect(b.x, top, b.w, b.h);
        if (b.tower) {
          b2.fillStyle = "rgba(242,166,90,0.9)";
          b2.fillRect(b.x + b.w / 2 - 3, top - 4, 6, 4);
          b2.fillStyle = "rgba(242,166,90,0.35)";
          b2.fillRect(b.x, top, b.w, 1);
        }
      }
      b2.fillStyle = "#252a32";
      for (const w of wins) b2.fillRect(w.x, w.y, 3, 4);
      draw();
    };

    const draw = () => {
      if (!base || !base.width || !base.height) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(base, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const w of wins) {
        if (w.cur < 0.03) continue;
        const a = Math.min(1, w.cur);
        ctx.fillStyle = a > 0.7 ? `rgba(255,214,160,${a})` : `rgba(242,166,90,${a})`;
        ctx.fillRect(w.x, w.y, 3, 4);
      }
      if (hovered) {
        const top = H - hovered.h;
        ctx.strokeStyle = "rgba(242,166,90,0.8)";
        ctx.lineWidth = 1;
        ctx.strokeRect(hovered.x + 0.5, top + 0.5, hovered.w - 1, hovered.h);
      }
    };

    let t = 0;
    const tick = () => {
      raf = 0;
      if (!visible) return;
      t++;
      let moving = false;
      for (const w of wins) {
        let target = w.ambient;
        if (mouse.on) {
          const d = Math.hypot(w.x - mouse.x, w.y - mouse.y);
          if (d < RADIUS) target = Math.max(target, (1 - d / RADIUS) ** 1.4 * 1.1);
        }
        const diff = target - w.cur;
        if (Math.abs(diff) > 0.004) {
          w.cur += diff * 0.14;
          moving = true;
        }
      }
      // the city lives: now and then a light goes on or off
      if (!reduced && t % 8 === 0) {
        const w = wins[Math.floor(Math.random() * wins.length)];
        if (w) {
          w.ambient = w.ambient > 0 ? 0 : 0.3 + Math.random() * 0.5;
          moving = true;
        }
      }
      if (moving || t % 30 === 0) draw();
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf && visible) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.on = true;
      const hit = bldgs.find((b) => b.tower && mouse.x >= b.x && mouse.x <= b.x + b.w && mouse.y >= H - b.h);
      if (hit !== hovered) {
        hovered = hit ?? null;
        const el = tip.current;
        if (el) {
          if (hovered?.tower) {
            if (tipName.current) tipName.current.textContent = hovered.tower.name;
            if (tipArea.current) tipArea.current.textContent = hovered.tower.area;
            el.style.left = `${Math.min(W - 120, Math.max(120, hovered.x + hovered.w / 2))}px`;
            el.style.top = `${H - hovered.h - 14}px`;
            el.dataset.on = "1";
          } else el.dataset.on = "0";
        }
        cv.style.cursor = hovered ? "pointer" : "default";
      }
      start();
    };
    const onLeave = () => {
      mouse.on = false;
      start();
    };
    const onClick = () => {
      if (hovered?.tower) goRef.current(`/residences/${hovered.tower.slug}`);
    };

    let ele: Elevation | null = null;
    let alive = true;
    loadElevation()
      .then((d) => {
        if (!alive) return;
        ele = d;
        build();
      })
      .catch(() => {});
    const ro = new ResizeObserver(() => build());
    ro.observe(host);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      start();
    });
    io.observe(host);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    cv.addEventListener("click", onClick);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      cv.removeEventListener("click", onClick);
    };
  }, [towers]);

  return (
    <div ref={wrap} className="relative h-56 w-full md:h-72">
      {/* afterglow on the horizon */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-full bg-[radial-gradient(60%_70%_at_50%_100%,rgba(242,166,90,0.14),transparent_70%)]" aria-hidden />
      <canvas
        ref={canvas}
        className="absolute inset-0"
        aria-label="The real Mumbai skyline at night, seen from the sea. Move your cursor to light up the windows; Runwal towers are marked with an amber crown."
        role="img"
      />
      <p className="kicker pointer-events-none absolute right-6 top-0 text-[0.55rem]! text-stone/30 md:right-10">Mumbai from the sea &middot; building heights &copy; OpenStreetMap</p>
      <div
        ref={tip}
        data-on="0"
        className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap border border-amber/50 bg-night/90 px-3 py-2 text-center opacity-0 backdrop-blur transition-opacity duration-300 data-[on=1]:opacity-100"
        aria-hidden
      >
        <span ref={tipName} className="block text-[12px] font-medium text-stone" />
        <span ref={tipArea} className="kicker block text-[9px] text-amber" />
      </div>
    </div>
  );
}
