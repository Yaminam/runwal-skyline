"use client";

import { useState } from "react";
import { OASIS } from "@/lib/coverage";
import { PROJECTS } from "@/lib/projects";
import { Pic } from "../../site/Pic";
import { TLink } from "../../site/Transition";

const ROWS = OASIS.places.map((p) => ({ ...p, image: PROJECTS.find((x) => x.slug === p.slug)?.images.card ?? null }));

/**
 * The five communities that each have their own Club Oasis. Desktop: tall panels in a row, the hovered
 * one opens wide to show the render and its area. Mobile: a stack of rows with a thumbnail.
 */
export function OasisCommunities() {
  const [on, setOn] = useState(0);
  return (
    <div>
      {/* desktop accordion row */}
      <ul className="hidden h-[34rem] gap-2 md:flex" onMouseLeave={() => setOn(0)}>
        {ROWS.map((r, k) => {
          const open = on === k;
          return (
            <li
              key={r.slug}
              onMouseEnter={() => setOn(k)}
              className={`relative overflow-hidden bg-graphite transition-[flex-grow] duration-[900ms] ease-[var(--ease-out-expo)] ${open ? "grow-[5]" : "grow"}`}
              style={{ flexBasis: 0 }}
            >
              <TLink href={`/residences/${r.slug}`} className="group absolute inset-0 block" onFocus={() => setOn(k)}>
                {r.image && (
                  <div className={`absolute inset-0 transition-[transform,filter] duration-[1.2s] ease-[var(--ease-out-expo)] ${open ? "scale-100 grayscale-0" : "scale-110 grayscale"}`}>
                    <Pic src={r.image} alt={r.name} fill sizes="60vw" />
                  </div>
                )}
                <div className={`absolute inset-0 transition-colors duration-700 ${open ? "bg-gradient-to-t from-black/75 via-black/10 to-transparent" : "bg-night/70"}`} />
                <span className="kicker absolute left-5 top-5 text-amber">0{k + 1}</span>
                {/* closed: vertical name */}
                <span className={`absolute inset-x-0 bottom-6 flex justify-center transition-opacity duration-500 ${open ? "opacity-0" : "opacity-100"}`}>
                  <span className="title rotate-180 whitespace-nowrap text-2xl text-stone [writing-mode:vertical-rl]">{r.name.replace("Runwal ", "")}</span>
                </span>
                {/* open: details */}
                <div className={`absolute inset-x-6 bottom-6 text-white transition-[opacity,transform] duration-700 ease-[var(--ease-out-expo)] ${open ? "translate-y-0 opacity-100 delay-200" : "translate-y-4 opacity-0"}`}>
                  <p className="kicker text-white/75">{r.area}</p>
                  <p className="title mt-2 whitespace-nowrap text-4xl">{r.name}</p>
                  <p className="kicker mt-4 inline-flex items-center gap-2 border-b border-amber pb-1 text-amber">Visit the residence &rarr;</p>
                </div>
              </TLink>
            </li>
          );
        })}
      </ul>

      {/* mobile stack */}
      <ul className="md:hidden">
        {ROWS.map((r, k) => (
          <li key={r.slug} className="border-t border-stone/15 last:border-b">
            <TLink href={`/residences/${r.slug}`} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-4 py-4">
              <span className="relative block aspect-square overflow-hidden bg-graphite">{r.image && <Pic src={r.image} alt={r.name} fill sizes="88px" />}</span>
              <span>
                <span className="kicker block text-amber">0{k + 1}</span>
                <span className="title mt-1 block text-xl">{r.name.replace("Runwal ", "")}</span>
                <span className="kicker mt-1 block text-stone/50">{r.area}</span>
              </span>
              <span className="text-stone/60">&rarr;</span>
            </TLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
