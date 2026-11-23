"use client";

import { useState } from "react";
import { CAREERS, OPENINGS } from "@/lib/coverage";

const DEPTS = ["All", ...Array.from(new Set(OPENINGS.map((o) => o.dept.replace(/ \(.*\)$/, ""))))];

/** Current openings, filterable by department, with a live count. */
export function Openings() {
  const [dept, setDept] = useState("All");
  const shown = OPENINGS.filter((o) => dept === "All" || o.dept.replace(/ \(.*\)$/, "") === dept);
  return (
    <div>
      <div className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 md:mx-0 md:flex-wrap md:px-0">
        {DEPTS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDept(d)}
            className={`shrink-0 border px-4 py-2.5 text-sm transition-colors ${dept === d ? "border-graphite bg-graphite text-stone" : "border-graphite/15 text-graphite-2 hover:border-graphite/50"}`}
          >
            {d}
          </button>
        ))}
      </div>
      <p className="kicker mt-6 text-mute">{String(shown.length).padStart(2, "0")} open roles</p>
      <ul className="mt-4">
        {shown.map((o, i) => (
          <li key={o.role + o.location + i} className="grid gap-x-6 gap-y-1 border-t border-graphite/15 py-5 md:grid-cols-[1fr_11rem_8rem_auto] md:items-baseline">
            <span>
              <span className="title block text-lg md:text-xl">{o.role}</span>
              <span className="kicker mt-1 block text-mute">
                {o.dept}
                {o.qualification ? ` · ${o.qualification}` : ""}
              </span>
            </span>
            <span className="text-sm text-graphite-2">{o.location}</span>
            <span className="kicker text-mute">{o.experience}</span>
            <a href={CAREERS.apply} target="_blank" rel="noreferrer" className="kicker text-dusk md:text-right">
              Apply &#8599;
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
