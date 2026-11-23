"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FAQ_CATEGORIES, FAQS } from "@/lib/coverage";
import { useReducedMotion } from "@/lib/motion";
import { getLenis } from "../SmoothScroll";

// One scraped answer has the source site's footer glued onto it; cut anything from the footer on.
const clean = (a: string) => a.split(/ About Us \+ /)[0].trim();
const ALL = FAQS.map((f) => ({ ...f, a: clean(f.a) }));

// The questions people ask first, picked by topic from the published FAQs.
const MOST_ASKED = [
  /when was runwal realty founded/i,
  /managing director of runwal realty/i,
  /rera/i,
  /relationship between runwal realty and the erstwhile/i,
  /ipo/i,
  /club oasis/i,
  /r ?loyalist/i,
  /key residential projects/i,
]
  .map((re) => ALL.find((f) => re.test(f.q)))
  .filter((f): f is (typeof ALL)[number] => Boolean(f))
  .filter((f, i, arr) => arr.findIndex((x) => x.q === f.q) === i);

function Mark({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-amber/40 text-inherit">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

/** The concierge "types" the answer, quickly: whole thing in well under a second. */
function Typed({ text, play }: { text: string; play: boolean }) {
  const [n, setN] = useState(play ? 0 : text.length);
  useEffect(() => {
    if (!play) return;
    let raf = 0;
    const t0 = performance.now();
    const total = Math.min(700, 180 + text.length * 1.1);
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / total);
      setN(Math.round(text.length * (1 - Math.pow(1 - k, 2))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [text, play]);
  const done = n >= text.length;
  return (
    <>
      {text.slice(0, n)}
      {!done && <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.15em] animate-pulse bg-amber" aria-hidden />}
      {/* full text for assistive tech from the first frame */}
      <span className="sr-only">{done ? "" : text}</span>
    </>
  );
}

/** Every FAQ published across runwalrealty.com: live search, topic chips with live counts, a most-asked strip, keyboard friendly. */
export function FaqSearch() {
  const reduced = useReducedMotion();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [open, setOpen] = useState<string | null>(ALL[0]?.q ?? null);
  const [typedFor, setTypedFor] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const term = q.trim().toLowerCase();

  const matches = useMemo(() => (term ? ALL.filter((f) => (f.q + " " + f.a).toLowerCase().includes(term)) : ALL), [term]);
  const counts = useMemo(() => Object.fromEntries(FAQ_CATEGORIES.map((c) => [c, matches.filter((f) => f.cat === c).length])), [matches]);
  const shown = matches.filter((f) => cat === "All" || f.cat === cat);

  const toggle = (question: string) => {
    const next = open === question ? null : question;
    setOpen(next);
    setTypedFor(next);
  };

  const jumpTo = (question: string, category: string) => {
    setQ("");
    setCat(category);
    setOpen(question);
    setTypedFor(question);
    requestAnimationFrame(() => {
      const btn = list.current?.querySelector<HTMLButtonElement>(`[data-q="${CSS.escape(question)}"]`);
      if (!btn) return;
      const y = btn.getBoundingClientRect().top + window.scrollY - 140;
      const l = getLenis();
      if (l) l.scrollTo(y, { duration: 1.1 });
      else window.scrollTo({ top: y, behavior: "smooth" });
      btn.focus({ preventScroll: true });
    });
  };

  // "/" focuses search from anywhere on the page
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !/input|textarea/i.test(t.tagName)) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // arrow keys move between questions
  const onListKey = (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const btns = [...(list.current?.querySelectorAll<HTMLButtonElement>("button[data-q]") ?? [])];
    const i = btns.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    const j = e.key === "Home" ? 0 : e.key === "End" ? btns.length - 1 : Math.max(0, Math.min(btns.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)));
    btns[j]?.focus();
  };

  return (
    <div>
      {/* most asked */}
      <div className="mb-14">
        <div className="flex items-end justify-between gap-4">
          <p className="kicker text-dusk">Most asked</p>
          <p className="kicker hidden text-mute md:block">Swipe &middot; tap one to open it below</p>
        </div>
        <ul className="no-scrollbar -mx-6 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2 md:-mx-10 md:px-10">
          {MOST_ASKED.map((f, i) => (
            <li key={f.q} className="snap-start">
              <button
                type="button"
                onClick={() => jumpTo(f.q, f.cat)}
                className="group flex h-full w-[16rem] flex-col justify-between gap-6 border border-graphite/15 bg-paper p-5 text-left transition-[border-color,transform,background-color] duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:border-graphite hover:bg-stone md:w-[19rem] md:p-6"
              >
                <span className="flex items-center justify-between">
                  <span className="kicker text-amber-deep">0{i + 1}</span>
                  <span className="kicker text-mute">{f.cat}</span>
                </span>
                <span className="title text-lg leading-snug md:text-xl">{f.q}</span>
                <span className="kicker text-mute transition-colors group-hover:text-graphite">Ask &rarr;</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <label className="flex items-center gap-4 border-b-2 border-graphite py-4">
        <span className="kicker text-mute">Search</span>
        <input
          ref={input}
          value={q}
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            // if the chosen topic has nothing for the new search, widen to all topics
            const t = v.trim().toLowerCase();
            if (cat !== "All" && t && !ALL.some((f) => f.cat === cat && (f.q + " " + f.a).toLowerCase().includes(t))) setCat("All");
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setQ("");
            if (e.key === "ArrowDown") {
              e.preventDefault();
              list.current?.querySelector<HTMLButtonElement>("button[data-q]")?.focus();
            }
          }}
          placeholder="IPO, Club Oasis, Worli, RERA..."
          className="title w-full min-w-0 bg-transparent text-2xl outline-none placeholder:text-mute/50 md:text-4xl"
          aria-describedby="faq-hint"
        />
        <span className="kicker hidden shrink-0 border border-graphite/20 px-2 py-1 text-mute md:inline" aria-hidden>
          /
        </span>
        <span className="kicker shrink-0 tabular-nums text-mute">{shown.length}</span>
      </label>
      <p id="faq-hint" className="sr-only">
        Press slash to search, arrow keys to move between questions, Enter to open, Escape to clear.
      </p>

      <div className="no-scrollbar -mx-6 mt-6 flex gap-2 overflow-x-auto px-6 md:mx-0 md:flex-wrap md:px-0" role="tablist" aria-label="Topics">
        {["All", ...FAQ_CATEGORIES].map((c) => {
          const n = c === "All" ? matches.length : counts[c];
          const on = cat === c;
          return (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setCat(c)}
              disabled={!on && n === 0}
              className={`relative flex shrink-0 items-center gap-2 overflow-hidden border px-4 py-2.5 text-sm transition-[color,border-color,opacity] duration-300 disabled:opacity-35 ${
                on ? "border-graphite text-stone" : "border-graphite/15 text-graphite-2 hover:border-graphite/50"
              }`}
            >
              <span className={`absolute inset-0 origin-left bg-graphite transition-transform duration-500 ease-[var(--ease-out-expo)] ${on ? "scale-x-100" : "scale-x-0"}`} aria-hidden />
              <span className="relative">{c}</span>
              <span key={n} className={`kicker relative inline-block tabular-nums animate-[faq-pop_.4s_ease-out] ${on ? "text-amber" : "text-mute"}`}>
                {n}
              </span>
            </button>
          );
        })}
      </div>
      <style>{`@keyframes faq-pop { from { transform: translateY(-40%); opacity: 0 } to { transform: none; opacity: 1 } } @media (prefers-reduced-motion: reduce) { [class*="faq-pop"] { animation: none !important } }`}</style>

      <ul ref={list} className="mt-10" onKeyDown={onListKey}>
        {shown.slice(0, 80).map((f) => {
          const on = open === f.q || !!term;
          return (
            <li key={f.q} className="border-t border-graphite/15">
              <button
                type="button"
                data-q={f.q}
                onClick={() => toggle(f.q)}
                aria-expanded={on}
                className="group flex w-full items-start justify-between gap-6 py-5 text-left outline-none focus-visible:bg-paper"
              >
                <span>
                  <span className="kicker block text-dusk">{f.cat}</span>
                  <span className="title mt-2 block text-lg leading-snug transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1 md:text-2xl">
                    <Mark text={f.q} q={q.trim()} />
                  </span>
                </span>
                <span
                  className={`mt-6 flex size-8 shrink-0 items-center justify-center rounded-full border text-lg transition-[transform,background-color,color,border-color] duration-500 ${
                    on ? "rotate-45 border-graphite bg-graphite text-stone" : "border-graphite/20"
                  }`}
                  aria-hidden
                >
                  +
                </span>
              </button>
              <div className={`grid transition-[grid-template-rows] duration-500 ease-[var(--ease-out-expo)] ${on ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                  {on && (
                    <div className="flex max-w-3xl gap-4 pb-7">
                      <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-amber/20 font-mono text-[0.65rem] text-amber-deep" aria-hidden>
                        R
                      </span>
                      <p className="text-[0.95rem] leading-relaxed text-graphite-2">
                        {term ? <Mark text={f.a} q={q.trim()} /> : <Typed key={f.q} text={f.a} play={!reduced && typedFor === f.q} />}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
        {shown.length > 80 ? <li className="kicker border-t border-graphite/15 py-5 text-mute">Showing 80 of {shown.length}. Narrow the search to see more.</li> : null}
        {shown.length === 0 ? (
          <li className="border-t border-graphite/15 py-8">
            <p className="title text-2xl">No answer for that yet.</p>
            <p className="mt-2 text-sm text-mute">Try another word, or write to corporate@runwal.com.</p>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
