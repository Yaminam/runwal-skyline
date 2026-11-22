"use client";

import gsap from "gsap";
import { useRef, useState } from "react";
import { PROJECTS, REGIONS } from "@/lib/projects";
import { Pic } from "../site/Pic";
import { TLink } from "../site/Transition";

const GROUPS = REGIONS.map((r) => {
  const list = PROJECTS.filter((p) => p.region === r);
  return { region: r, list, image: list[0]?.images.hero };
}).filter((g) => g.list.length > 0);

/** Choose a part of the city: hovering a row cross-fades the large render and lists what's there. */
export function Regions() {
  const [active, setActive] = useState(0);
  const frame = useRef<HTMLDivElement>(null);

  const pick = (i: number) => {
    if (i === active) return;
    setActive(i);
    if (frame.current) gsap.fromTo(frame.current, { clipPath: "inset(6% 6% 6% 6%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "expo.out" });
  };

  return (
    <section className="relative bg-stone px-6 py-28 md:px-10 md:py-40">
      <div className="mb-16 grid gap-6 md:grid-cols-12">
        <p className="kicker text-dusk md:col-span-3">Find your address</p>
        <h2 className="display text-[11vw] md:col-span-9 md:text-[min(6vw,7rem)]">
          Five cities <span className="accent normal-case">within</span> a city
        </h2>
      </div>

      <div className="grid gap-10 md:grid-cols-12">
        <ul className="md:col-span-6" onMouseLeave={() => undefined}>
          {GROUPS.map((g, i) => (
            <li key={g.region} className="border-t border-graphite/15 last:border-b">
              <TLink
                href={`/residences?region=${encodeURIComponent(g.region)}`}
                onMouseEnter={() => pick(i)}
                onFocus={() => pick(i)}
                className="group grid grid-cols-[3rem_1fr_auto] items-baseline gap-4 py-6 md:py-7"
              >
                <span className={`kicker transition-colors ${active === i ? "text-amber-deep" : "text-mute"}`}>{String(i + 1).padStart(2, "0")}</span>
                <span className={`title text-3xl transition-[transform,opacity] duration-700 ease-[var(--ease-out-expo)] md:text-5xl ${active === i ? "translate-x-3 opacity-100" : "opacity-45"}`}>
                  {g.region}
                </span>
                <span className="kicker text-mute">
                  {g.list.length} {g.list.length === 1 ? "residence" : "residences"}
                </span>
                <span
                  className={`col-start-2 col-end-4 overflow-hidden text-sm text-graphite-2 transition-[max-height,opacity] duration-700 ease-[var(--ease-out-expo)] ${
                    active === i ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  {g.list.map((p) => p.name.replace("Runwal ", "")).join(" · ")}
                </span>
              </TLink>
            </li>
          ))}
        </ul>

        <div className="md:col-span-6">
          <div ref={frame} className="relative aspect-[4/3] overflow-hidden bg-stone-2 md:sticky md:top-28">
            {GROUPS.map((g, i) =>
              g.image ? (
                <div
                  key={g.region}
                  className={`absolute inset-0 transition-[opacity,transform] duration-[1.2s] ease-[var(--ease-out-expo)] ${active === i ? "scale-100 opacity-100" : "scale-[1.06] opacity-0"}`}
                >
                  <Pic src={g.image} alt={`${g.list[0].name}, ${g.region}`} fill sizes="(min-width: 768px) 50vw, 100vw" />
                </div>
              ) : null,
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/60 to-transparent p-6 text-white">
              <span className="title text-2xl">{GROUPS[active].list[0].name}</span>
              <span className="kicker text-white/80">{GROUPS[active].list[0].area}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
