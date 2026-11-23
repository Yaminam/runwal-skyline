"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { whenRevealed } from "@/lib/gate";
import { prefersReducedMotion } from "@/lib/motion";

const LINE =
  "Forty-eight years ago, Subhash Runwal built one home in Thane. Today the name stands on 35 finished landmarks across Mumbai, Thane and Pune, and every one was built to be handed down.";

// Runwal Developers Limited DRHP (filed with SEBI, September 2025); figures as of 30 June 2025.
const STATS = [
  { n: 1978, label: "First Runwal home, Thane", fmt: (v: number) => String(Math.round(v)) },
  { n: 35, label: "Projects completed", fmt: (v: number) => String(Math.round(v)) },
  { n: 17, label: "Developments under way", fmt: (v: number) => String(Math.round(v)) },
  { n: 11.22, label: "Mn sq ft handed over", fmt: (v: number) => v.toFixed(2) },
  { n: 24, label: "Upcoming projects", fmt: (v: number) => String(Math.round(v)) },
];

/** The brand line lights up word by word as you read, then the record counts up underneath. */
export function Manifesto() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const nums = el.querySelectorAll<HTMLElement>("[data-count]");
    if (prefersReducedMotion()) return;
    let ctx: gsap.Context | null = null;
    const cancel = whenRevealed(() => {
      ctx = gsap.context(() => {
        gsap.fromTo(
          el.querySelectorAll(".mf-word"),
          { opacity: 0.14 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.05,
            scrollTrigger: { trigger: el.querySelector(".mf-line"), start: "top 80%", end: "bottom 45%", scrub: 0.5 },
          },
        );
        nums.forEach((n, i) => {
          const s = STATS[i];
          const o = { v: s.n === 1978 ? 1900 : 0 };
          gsap.to(o, {
            v: s.n,
            duration: 2.2,
            ease: "power3.out",
            scrollTrigger: { trigger: n, start: "top 90%", once: true },
            onUpdate: () => {
              n.textContent = s.fmt(o.v);
            },
          });
        });
      }, el);
    });
    return () => {
      cancel();
      ctx?.revert();
    };
  }, []);

  return (
    <section ref={root} className="relative bg-stone px-6 pb-28 pt-32 md:px-10 md:pb-40 md:pt-48">
      <div className="mb-14 flex flex-col gap-2 border-b border-graphite/15 pb-5 md:flex-row md:items-center md:justify-between">
        <p className="kicker">The Runwal record</p>
        <p className="kicker text-mute">Est. 1978 &middot; Sion, Mumbai</p>
      </div>

      <p className="mf-line title max-w-[68rem] text-[2rem] leading-[1.08] md:text-[3.9rem]">
        {LINE.split(" ").map((w, i) => (
          <span key={i} className="mf-word inline-block pr-[0.26em]">
            {w}
          </span>
        ))}
      </p>

      <dl className="mt-24 grid grid-cols-2 gap-x-6 gap-y-12 md:mt-32 md:grid-cols-5">
        {STATS.map((s) => (
          <div key={s.label} data-fade className="border-t border-graphite/15 pt-5">
            <dd className="title text-5xl tabular-nums md:text-[4.2rem]">
              <span data-count>{s.fmt(s.n)}</span>
            </dd>
            <dt className="kicker mt-3 text-mute">{s.label}</dt>
          </div>
        ))}
      </dl>
      <p className="kicker mt-10 text-mute/80">Source: Runwal Developers Ltd. DRHP, filed with SEBI, Sept 2025 (as of 30 June 2025)</p>
    </section>
  );
}
