"use client";

import { useState } from "react";
import { LOYALIST } from "@/lib/coverage";

const fmt = (rupees: number) => {
  if (rupees >= 1e7) return `₹${(rupees / 1e7).toFixed(2).replace(/\.?0+$/, "")} Cr`;
  return `₹${(rupees / 1e5).toFixed(1).replace(/\.0$/, "")} lakh`;
};

/**
 * Indicative R Loyalist benefits, from the programme's published percentages
 * (2% loyalty on a repeat booking, 1% each to referrer and referred). Pick a home value and see it.
 */
export function LoyaltyCalculator({ name, onName }: { name?: string; onName?: (v: string) => void } = {}) {
  const [value, setValue] = useState(3); // crore
  const [mode, setMode] = useState<"refer" | "repeat">("refer");
  const rupees = value * 1e7;
  const rows =
    mode === "refer"
      ? [
          { who: "You, the referrer", pct: 1 },
          { who: "Your friend or relative", pct: 1 },
        ]
      : [{ who: "You, on your next booking", pct: 2 }];

  return (
    <div className="border border-graphite/15 bg-paper p-6 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="kicker text-dusk">Indicative benefit</p>
        <div className="flex border border-graphite/15 p-1" role="tablist" aria-label="Benefit type">
          {(
            [
              ["refer", "Refer someone"],
              ["repeat", "Book again"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mode === id}
              onClick={() => setMode(id)}
              className={`px-4 py-2 text-sm transition-colors ${mode === id ? "bg-graphite text-stone" : "text-graphite-2 hover:text-graphite"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {onName && (
        <label className="mt-8 block">
          <span className="kicker text-mute">Your name, for the card</span>
          <input
            value={name ?? ""}
            onChange={(e) => onName(e.target.value.slice(0, 26))}
            placeholder="Type your name"
            autoComplete="name"
            className="title mt-2 w-full border-b border-graphite/25 bg-transparent pb-2 text-2xl outline-none placeholder:text-mute/50 focus:border-graphite"
          />
        </label>
      )}

      <label className="mt-10 block">
        <span className="flex items-baseline justify-between gap-4">
          <span className="text-sm text-graphite-2">Home value</span>
          <span className="title text-3xl tabular-nums md:text-4xl">{fmt(rupees)}</span>
        </span>
        <input
          type="range"
          min={0.5}
          max={35}
          step={0.25}
          value={value}
          onChange={(e) => setValue(parseFloat(e.target.value))}
          className="range mt-4"
          aria-label="Home value in crore"
        />
        <span className="kicker mt-1 flex justify-between text-mute">
          <span>₹50 lakh</span>
          <span>₹35 Cr</span>
        </span>
      </label>

      <ul className="mt-10">
        {rows.map((r) => (
          <li key={r.who} className="flex items-end justify-between gap-6 border-t border-graphite/15 py-5">
            <span>
              <span className="block text-[0.95rem]">{r.who}</span>
              <span className="kicker mt-1 block text-mute">{r.pct}% of the booking</span>
            </span>
            <span className="display text-[9vw] tabular-nums text-graphite md:text-5xl">{fmt((rupees * r.pct) / 100)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs leading-relaxed text-mute">
        Illustration only, using the programme&rsquo;s published percentages. Rewards are chosen from a bouquet of gifts and are subject to the
        programme&rsquo;s terms. {LOYALIST.terms}
      </p>
    </div>
  );
}
