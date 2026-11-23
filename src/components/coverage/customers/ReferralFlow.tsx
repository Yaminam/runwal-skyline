"use client";

import { LOYALIST } from "@/lib/coverage";

const NODES = ["You", "R Loyalist desk", "Site visit", "Booked"];
const DUR = 6; // seconds for one referral to travel the line

const KEYFRAMES = `
@keyframes rf-run { 0% { left: 0%; opacity: 0 } 6% { opacity: 1 } 94% { opacity: 1 } 100% { left: 100%; opacity: 0 } }
@keyframes rf-run-y { 0% { top: 0%; opacity: 0 } 6% { opacity: 1 } 94% { opacity: 1 } 100% { top: 100%; opacity: 0 } }
@keyframes rf-ping { 0%, 100% { box-shadow: 0 0 0 0 rgba(242,166,90,0); background: #eeebe5 } 4% { box-shadow: 0 0 0 10px rgba(242,166,90,.25); background: #f2a65a } 14% { box-shadow: 0 0 0 0 rgba(242,166,90,0); background: #eeebe5 } }
@media (prefers-reduced-motion: reduce) { .rf-dot { display: none } .rf-node { animation: none !important } }
`;

/**
 * How to earn, as a live line: referrals travel from you, through the R Loyalist desk and the site
 * visit, to a booking; each stop lights up as a referral passes it.
 */
export function ReferralFlow() {
  return (
    <div className="relative">
      <style>{KEYFRAMES}</style>

      {/* desktop: horizontal */}
      <div className="hidden md:block">
        <div className="relative mx-[12.5%] h-px bg-graphite/20">
          {[0, 1, 2].map((k) => (
            <span
              key={k}
              className="rf-dot absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber shadow-[0_0_14px_rgba(242,166,90,.9)]"
              style={{ animation: `rf-run ${DUR}s linear ${(k * DUR) / 3}s infinite` }}
            />
          ))}
          {NODES.map((n, i) => (
            <span
              key={n}
              className="rf-node absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-graphite bg-stone"
              style={{ left: `${(i / (NODES.length - 1)) * 100}%`, animation: `rf-ping ${DUR / 3}s linear ${(i / (NODES.length - 1)) * (DUR / 3)}s infinite` }}
            />
          ))}
        </div>
        <ol className="mt-10 grid grid-cols-4 gap-6">
          {LOYALIST.steps.map((s, i) => (
            <li key={s} className="text-center" data-fade>
              <p className="kicker text-amber-deep">
                0{i + 1} &middot; {NODES[i]}
              </p>
              <p className="mx-auto mt-3 max-w-[16rem] leading-relaxed">{s}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* mobile: vertical */}
      <div className="relative pl-10 md:hidden">
        <div className="absolute bottom-3 left-3 top-3 w-px bg-graphite/20">
          {[0, 1, 2].map((k) => (
            <span
              key={k}
              className="rf-dot absolute left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber shadow-[0_0_14px_rgba(242,166,90,.9)]"
              style={{ animation: `rf-run-y ${DUR}s linear ${(k * DUR) / 3}s infinite` }}
            />
          ))}
        </div>
        <ol className="flex flex-col gap-8">
          {LOYALIST.steps.map((s, i) => (
            <li key={s} className="relative">
              <span
                className="rf-node absolute -left-[2.2rem] top-1 size-4 rounded-full border-2 border-graphite bg-stone"
                style={{ animation: `rf-ping ${DUR / 3}s linear ${(i / (NODES.length - 1)) * (DUR / 3)}s infinite` }}
              />
              <p className="kicker text-amber-deep">
                0{i + 1} &middot; {NODES[i]}
              </p>
              <p className="mt-2 leading-relaxed">{s}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
