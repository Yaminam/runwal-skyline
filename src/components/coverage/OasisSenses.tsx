"use client";

import { useState } from "react";
import { OASIS } from "@/lib/coverage";
import { Pic } from "../site/Pic";

/** The six expressions of belonging: pick one and the large image cross-fades to it. */
export function OasisSenses() {
  const [i, setI] = useState(0);
  const cur = OASIS.expressions[i];
  return (
    <div className="grid gap-8 md:grid-cols-12 md:gap-10">
      <ul className="md:col-span-5" role="tablist" aria-label="Six expressions of belonging">
        {OASIS.expressions.map((e, k) => (
          <li key={e.k}>
            <button
              type="button"
              role="tab"
              aria-selected={i === k}
              onMouseEnter={() => setI(k)}
              onFocus={() => setI(k)}
              onClick={() => setI(k)}
              className="grid w-full grid-cols-[2.5rem_1fr] items-baseline gap-3 border-t border-stone/15 py-5 text-left"
            >
              <span className={`kicker ${i === k ? "text-amber" : "text-stone/40"}`}>0{k + 1}</span>
              <span>
                <span className={`title block text-3xl transition-[opacity,transform] duration-700 ease-[var(--ease-out-expo)] md:text-4xl ${i === k ? "translate-x-2 opacity-100" : "opacity-45"}`}>{e.k}</span>
                <span className={`block overflow-hidden text-sm text-stone/70 transition-[max-height,opacity] duration-700 ${i === k ? "mt-2 max-h-16 opacity-100" : "max-h-0 opacity-0"}`}>{e.text}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="relative aspect-[4/3] overflow-hidden bg-graphite-2 md:col-span-7">
        {OASIS.expressions.map((e, k) => (
          <div key={e.k} className={`absolute inset-0 transition-[opacity,transform] duration-[1.1s] ease-[var(--ease-out-expo)] ${i === k ? "scale-100 opacity-100" : "scale-[1.05] opacity-0"}`}>
            <Pic src={e.image} alt={`${e.k} at Club Oasis`} fill sizes="(min-width: 768px) 58vw, 100vw" />
          </div>
        ))}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/60 to-transparent p-5 text-white">
          <span className="title text-2xl">{cur.k}</span>
          <span className="kicker text-white/80">Artist impression</span>
        </div>
      </div>
    </div>
  );
}
