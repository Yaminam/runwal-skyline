"use client";

import gsap from "gsap";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getLenis } from "../SmoothScroll";
import { RunwalMark, RunwalWords } from "./BrandLogo";
import { TLink } from "./Transition";

const LINKS = [
  { href: "/residences", label: "Residences", n: "01" },
  { href: "/places", label: "Places", n: "02" },
  { href: "/legacy", label: "Legacy", n: "03" },
  { href: "/enquire", label: "Enquire", n: "04" },
];

/**
 * Fixed top bar. Reads the tone of whatever sits under it (any ancestor with data-tone="dark")
 * and flips to light ink, so it stays legible over the night skyline and dark sections.
 * Hides on scroll down, returns on scroll up.
 */
export function Nav() {
  const pathname = usePathname();
  const bar = useRef<HTMLElement>(null);
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    let last = 0;
    let hidden = false;
    let raf = 0;
    const check = () => {
      raf = 0;
      const y = window.scrollY;
      // probe beneath the fixed header (skip the header itself and the menu overlay)
      const el = document
        .elementsFromPoint(window.innerWidth / 2, 36)
        .find((n) => !bar.current?.contains(n) && !n.closest("[data-nav-skip]"));
      const tone = el?.closest<HTMLElement>("[data-tone]")?.dataset.tone;
      setDark(tone === "dark");
      setSolid(y > 40 && !el?.closest("[data-tone]"));
      const down = y > last + 4;
      const up = y < last - 4;
      if (down && y > 200 && !hidden) {
        hidden = true;
        gsap.to(bar.current, { yPercent: -110, duration: 0.6, ease: "expo.out" });
      } else if (up && hidden) {
        hidden = false;
        gsap.to(bar.current, { yPercent: 0, duration: 0.6, ease: "expo.out" });
      }
      last = y;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    check();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const l = getLenis();
    if (open) l?.stop();
    else l?.start();
    if (!open) return;
    gsap.fromTo(".mn-item", { yPercent: 110 }, { yPercent: 0, duration: 1, ease: "expo.out", stagger: 0.06, delay: 0.2 });
    gsap.fromTo(".mn-fade", { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 0.5 });
  }, [open]);

  const light = dark || open;

  return (
    <>
      <header
        ref={bar}
        className={`fixed inset-x-0 top-0 z-40 transition-[color,background-color,border-color] duration-500 ${light ? "text-stone" : "text-graphite"} ${
          solid && !open ? "border-b border-graphite/10 bg-stone/80 backdrop-blur-xl" : "border-b border-transparent"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 md:h-20 md:px-10">
          <TLink href="/" className="flex items-center gap-3" aria-label="Runwal Realty home">
            <RunwalMark className="h-11 w-auto shrink-0" />
            <RunwalWords className="h-[1.5rem] w-auto shrink-0" />
          </TLink>

          <nav className="hidden items-center gap-9 md:flex" aria-label="Primary">
            {LINKS.slice(0, 3).map((l) => (
              <TLink key={l.href} href={l.href} className={`ulink text-[0.82rem] font-medium tracking-wide ${pathname.startsWith(l.href) ? "opacity-100" : "opacity-75 hover:opacity-100"}`}>
                {l.label}
              </TLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a href="tel:02262328585" className="kicker hidden opacity-75 transition-opacity hover:opacity-100 lg:block">
              022 6232 8585
            </a>
            <TLink
              href="/enquire"
              className={`hidden px-5 py-3 text-[0.8rem] font-medium transition-colors md:inline-flex ${light ? "bg-stone text-graphite hover:bg-amber" : "bg-graphite text-stone hover:bg-dusk"}`}
            >
              Book a visit
            </TLink>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="relative flex size-11 items-center justify-center md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              <span className={`absolute h-px w-6 bg-current transition-transform duration-500 ${open ? "rotate-45" : "-translate-y-1"}`} />
              <span className={`absolute h-px w-6 bg-current transition-transform duration-500 ${open ? "-rotate-45" : "translate-y-1"}`} />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[45] flex flex-col justify-between bg-graphite px-6 pb-10 pt-28 text-stone md:hidden">
          <nav className="flex flex-col gap-2" aria-label="Mobile">
            {LINKS.map((l) => (
              <span key={l.href} className="overflow-hidden">
                <TLink href={l.href} className="mn-item flex items-baseline gap-4 py-1">
                  <span className="kicker text-amber">{l.n}</span>
                  <span className="display text-5xl">{l.label}</span>
                </TLink>
              </span>
            ))}
          </nav>
          <div className="mn-fade flex flex-col gap-2 text-sm text-stone/70">
            <a href="tel:02262328585">Sales 022 6232 8585</a>
            <a href="mailto:corporate@runwal.com">corporate@runwal.com</a>
          </div>
        </div>
      )}
    </>
  );
}
