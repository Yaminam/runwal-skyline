"use client";

import { useMemo, useState } from "react";
import { INVESTORS } from "@/lib/coverage";

function Mark({ text, q }: { text: string; q: string }) {
  const t = q.trim();
  if (!t) return <>{text}</>;
  const i = text.toLowerCase().indexOf(t.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-amber/40 text-inherit">{text.slice(i, i + t.length)}</mark>
      {text.slice(i + t.length)}
    </>
  );
}

/**
 * The investor library as a vault of filing drawers. Each category is a drawer front with its count;
 * pulling it slides the drawer out and the files rise into view one by one. Searching opens every
 * drawer that holds a match and closes the rest.
 */
export function DocVault() {
  const [open, setOpen] = useState<string | null>(INVESTORS.docs[0]?.group ?? null);
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const groups = useMemo(
    () =>
      INVESTORS.docs.map((g) => ({
        ...g,
        hits: query ? g.items.filter((it) => it.label.toLowerCase().includes(query)) : g.items,
      })),
    [query],
  );
  const total = groups.reduce((a, g) => a + g.hits.length, 0);

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <p className="kicker text-mute">
          {String(INVESTORS.docs.length).padStart(2, "0")} drawers &middot; {String(total).padStart(2, "0")} {query ? "matching" : ""} files
        </p>
        <label className="flex items-center gap-3 border-b border-graphite/30 py-2 md:w-80">
          <span className="kicker text-mute">Search the vault</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. annual report" className="w-full bg-transparent text-sm outline-none placeholder:text-mute/70" />
        </label>
      </div>

      <div className="mt-8 [perspective:1400px]">
        {groups.map((g, gi) => {
          const isOpen = query ? g.hits.length > 0 : open === g.group;
          const hidden = query && g.hits.length === 0;
          return (
            <div key={g.group} className={`transition-[opacity] duration-500 ${hidden ? "opacity-30" : ""}`}>
              {/* drawer front */}
              <button
                type="button"
                onClick={() => !query && setOpen(isOpen ? null : g.group)}
                aria-expanded={isOpen}
                style={{ transform: isOpen ? "translateY(-2px) rotateX(-7deg)" : undefined }}
                className={`group relative flex w-full items-center gap-4 border border-graphite/15 bg-paper px-5 py-5 text-left transition-[transform,box-shadow,background-color] duration-700 ease-[var(--ease-out-expo)] [transform-origin:50%_0%] md:px-8 md:py-6 ${
                  isOpen ? "z-10 bg-white shadow-[0_24px_40px_-24px_rgba(22,24,27,0.45)]" : "hover:bg-white"
                } ${gi > 0 ? "-mt-px" : ""}`}
              >
                <span className="kicker w-8 text-mute">{String(gi + 1).padStart(2, "0")}</span>
                <span className="title flex-1 text-2xl md:text-3xl">{g.group}</span>
                {/* the handle */}
                <span className="hidden h-2 w-24 rounded-full bg-graphite/15 transition-colors group-hover:bg-amber/70 md:block" aria-hidden />
                <span className="kicker w-20 text-right tabular-nums text-graphite-2">
                  {String(g.hits.length).padStart(2, "0")} files
                </span>
                <span className={`text-lg transition-transform duration-500 ${isOpen ? "rotate-45 text-amber-deep" : "text-mute"}`} aria-hidden>
                  +
                </span>
              </button>

              {/* drawer body */}
              <div className={`grid transition-[grid-template-rows] duration-700 ease-[var(--ease-out-expo)] ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                  <ul className="border-x border-b border-graphite/10 bg-[linear-gradient(180deg,rgba(22,24,27,0.05),transparent_2rem)] px-3 pb-3 pt-2 md:px-6">
                    {g.hits.map((d, i) => (
                      <li
                        key={d.url}
                        style={{ transitionDelay: isOpen ? `${120 + i * 45}ms` : "0ms" }}
                        className={`transition-[opacity,transform] duration-500 ease-[var(--ease-out-expo)] ${isOpen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
                      >
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group/f grid grid-cols-[auto_1fr_auto] items-center gap-4 border-t border-graphite/10 px-2 py-3.5 first:border-t-0"
                        >
                          {/* file tab */}
                          <span className="flex h-9 w-7 items-end justify-center border border-graphite/20 bg-white pb-1 text-[0.55rem] font-medium uppercase tracking-wider text-mute transition-colors group-hover/f:border-amber group-hover/f:text-amber-deep">
                            {d.url.endsWith(".mp4") ? "AV" : "PDF"}
                          </span>
                          <span className="text-[0.98rem] transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover/f:translate-x-1.5">
                            <Mark text={d.label} q={q} />
                          </span>
                          <span className="kicker text-dusk">Open &#8599;</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
        {query && total === 0 ? <p className="border border-t-0 border-graphite/15 px-6 py-6 text-sm text-mute">Nothing in the vault matches that search.</p> : null}
      </div>
    </div>
  );
}
