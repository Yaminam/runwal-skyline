"use client";

import { useEffect, useState } from "react";

const CITIES = [
  { city: "Mumbai", tz: "Asia/Kolkata" },
  { city: "Dubai", tz: "Asia/Dubai" },
  { city: "Singapore", tz: "Asia/Singapore" },
  { city: "London", tz: "Europe/London" },
  { city: "New York", tz: "America/New_York" },
  { city: "Sydney", tz: "Australia/Sydney" },
];

function partsIn(tz: string, d: Date) {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false, weekday: "short" });
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  return { h: parseInt(p.hour, 10) % 24, m: parseInt(p.minute, 10), wd: p.weekday };
}

/**
 * Where you are, and what time it is in Mumbai: live analogue dials for the cities NRI buyers often
 * write from, plus the gap between your own clock and Mumbai's.
 */
export function WorldClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);

  // offset between the visitor's clock and Mumbai (IST is UTC+5:30)
  const gap = now ? 330 + now.getTimezoneOffset() : 0;
  const gapText =
    gap === 0 ? "You are on Mumbai time" : `Mumbai is ${Math.floor(Math.abs(gap) / 60)}h${Math.abs(gap) % 60 ? ` ${Math.abs(gap) % 60}m` : ""} ${gap > 0 ? "ahead of" : "behind"} you`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone/15 pb-5">
        <p className="kicker text-stone/60">Your time, our time</p>
        <p className="kicker flex items-center gap-2">
          <span className="live-dot inline-block size-1.5 rounded-full bg-amber" />
          {now ? gapText : " "}
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-px bg-stone/10 md:grid-cols-6">
        {CITIES.map((c) => {
          const t = now ? partsIn(c.tz, now) : null;
          const hAng = t ? ((t.h % 12) + t.m / 60) * 30 : 0;
          const mAng = t ? t.m * 6 : 0;
          const night = t ? t.h < 7 || t.h >= 19 : false;
          return (
            <li key={c.city} className={`flex flex-col items-center gap-4 bg-graphite px-4 py-8 ${c.city === "Mumbai" ? "md:bg-graphite-2" : ""}`}>
              <svg viewBox="0 0 100 100" className="size-24 md:size-28" aria-hidden>
                <circle cx="50" cy="50" r="46" fill={night ? "#0d1015" : "#f7f5f1"} stroke="rgba(238,235,229,.25)" />
                {Array.from({ length: 12 }, (_, i) => (
                  <line
                    key={i}
                    x1="50"
                    y1="8"
                    x2="50"
                    y2={i % 3 === 0 ? 15 : 12}
                    stroke={night ? "rgba(238,235,229,.5)" : "rgba(22,24,27,.45)"}
                    strokeWidth={i % 3 === 0 ? 2 : 1}
                    transform={`rotate(${i * 30} 50 50)`}
                  />
                ))}
                <line x1="50" y1="50" x2="50" y2="28" stroke={night ? "#eeebe5" : "#16181b"} strokeWidth="3.5" strokeLinecap="round" transform={`rotate(${hAng} 50 50)`} style={{ transition: "transform 1s" }} />
                <line x1="50" y1="50" x2="50" y2="16" stroke={night ? "#eeebe5" : "#16181b"} strokeWidth="2" strokeLinecap="round" transform={`rotate(${mAng} 50 50)`} style={{ transition: "transform 1s" }} />
                <circle cx="50" cy="50" r="3" fill="#f2a65a" />
              </svg>
              <div className="text-center">
                <p className={`title text-lg ${c.city === "Mumbai" ? "text-amber" : ""}`}>{c.city}</p>
                <p className="kicker mt-1 tabular-nums text-stone/60">{t ? `${String(t.h).padStart(2, "0")}:${String(t.m).padStart(2, "0")} · ${t.wd}` : "--:--"}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
