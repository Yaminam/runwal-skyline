"use client";

import { useEffect, useRef, useState } from "react";
import { LOYALIST } from "@/lib/coverage";
import { RunwalMark } from "../../site/BrandLogo";

/**
 * The R Loyalist membership card: brushed graphite metal with a holographic amber sheen that follows
 * the cursor, tilts in 3D, flips on click to show the programme on its back. The member's name (typed
 * in the calculator) is engraved on the front.
 */
export function MemberCard({ name }: { name: string }) {
  const card = useRef<HTMLDivElement>(null);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const el = card.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    let raf = 0;
    let t = 0;
    const set = (x: number, y: number) => {
      el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
      el.style.setProperty("--rx", `${((0.5 - y) * 16).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${((x - 0.5) * 22).toFixed(2)}deg`);
    };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      set((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    };
    const leave = () => set(0.5, 0.5);
    // touch screens: a slow idle shimmer instead of cursor tracking
    const idle = () => {
      t += 0.012;
      set(0.5 + Math.sin(t) * 0.35, 0.5 + Math.cos(t * 0.8) * 0.25);
      raf = requestAnimationFrame(idle);
    };
    if (fine) {
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
    } else raf = requestAnimationFrame(idle);
    leave();
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  const shown = name.trim() || "Your name here";

  return (
    <div className="[perspective:1400px]">
      <div
        ref={card}
        role="button"
        tabIndex={0}
        aria-label={flipped ? "Show the front of the R Loyalist card" : "Flip the R Loyalist card"}
        onClick={() => setFlipped((f) => !f)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setFlipped((f) => !f);
          }
        }}
        className="relative mx-auto aspect-[1.586] w-full max-w-[34rem] cursor-pointer select-none outline-none transition-transform duration-300 ease-out [transform-style:preserve-3d]"
        style={{ transform: "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))" }}
      >
        <div
          className="absolute inset-0 transition-transform duration-[900ms] ease-[var(--ease-out-expo)] [transform-style:preserve-3d]"
          style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          {/* front */}
          <div className="absolute inset-0 overflow-hidden rounded-[1.1rem] shadow-[0_40px_80px_-30px_rgba(13,16,21,.65),0_0_0_1px_rgba(255,255,255,.06)_inset] [backface-visibility:hidden]">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#2b2e33_0%,#16181b_45%,#23262b_100%)]" />
            <div className="absolute inset-0 opacity-40 [background:repeating-linear-gradient(90deg,rgba(255,255,255,.035)_0px,rgba(255,255,255,.035)_1px,transparent_1px,transparent_3px)]" />
            {/* holographic sheen */}
            <div
              className="absolute inset-0 mix-blend-screen"
              style={{
                background:
                  "radial-gradient(26% 40% at var(--mx,50%) var(--my,50%), rgba(255,226,190,.22), rgba(242,166,90,.08) 45%, transparent 72%), linear-gradient(115deg, transparent 20%, rgba(138,160,240,.10) calc(var(--mx,50%) - 12%), rgba(242,166,90,.16) var(--mx,50%), rgba(155,111,214,.10) calc(var(--mx,50%) + 12%), transparent 80%)",
              }}
            />
            <div className="relative flex h-full flex-col justify-between p-[6%] text-stone">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <RunwalMark className="h-10 w-auto text-amber md:h-12" />
                  <div>
                    <p className="title text-lg tracking-wide md:text-xl">R Loyalist</p>
                    <p className="kicker text-[0.6rem] text-stone/50">Runwal Realty</p>
                  </div>
                </div>
                {/* chip */}
                <span className="block h-9 w-12 rounded-md bg-[linear-gradient(135deg,#f6c58e,#c98a43_55%,#f2a65a)] shadow-inner [background-size:100%_100%] md:h-10 md:w-14">
                  <span className="m-[18%] block h-[64%] rounded-sm border border-black/25" />
                </span>
              </div>
              <div>
                <p className="kicker text-[0.6rem] text-stone/45">Distinguished member</p>
                <p
                  className={`title mt-1 truncate text-2xl tracking-[0.06em] md:text-[2.1rem] ${name.trim() ? "text-stone" : "text-stone/35"}`}
                  style={{ textShadow: "0 1px 0 rgba(255,255,255,.18), 0 -1px 0 rgba(0,0,0,.6)" }}
                >
                  {shown}
                </p>
                <div className="mt-3 flex items-end justify-between">
                  <p className="font-mono text-xs tracking-[0.3em] text-stone/55">RL&nbsp;&nbsp;1978&nbsp;&nbsp;2026</p>
                  <p className="kicker text-[0.6rem] text-amber">Tap to flip</p>
                </div>
              </div>
            </div>
          </div>

          {/* back */}
          <div className="absolute inset-0 flex flex-col overflow-hidden rounded-[1.1rem] bg-[linear-gradient(135deg,#1d2025,#0d1015)] text-stone shadow-[0_40px_80px_-30px_rgba(13,16,21,.65)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="mt-[6%] h-[13%] w-full shrink-0 bg-black/70" />
            <div className="grid flex-1 grid-cols-3 gap-[4%] px-[6%] pt-[5%]">
              {LOYALIST.benefits.map((b) => (
                <div key={b.k} className="border-t border-stone/15 pt-[8%]">
                  <span className="display block text-[clamp(1.6rem,7vw,3rem)] leading-none text-amber md:text-[clamp(1.6rem,3.4vw,3rem)]">{b.pct}%</span>
                  <span className="kicker mt-2 block text-[0.6rem] text-stone">{b.k}</span>
                </div>
              ))}
            </div>
            <p className="kicker flex shrink-0 flex-wrap justify-between gap-x-4 gap-y-1 px-[6%] pb-[5%] text-[0.55rem] text-stone/50">
              <span>{LOYALIST.email}</span>
              <span>{LOYALIST.phone}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
