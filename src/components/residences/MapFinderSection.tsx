"use client";

import dynamic from "next/dynamic";
import type { RealMapFinderProps } from "./RealMapFinder";

const MapFinder = dynamic(() => import("./RealMapFinder"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <span className="kicker animate-pulse text-mute">Loading the city&hellip;</span>
    </div>
  ),
});

/**
 * The Runwal map: the real city (OpenStreetMap) with every Runwal address raised as a tower.
 * It shares the filters below it: matching towers rise and glow, the rest sink into the ground.
 */
export function MapFinderSection(props: RealMapFinderProps & { count: number; total: number }) {
  const { count, total, ...map } = props;
  return (
    <div className="relative -mx-6 mb-0 h-[62svh] min-h-[26rem] overflow-hidden border-t border-graphite/10 md:-mx-10 md:h-[80svh] md:min-h-[36rem]">
      <MapFinder {...map} />

      {/* chrome */}
      <div className="pointer-events-none absolute inset-x-4 top-4 flex items-start justify-between gap-4 md:inset-x-8 md:top-6">
        <div className="max-w-[11rem] bg-stone/80 p-3 backdrop-blur-md md:max-w-none md:p-4">
          <p className="kicker flex items-center gap-3 text-graphite">
            <span className="live-dot inline-block size-1.5 rounded-full bg-amber" /> The Runwal map
          </p>
          <p className="mt-2 max-w-[18rem] text-[0.72rem] leading-relaxed text-graphite-2 md:text-[0.82rem]">
            <span className="hidden md:inline">Drag to move, right-drag to turn. Hover a tower to preview, click to fly in.</span>
            <span className="md:hidden">Two fingers to move. Tap a name to fly in.</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 bg-stone/80 p-3 text-right backdrop-blur-md md:gap-2 md:p-4">
          <p className="title text-2xl tabular-nums md:text-4xl" aria-live="polite">
            {String(count).padStart(2, "0")}
            <span className="text-mute">/{String(total).padStart(2, "0")}</span>
          </p>
          <ul className="kicker flex flex-col items-end gap-1.5 text-[0.62rem] text-mute">
            <li className="flex items-center gap-2">
              Residence <span className="inline-block size-2 bg-amber" />
            </li>
            <li className="flex items-center gap-2">
              Offices <span className="inline-block size-2 bg-[#6f86e8]" />
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
