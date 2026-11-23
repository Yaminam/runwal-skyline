"use client";

import gsap from "gsap";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SECTIONS } from "@/lib/site-sections";
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
    // sections can change tone without scrolling (time-of-day scrubbers), so re-probe gently
    const poll = setInterval(onScroll, 400);
    check();
    return () => {
      clearInterval(poll);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  // close the menu whenever the route changes (adjusting state during render, not in an effect)
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

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
        <div className="flex h-20 items-center justify-between px-6 md:h-24 md:px-10">
          <TLink href="/" className="flex items-center gap-3" aria-label="Runwal Realty home">
            <RunwalMark className="h-14 w-auto shrink-0" />
            <RunwalWords className="h-[1.95rem] w-auto shrink-0" />
          </TLink>

          <nav className="hidden items-center gap-11 md:flex" aria-label="Primary">
            {LINKS.slice(0, 3).map((l) => (
              <TLink key={l.href} href={l.href} className={`ulink text-[0.98rem] font-medium tracking-wide ${pathname.startsWith(l.href) ? "opacity-100" : "opacity-75 hover:opacity-100"}`}>
                {l.label}
              </TLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a href="tel:02262328585" className="kicker hidden text-[0.84rem]! opacity-75 transition-opacity hover:opacity-100 lg:block">
              022 6232 8585
            </a>
            <TLink
              href="/enquire"
              className={`hidden px-7 py-4 text-[0.95rem] font-medium transition-colors md:inline-flex ${light ? "bg-stone text-graphite hover:bg-amber" : "bg-graphite text-stone hover:bg-dusk"}`}
            >
              Book a visit
            </TLink>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="flex h-11 items-center gap-3 md:pl-2"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              <span className="hidden text-[0.95rem] font-medium md:inline">{open ? "Close" : "Menu"}</span>
              <span className="relative flex size-11 items-center justify-center">
                <span className={`absolute h-px w-6 bg-current transition-transform duration-500 ${open ? "rotate-45" : "-translate-y-1"}`} />
                <span className={`absolute h-px w-6 bg-current transition-transform duration-500 ${open ? "-rotate-45" : "translate-y-1"}`} />
              </span>
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div
          data-nav-skip
          data-lenis-prevent
          className="fixed inset-0 z-[45] overflow-y-auto bg-graphite text-stone"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          onClickCapture={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          <div className="blueprint-dark pointer-events-none absolute inset-0 opacity-50" aria-hidden />
          <div className="relative grid min-h-full gap-12 px-6 pb-10 pt-28 md:grid-cols-12 md:gap-10 md:px-10 md:pt-36">
            <nav className="flex flex-col gap-1 md:col-span-5" aria-label="Main">
              {LINKS.map((l) => (
                <span key={l.href} className="overflow-hidden">
                  <TLink href={l.href} className="mn-item group flex items-baseline gap-4 py-1">
                    <span className="kicker text-amber">{l.n}</span>
                    <span className="display text-5xl transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:translate-x-3 md:text-[min(5.4vw,6.4rem)]">{l.label}</span>
                  </TLink>
                </span>
              ))}
              <div className="mn-fade mt-10 flex flex-col gap-2 text-sm text-stone/70">
                <a href="tel:02262328585" className="ulink self-start">
                  Sales 022 6232 8585
                </a>
                <a href="mailto:corporate@runwal.com" className="ulink self-start">
                  corporate@runwal.com
                </a>
              </div>
            </nav>
            <div className="mn-fade grid grid-cols-2 gap-x-6 gap-y-10 self-end md:col-span-6 md:col-start-7 md:grid-cols-3">
              {SECTIONS.map((g) => (
                <div key={g.id}>
                  <p className="kicker text-stone/40">{g.title}</p>
                  <ul className="mt-4 flex flex-col gap-2.5">
                    {g.links.map((l) => (
                      <li key={l.label}>
                        <TLink href={l.href} className="ulink text-[0.98rem] text-stone/85 hover:text-stone">
                          {l.label}
                        </TLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
