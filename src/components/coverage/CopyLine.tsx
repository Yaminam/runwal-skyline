"use client";

import { useState } from "react";

/** A contact line with a link and a small "copy" action that confirms in place. */
export function CopyLine({ label, value, href }: { label: string; value: string; href?: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-graphite/15 py-5">
      <span className="kicker text-mute">{label}</span>
      <span className="flex items-baseline gap-4">
        {href ? (
          <a href={href} className="title ulink text-xl md:text-2xl">
            {value}
          </a>
        ) : (
          <span className="title text-xl md:text-2xl">{value}</span>
        )}
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(value).then(() => {
              setDone(true);
              setTimeout(() => setDone(false), 1600);
            });
          }}
          className={`kicker transition-colors ${done ? "text-dusk" : "text-mute hover:text-graphite"}`}
          aria-label={`Copy ${label}`}
        >
          {done ? "Copied" : "Copy"}
        </button>
      </span>
    </div>
  );
}
