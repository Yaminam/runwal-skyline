"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { useTransition } from "./Transition";

type Tower = { slug: string; name: string; area: string };
type Win = { x: number; y: number; ambient: number; cur: number };
type Bldg = { x: number; w: number; h: number; tower?: Tower };

const CELL_W = 7;
const CELL_H = 9;
const RADIUS = 150;

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

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
      // Runwal towers spread across the width, ordinary blocks filling the gaps
      const slots = towers.map((t, i) => ({ t, x: ((i + 0.5) / towers.length + (r() - 0.5) * 0.045) * W }));
      let x = -10;
      let next = 0;
      while (x < W + 10) {
        const slot = slots[next];
        if (slot && x + 30 > slot.x - 20) {
          const w = 30 + Math.round(r() * 10);
          bldgs.push({ x: Math.round(slot.x - w / 2), w, h: Math.round(H * (0.58 + r() * 0.36)), tower: slot.t });
          x = slot.x + w / 2 + 3 + r() * 4;
          next++;
          continue;
        }
        const w = 14 + Math.round(r() * 38);
        const tall = r() < 0.3;
        const h = Math.round(H * (tall ? 0.4 + r() * 0.32 : 0.12 + r() * 0.32));
        const room = slot ? slot.x - 22 - x : Infinity;
        const bw = Math.max(10, Math.min(w, room));
        bldgs.push({ x: Math.round(x), w: bw, h });
        x += bw + 2 + Math.round(r() * 4);
      }

      // windows
      wins = [];
      for (const b of bldgs) {
        const top = H - b.h;
        const cols = Math.floor((b.w - 4) / CELL_W);
        const rows = Math.floor((b.h - 8) / CELL_H);
        const ox = b.x + (b.w - cols * CELL_W) / 2 + 2;
        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            const lit = r() < (b.tower ? 0.3 : 0.1) ? 0.25 + r() * 0.55 : 0;
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
        g.addColorStop(0, b.tower ? "#2a2f38" : "#1c2027");
        g.addColorStop(1, "#111419");
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

    build();
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
      <canvas ref={canvas} className="absolute inset-0" aria-label="Mumbai skyline at night. Move your cursor to light up the windows; Runwal towers are marked with an amber crown." role="img" />
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
