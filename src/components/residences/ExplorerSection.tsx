"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Project } from "@/lib/projects";
import type { Band } from "../three/TowerExplorer";

const TowerExplorer = dynamic(() => import("../three/TowerExplorer"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse bg-stone-2" />,
});

/** Indicative stacking: podium + amenity levels at the base, configurations stacked smallest to largest, rooftop club on top. */
function makeBands(p: Project): Band[] {
  const n = p.floors;
  const podium = Math.max(2, Math.round(n * 0.12));
  const roof = 1;
  const homes = p.configs;
  const span = n - podium - roof;
  const per = Math.max(1, Math.floor(span / homes.length));
  const bands: Band[] = [{ label: p.kind === "Commercial" ? "Lobby & podium" : "Podium & amenities", detail: "Arrival, parking and club levels", from: 1, to: podium, residential: false }];
  homes.forEach((c, i) => {
    const from = podium + 1 + i * per;
    const to = i === homes.length - 1 ? n - roof : from + per - 1;
    bands.push({ label: c.label, detail: c.carpet, from, to, residential: true });
  });
  bands.push({ label: p.kind === "Commercial" ? "Terrace" : "Rooftop club", detail: "Open-air amenities", from: n, to: n, residential: false });
  return bands;
}

export function ExplorerSection({ project }: { project: Project }) {
  const bands = useMemo(() => makeBands(project), [project]);
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [activeBand, setActiveBand] = useState<number | null>(null);
  const [night, setNight] = useState(false);
  const [active, setActive] = useState(false);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "120px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const focus = hovered ?? selected;
  const focusBand = focus ? bands.findIndex((b) => focus >= b.from && focus <= b.to) : activeBand;
  const fb = focusBand !== null && focusBand >= 0 ? bands[focusBand] : null;

  return (
    <section className="px-6 py-28 md:px-10 md:py-36" aria-labelledby="explore-h">
      <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="kicker mb-6 text-dusk" data-fade>
            Tower explorer &middot; {project.floors} levels
          </p>
          <h2 id="explore-h" className="display max-w-[14ch] text-[11vw] md:text-[min(5.6vw,6.6rem)]" data-split>
            Find your <span className="accent">floor</span>
          </h2>
        </div>
        <p className="max-w-sm text-[0.95rem] leading-relaxed text-graphite-2" data-fade>
          Drag to turn the tower. Hover a level, or pick a configuration to see where it sits. Switch to night to see it lit.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
        {/* configurations */}
        <div className="flex flex-col gap-3" role="list" aria-label="Configurations">
          {bands.map((b, i) =>
            b.residential ? (
              <button
                key={b.label}
                type="button"
                role="listitem"
                aria-pressed={activeBand === i}
                onMouseEnter={() => setActiveBand(i)}
                onFocus={() => setActiveBand(i)}
                onClick={() => {
                  setActiveBand(i);
                  setSelected(Math.round((b.from + b.to) / 2));
                }}
                className={`group relative overflow-hidden border p-6 text-left transition-colors duration-500 ${
                  activeBand === i ? "border-graphite bg-graphite text-stone" : "border-graphite/15 bg-paper hover:border-graphite/40"
                }`}
              >
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className={`kicker ${activeBand === i ? "text-amber" : "text-mute"}`}>
                      Levels {b.from}&ndash;{b.to}
                    </p>
                    <p className="title mt-3 text-3xl">{b.label}</p>
                  </div>
                  <span className={`mt-1 size-3 shrink-0 transition-colors ${activeBand === i ? "bg-dusk-soft" : "bg-graphite/15"}`} />
                </div>
                <p className={`mt-5 border-t pt-4 text-sm ${activeBand === i ? "border-stone/20 text-stone/80" : "border-graphite/10 text-graphite-2"}`}>
                  Carpet {b.detail}
                </p>
              </button>
            ) : null,
          )}
          <p className="kicker mt-3 flex items-center gap-4 text-mute">
            <span className="flex items-center gap-2"><span className="size-2 bg-dusk" /> Configuration</span>
            <span className="flex items-center gap-2"><span className="size-2 bg-amber" /> Level in focus</span>
          </p>
          <p className="kicker leading-relaxed text-mute">Indicative stacking for illustration only. Refer to MahaRERA-registered plans.</p>
        </div>

        {/* stage */}
        <div ref={stage} className={`relative h-[70vh] min-h-[32rem] overflow-hidden border transition-colors duration-700 ${night ? "border-night bg-night" : "border-graphite/10 bg-stone"}`}>
          <TowerExplorer
            floors={project.floors}
            bands={bands}
            hovered={hovered}
            selected={selected}
            activeBand={activeBand}
            night={night}
            wide={project.kind === "Commercial"}
            active={active}
            onHover={setHovered}
            onSelect={(f) => setSelected((s) => (s === f ? null : f))}
          />

          {/* HUD */}
          <div className={`pointer-events-none absolute left-5 top-5 transition-colors duration-700 md:left-7 md:top-7 ${night ? "text-stone" : "text-graphite"}`}>
            <p className="kicker opacity-60">Level</p>
            <p className="title mt-1 text-6xl tabular-nums md:text-7xl">
              {focus ? String(focus).padStart(2, "0") : "--"}
              <span className="text-2xl opacity-40"> / {project.floors}</span>
            </p>
            <div className="mt-4 h-px w-40 bg-current opacity-20" />
            <p className="mt-4 text-sm font-medium">{fb ? fb.label : "Hover the tower"}</p>
            <p className="kicker mt-1.5 opacity-60">{fb ? fb.detail : project.name}</p>
          </div>

          <button
            type="button"
            onClick={() => setNight((n) => !n)}
            aria-pressed={night}
            className={`absolute right-5 top-5 flex items-center gap-3 border px-4 py-2.5 text-[0.78rem] font-medium transition-colors duration-500 md:right-7 md:top-7 ${
              night ? "border-stone/25 text-stone hover:border-amber" : "border-graphite/20 bg-stone/70 text-graphite backdrop-blur hover:border-graphite"
            }`}
          >
            <span className={`relative h-4 w-8 shrink-0 rounded-full transition-colors duration-500 ${night ? "bg-amber" : "bg-graphite/20"}`}>
              <span className={`absolute left-0.5 top-0.5 size-3 rounded-full bg-paper transition-transform duration-500 ${night ? "translate-x-4" : "translate-x-0"}`} />
            </span>
            {night ? "Night" : "Day"}
          </button>

          {/* legend */}
          <div className={`absolute bottom-5 left-5 right-5 flex flex-wrap gap-2 md:bottom-7 md:left-7 ${night ? "text-stone" : "text-graphite"}`}>
            {bands.map((b, i) => (
              <button
                key={b.label + i}
                type="button"
                onClick={() => setActiveBand((a) => (a === i ? null : i))}
                className={`kicker border px-2.5 py-1.5 backdrop-blur transition-colors ${
                  activeBand === i ? "border-dusk bg-dusk text-stone" : night ? "border-stone/20 hover:border-stone/60" : "border-graphite/15 bg-stone/60 hover:border-graphite/50"
                }`}
              >
                {b.from === b.to ? `L${b.from}` : `L${b.from}–${b.to}`} &middot; {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
