"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { CAREERS } from "@/lib/coverage";
import { prefersReducedMotion } from "@/lib/motion";
import { Pic } from "../../site/Pic";

const FRAMES = CAREERS.life.flatMap((e) => e.images.map((src, k) => ({ src, event: e.event, k })));

/**
 * Life at Runwal as a film strip you can throw. Drag (or swipe) and it glides on with inertia;
 * frames near the centre come forward, the rest tilt back and dim, so the reel has depth.
 */
export function LifeReel() {
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const w = wrap.current;
    const t = track.current;
    if (!w || !t) return;
    const reduced = prefersReducedMotion();
    const frames = Array.from(t.children) as HTMLElement[];
    let x = 0;
    let v = 0;
    let dragging = false;
    let lastX = 0;
    let raf = 0;
    let moved = 0;
    const max = () => Math.max(0, t.scrollWidth - w.clientWidth);

    const paint = () => {
      t.style.transform = `translate3d(${-x}px,0,0)`;
      const mid = w.clientWidth / 2;
      let best = 0;
      let bestD = Infinity;
      frames.forEach((f, i) => {
        const r = f.getBoundingClientRect();
        const wr = w.getBoundingClientRect();
        const c = r.left - wr.left + r.width / 2;
        const d = (c - mid) / mid; // -1..1 across the viewport
        const ad = Math.min(1, Math.abs(d));
        if (Math.abs(c - mid) < bestD) {
          bestD = Math.abs(c - mid);
          best = i;
        }
        if (reduced) return;
        f.style.transform = `perspective(1200px) rotateY(${-d * 18}deg) scale(${1 - ad * 0.12})`;
        f.style.opacity = String(1 - ad * 0.45);
        f.style.zIndex = String(100 - Math.round(ad * 100));
      });
      if (label.current) {
        const fr = FRAMES[best];
        label.current.textContent = `${fr.event} · ${String(best + 1).padStart(2, "0")} / ${FRAMES.length}`;
      }
    };

    const loop = () => {
      if (!dragging) {
        x += v;
        v *= 0.93;
        if (x < 0) {
          x += (0 - x) * 0.2;
          v *= 0.5;
        }
        if (x > max()) {
          x += (max() - x) * 0.2;
          v *= 0.5;
        }
      }
      paint();
      if (dragging || Math.abs(v) > 0.05 || x < -0.5 || x > max() + 0.5) raf = requestAnimationFrame(loop);
      else raf = 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const down = (e: PointerEvent) => {
      dragging = true;
      moved = 0;
      lastX = e.clientX;
      v = 0;
      w.setPointerCapture(e.pointerId);
      w.style.cursor = "grabbing";
      kick();
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      moved += Math.abs(dx);
      x -= dx;
      v = -dx;
    };
    const up = (e: PointerEvent) => {
      dragging = false;
      w.style.cursor = "";
      try {
        w.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      kick();
    };
    const wheel = (e: WheelEvent) => {
      // horizontal trackpad swipes move the reel; vertical wheel keeps scrolling the page
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        v = e.deltaX * 0.35;
        kick();
      }
    };
    const click = (e: MouseEvent) => {
      if (moved > 6) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    w.addEventListener("pointerdown", down);
    w.addEventListener("pointermove", move);
    w.addEventListener("pointerup", up);
    w.addEventListener("pointercancel", up);
    w.addEventListener("wheel", wheel, { passive: false });
    w.addEventListener("click", click, true);
    const ro = new ResizeObserver(() => paint());
    ro.observe(w);
    paint();
    // a small hint of motion when it first appears
    let tw: gsap.core.Tween | null = null;
    if (!reduced) {
      const o = { x: 0 };
      tw = gsap.fromTo(o, { x: 0 }, { x: Math.min(160, max()), duration: 2.2, ease: "power3.out", delay: 0.4, onUpdate: () => ((x = o.x), paint()), scrollTrigger: { trigger: w, start: "top 80%", once: true } });
    }
    return () => {
      cancelAnimationFrame(raf);
      tw?.kill();
      ro.disconnect();
      w.removeEventListener("pointerdown", down);
      w.removeEventListener("pointermove", move);
      w.removeEventListener("pointerup", up);
      w.removeEventListener("pointercancel", up);
      w.removeEventListener("wheel", wheel);
      w.removeEventListener("click", click, true);
    };
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <span ref={label} className="kicker text-stone/60">
          {FRAMES[0].event}
        </span>
        <span className="kicker hidden text-stone/40 md:block">Drag the reel &larr; &rarr;</span>
      </div>
      <div ref={wrap} className="relative -mx-6 cursor-grab touch-pan-y select-none overflow-hidden py-6 md:-mx-10" aria-label="Life at Runwal photos" role="region">
        <div ref={track} className="flex w-max gap-4 px-[12vw] will-change-transform md:gap-6 md:px-[30vw]">
          {FRAMES.map((f, i) => (
            <figure key={f.src} className="relative w-[68vw] shrink-0 origin-center md:w-[30vw]">
              <div className="relative aspect-[565/360] overflow-hidden bg-graphite-2">
                <Pic src={f.src} alt={`${f.event}, photo ${f.k + 1}`} fill sizes="(min-width: 768px) 30vw, 68vw" className="pointer-events-none" />
              </div>
              <figcaption className="kicker mt-3 flex justify-between text-stone/50">
                <span>{f.event}</span>
                <span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        {/* sprocket holes */}
        <div className="pointer-events-none absolute inset-x-0 top-1 h-2 bg-[radial-gradient(circle,rgba(238,235,229,0.14)_2px,transparent_2.5px)] bg-[length:18px_8px]" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 bottom-1 h-2 bg-[radial-gradient(circle,rgba(238,235,229,0.14)_2px,transparent_2.5px)] bg-[length:18px_8px]" aria-hidden />
      </div>
    </div>
  );
}
