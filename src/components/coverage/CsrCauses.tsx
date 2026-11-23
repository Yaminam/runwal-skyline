"use client";

import { useState } from "react";
import { CSR } from "@/lib/coverage";
import { Pic } from "../site/Pic";

/**
 * The two causes as a split screen. Hovering (or tapping) one side widens it and pulls its story
 * forward while the other side recedes, so the page reads like choosing where to look.
 */
export function CsrCauses() {
  const [open, setOpen] = useState(0);

  return (
    <section data-tone="dark" className="bg-graphite text-stone" aria-label="Focus areas">
      <div className="flex flex-col md:h-[86svh] md:flex-row">
        {CSR.areas.map((a, i) => {
          const on = open === i;
          return (
            <button
              key={a.key}
              type="button"
              onMouseEnter={() => setOpen(i)}
              onFocus={() => setOpen(i)}
              onClick={() => setOpen(i)}
              aria-expanded={on}
              className={`group relative flex min-h-[70svh] flex-col justify-end overflow-hidden text-left transition-[flex-grow] duration-[1.1s] ease-[var(--ease-out-expo)] md:min-h-0 ${
                on ? "md:grow-[1.8]" : "md:grow"
              } md:basis-0`}
            >
              <div className={`absolute inset-0 transition-[transform,filter] duration-[1.4s] ease-[var(--ease-out-expo)] ${on ? "scale-100" : "scale-110 md:grayscale"}`}>
                <Pic src={a.image} alt={a.title} fill sizes="(min-width: 768px) 65vw, 100vw" />
              </div>
              <div className={`absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 transition-opacity duration-700 ${on ? "opacity-90" : "opacity-100"}`} />
              <div className="relative p-6 md:p-10">
                <p className="kicker text-amber">
                  0{i + 1} &middot; {a.key === "education" ? "Education" : "Healthcare"}
                </p>
                <h2 className="display mt-4 text-[11vw] md:text-[min(4.6vw,5.6rem)]">{a.title}</h2>
                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-700 ease-[var(--ease-out-expo)] ${
                    on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[1fr] opacity-100 md:grid-rows-[0fr] md:opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="mt-5 max-w-xl leading-relaxed text-stone/80">{a.text}</p>
                    <ul className="mt-6 flex flex-wrap gap-2">
                      {a.groups.map((g) => (
                        <li key={g} className="kicker border border-stone/25 px-3 py-2 text-stone/80">
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
