"use client";

import { ChalkboardTeacher, ChatsCircle, Devices, Lightning, Megaphone, UserFocus } from "@phosphor-icons/react";
import { useState } from "react";
import { SPECIALISTS } from "@/lib/coverage";

const ICONS = [ChatsCircle, UserFocus, Lightning, Devices, ChalkboardTeacher, Megaphone];

/** The Specialists' six benefits as tiles: the hovered (or tapped) one fills with amber from below. */
export function SpecialistTiles() {
  const [on, setOn] = useState<number | null>(null);
  return (
    <ul className="grid grid-cols-2 gap-px bg-stone/10 lg:grid-cols-3" onMouseLeave={() => setOn(null)}>
      {SPECIALISTS.benefits.map((b, i) => {
        const Icon = ICONS[i] ?? Lightning;
        const active = on === i;
        return (
          <li key={b.title} className="relative">
            <button
              type="button"
              onMouseEnter={() => setOn(i)}
              onFocus={() => setOn(i)}
              onClick={() => setOn(active ? null : i)}
              aria-pressed={active}
              className="group relative flex h-full min-h-[13rem] w-full flex-col justify-between overflow-hidden bg-graphite p-5 text-left md:min-h-[15rem] md:p-7"
            >
              <span
                className={`absolute inset-0 origin-bottom bg-amber transition-transform duration-700 ease-[var(--ease-out-expo)] ${active ? "scale-y-100" : "scale-y-0"}`}
                aria-hidden
              />
              <span className="relative flex items-start justify-between">
                <span className={`kicker transition-colors duration-500 ${active ? "text-graphite" : "text-amber"}`}>0{i + 1}</span>
                <Icon
                  weight="light"
                  className={`size-9 transition-[transform,color] duration-700 ease-[var(--ease-out-expo)] md:size-11 ${active ? "-translate-y-1 rotate-[-8deg] text-graphite" : "text-stone/60"}`}
                />
              </span>
              <span className="relative">
                <span className={`title block text-lg leading-tight transition-colors duration-500 md:text-xl ${active ? "text-graphite" : "text-stone"}`}>{b.title}</span>
                <span className={`mt-2 block text-sm transition-colors duration-500 ${active ? "text-graphite/75" : "text-stone/55"}`}>{b.line}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
