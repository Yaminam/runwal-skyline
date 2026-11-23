"use client";

import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { CSR } from "@/lib/coverage";
import { whenRevealed } from "@/lib/gate";
import { clamp, prefersReducedMotion } from "@/lib/motion";

const COLS = 12;
const ROWS = 6;

function makeTiles() {
  let s = 2016;
  const r = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  return Array.from({ length: COLS * ROWS }, (_, i) => {
    const c = i % COLS;
    const row = Math.floor(i / COLS);
    // pieces near the centre land first
    const dist = Math.hypot(c - (COLS - 1) / 2, (row - (ROWS - 1) / 2) * 1.6) / 7;
    return { c, row, delay: clamp(dist * 0.55 + r() * 0.25), dx: (r() - 0.5) * 260, dy: (r() - 0.3) * 220, rot: (r() - 0.5) * 50 };
  });
}
const TILES = makeTiles();

/**
 * One photograph assembled tile by tile: as you scroll, scattered pieces fly in, turn square and
 * lock into place, and the full picture of the work appears with the closing line.
 */
export function CsrMosaic() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const els = el.querySelectorAll<HTMLElement>("[data-tile]");
    const line = el.querySelector<HTMLElement>("[data-line]");
    const whole = el.querySelector<HTMLElement>("[data-whole]");
    const render = (p: number) => {
      els.forEach((t, i) => {
        const d = TILES[i];
        const k = clamp((p - d.delay * 0.7) / 0.3);
        const e = 1 - Math.pow(1 - k, 3);
        t.style.transform = `translate(${d.dx * (1 - e)}%, ${d.dy * (1 - e)}%) rotate(${d.rot * (1 - e)}deg) scale(${0.6 + 0.415 * e})`;
        t.style.opacity = String(clamp(k * 2));
      });
      // once every piece is home, the seamless photo settles over the tiles
      if (whole) whole.style.opacity = String(clamp((p - 0.9) / 0.08));
      if (line) {
        const a = clamp((p - 0.82) / 0.15);
        line.style.opacity = String(a);
        line.style.transform = `translateY(${(1 - a) * 20}px)`;
      }
    };
    if (prefersReducedMotion()) {
      render(1);
      return;
    }
    render(0);
    let st: ScrollTrigger | null = null;
    const cancel = whenRevealed(() => {
      st = ScrollTrigger.create({ trigger: el, start: "top 85%", end: "bottom 70%", scrub: 0.5, onUpdate: (x) => render(x.progress) });
    });
    return () => {
      cancel();
      st?.kill();
    };
  }, []);

  return (
    <section ref={root} className="overflow-hidden bg-stone px-6 py-24 md:px-10 md:py-32" aria-label="The work, assembled">
      <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="kicker text-dusk">Piece by piece</p>
          <h2 className="display mt-4 text-[11vw] md:text-[min(5vw,6rem)]">
            Change, <span className="accent normal-case">assembled</span>
          </h2>
        </div>
        <p className="max-w-sm text-[0.95rem] leading-relaxed text-graphite-2">Learning and healthcare, delivered in small parts that add up. Scroll to put the picture together.</p>
      </div>
      <div className="relative aspect-[1800/858] w-full" role="img" aria-label="Runwal Realty CSR, photo assembled from tiles">
        <div className="grid h-full w-full" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}>
          {TILES.map((t, i) => (
            <span
              key={i}
              data-tile
              className="block will-change-transform"
              style={{
                backgroundImage: `url(${CSR.banner})`,
                backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
                backgroundPosition: `${(t.c / (COLS - 1)) * 100}% ${(t.row / (ROWS - 1)) * 100}%`,
                opacity: 0,
              }}
            />
          ))}
        </div>
        <div data-whole className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-0" style={{ backgroundImage: `url(${CSR.banner})` }} aria-hidden />
      </div>
      <p data-line className="title mt-10 max-w-3xl text-2xl opacity-0 md:text-4xl">
        {CSR.title}: <span className="accent">meaningful change where it matters most.</span>
      </p>
    </section>
  );
}
