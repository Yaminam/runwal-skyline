"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { CONVICTIONS, PHILOSOPHY, PILLARS } from "@/lib/company";
import { prefersReducedMotion } from "@/lib/motion";

/** Philosophy statement and the five Pillars of Excellence as an accordion that opens like a drawer. */
export function Pillars() {
  const [open, setOpen] = useState(0);
  const bodies = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    bodies.current.forEach((b, i) => {
      if (!b) return;
      const on = i === open;
      if (prefersReducedMotion()) {
        b.style.height = on ? "auto" : "0px";
        return;
      }
      gsap.to(b, { height: on ? "auto" : 0, duration: 0.9, ease: "expo.out", overwrite: true });
    });
  }, [open]);

  return (
    <section className="bg-stone px-6 py-28 md:px-10 md:py-40">
      <div className="grid gap-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="kicker" data-fade>
            Our philosophy
          </p>
          {/* always three lines: sized so the widest line ("Building for") fits the column */}
          <h2 className="display mt-6 whitespace-nowrap text-[9.4vw] md:text-[min(3.9vw,4.9rem)]" data-split>
            Building for
            <br />
            <span className="accent normal-case">generations</span>
            <br />
            to come
          </h2>
          <p className="mt-10 max-w-md text-[1.02rem] leading-relaxed text-graphite-2" data-fade>
            {PHILOSOPHY[0]}
          </p>
          <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-mute" data-fade>
            {PHILOSOPHY[1]}
          </p>
          <ul className="mt-10 flex flex-wrap gap-2" data-fade>
            {CONVICTIONS.map((c) => (
              <li key={c} className="kicker border border-graphite/20 px-3 py-2">
                {c}
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-6 md:col-start-7">
          <p className="kicker mb-6 text-mute" data-fade>
            Pillars of excellence
          </p>
          <ul className="border-t border-graphite/15" data-fade>
            {PILLARS.map((p, i) => {
              const on = i === open;
              return (
                <li key={p.title} className="border-b border-graphite/15">
                  <button
                    type="button"
                    onClick={() => setOpen(i)}
                    onMouseEnter={() => window.matchMedia("(pointer: fine)").matches && setOpen(i)}
                    aria-expanded={on}
                    className="group flex w-full items-center gap-6 py-6 text-left"
                  >
                    <span className={`kicker w-8 transition-colors duration-500 ${on ? "text-dusk" : "text-mute"}`}>{String(i + 1).padStart(2, "0")}</span>
                    <span className={`title flex-1 text-2xl transition-all duration-700 md:text-[2.1rem] ${on ? "translate-x-2" : "text-graphite/45 group-hover:text-graphite"}`}>{p.title}</span>
                    <span className={`relative size-4 transition-transform duration-700 ${on ? "rotate-45" : ""}`} aria-hidden>
                      <span className="absolute left-0 top-1/2 h-px w-full bg-current" />
                      <span className="absolute left-1/2 top-0 h-full w-px bg-current" />
                    </span>
                  </button>
                  <div
                    ref={(el) => {
                      bodies.current[i] = el;
                    }}
                    className="overflow-hidden"
                    style={{ height: i === 0 ? "auto" : 0 }}
                  >
                    <p className="max-w-lg pb-8 pl-14 text-[0.98rem] leading-relaxed text-graphite-2">{p.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
