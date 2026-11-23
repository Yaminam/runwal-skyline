"use client";

import { useMemo, useState } from "react";
import { INVESTORS } from "@/lib/coverage";

/** The investor document library: filter by group or type to search across every published file. */
export function DocLibrary() {
  const [group, setGroup] = useState<string>("All");
  const [q, setQ] = useState("");
  const all = useMemo(() => INVESTORS.docs.flatMap((g) => g.items.map((it) => ({ ...it, group: g.group }))), []);
  const shown = all.filter((d) => (group === "All" || d.group === group) && d.label.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 md:mx-0 md:flex-wrap md:px-0">
          {["All", ...INVESTORS.docs.map((g) => g.group)].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGroup(g)}
              className={`shrink-0 border px-4 py-2.5 text-sm transition-colors ${group === g ? "border-graphite bg-graphite text-stone" : "border-graphite/15 text-graphite-2 hover:border-graphite/50"}`}
            >
              {g}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-3 border-b border-graphite/30 py-2 md:w-72">
          <span className="kicker text-mute">Find</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. annual report" className="w-full bg-transparent text-sm outline-none placeholder:text-mute/70" />
        </label>
      </div>
      <p className="kicker mt-6 text-mute">
        {String(shown.length).padStart(2, "0")} documents
      </p>
      <ul className="mt-4">
        {shown.map((d) => (
          <li key={d.url}>
            <a href={d.url} target="_blank" rel="noreferrer" className="group grid grid-cols-[1fr_auto] items-baseline gap-4 border-t border-graphite/15 py-4 md:grid-cols-[10rem_1fr_auto]">
              <span className="kicker hidden text-mute md:block">{d.group}</span>
              <span className="text-[0.98rem] transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1.5">{d.label}</span>
              <span className="kicker text-dusk">{d.url.endsWith(".mp4") ? "Video" : "PDF"} &#8599;</span>
            </a>
          </li>
        ))}
        {shown.length === 0 ? <li className="border-t border-graphite/15 py-6 text-sm text-mute">Nothing matches that search.</li> : null}
      </ul>
    </div>
  );
}
