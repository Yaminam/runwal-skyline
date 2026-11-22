"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { whenRevealed } from "@/lib/gate";
import { prefersReducedMotion } from "@/lib/motion";

type Props = {
  to: number;
  from?: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
  /** play as soon as the page is revealed instead of on scroll */
  now?: boolean;
  className?: string;
  pad?: number;
};

/** A number that counts to its value when it scrolls into view. Server-renders the final value. */
export function Counter({ to, from = 0, decimals = 0, suffix = "", duration = 2.2, now, className = "", pad = 0 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = (v: number) => {
    const s = v.toFixed(decimals);
    return (pad ? s.padStart(pad, "0") : s) + suffix;
  };

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const n = { v: from };
    el.textContent = fmt(from);
    let tw: gsap.core.Tween | null = null;
    let st: ScrollTrigger | null = null;
    const play = () => {
      tw = gsap.to(n, {
        v: to,
        duration,
        ease: "power3.out",
        onUpdate: () => {
          el.textContent = fmt(n.v);
        },
      });
    };
    const cancel = whenRevealed(() => {
      if (now) play();
      else st = ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: play });
    });
    return () => {
      cancel();
      tw?.kill();
      st?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, from, decimals, suffix, duration, now]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {fmt(to)}
    </span>
  );
}
