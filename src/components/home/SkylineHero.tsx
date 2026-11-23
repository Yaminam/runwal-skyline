"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { whenRevealed } from "@/lib/gate";
import { clamp, prefersReducedMotion, smoothstep } from "@/lib/motion";
import { LANDMARKS, labels, skyline } from "../three/skyline-state";
import { Magnetic } from "../site/Magnetic";
import { TLink } from "../site/Transition";

const SkylineScene = dynamic(() => import("../three/SkylineScene"), { ssr: false });

type Chapter = { from: number; to: number; kicker: string; title: React.ReactNode; body: string; places: string };

const CHAPTERS: Chapter[] = [
  {
    from: 0.13,
    to: 0.36,
    kicker: "01 / South Mumbai",
    title: (
      <>
        An address for the city&rsquo;s <span className="accent">most powerful</span>
      </>
    ),
    body: "Malabar Hill, Worli and Wadala. Sea-facing residences in the oldest, most coveted postcodes of the city.",
    places: "Malabar Hill · Worli · Wadala",
  },
  {
    from: 0.4,
    to: 0.6,
    kicker: "02 / Western Suburbs",
    title: (
      <>
        Where the suburbs <span className="accent">grew up</span>
      </>
    ),
    body: "Andheri West and Malad. Large, light-filled homes close to work, schools and the sea.",
    places: "Andheri West · Malad",
  },
  {
    from: 0.63,
    to: 0.84,
    kicker: "03 / Thane & Mulund",
    title: (
      <>
        Where Runwal <span className="accent">began</span>
      </>
    ),
    body: "The first Runwal home was built in Thane in 1978. Today the city is home to our largest townships, by the lakes and the hills.",
    places: "Manpada · Balkum · Kolshet · Mulund",
  },
];

const REGIONS = [
  { at: 0.24, label: "South Mumbai" },
  { at: 0.5, label: "Suburbs" },
  { at: 0.74, label: "Thane" },
];

function clock(p: number) {
  // 07:10 in the morning to 22:40 at night
  const mins = 7 * 60 + 10 + p * (15 * 60 + 30);
  const h = Math.floor(mins / 60);
  const m = Math.floor(mins % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function SkylineHero() {
  const section = useRef<HTMLElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const time = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const reduced = prefersReducedMotion();
    const intro = el.querySelectorAll<HTMLElement>("[data-intro]");
    const chapters = el.querySelectorAll<HTMLElement>("[data-chapter]");
    const finale = el.querySelector<HTMLElement>("[data-finale]");

    const render = (p: number) => {
      skyline.p = p;
      if (time.current) time.current.textContent = clock(p);
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      // ink snaps (with a CSS fade) instead of passing through mid-grey, and a scrim follows the tone
      const isDark = p > 0.34;
      el.dataset.tone = isDark ? "dark" : "light";
      if (overlay.current) overlay.current.dataset.ink = isDark ? "light" : "dark";
      if (scrim.current) {
        scrim.current.style.opacity = String(0.55 + 0.45 * smoothstep(0.1, 0.4, p));
        scrim.current.dataset.ink = isDark ? "light" : "dark";
      }
      const introOut = 1 - smoothstep(0.03, 0.1, p);
      intro.forEach((n) => {
        n.style.opacity = String(introOut);
        n.style.transform = `translateY(${(1 - introOut) * -40}px)`;
        n.style.pointerEvents = introOut < 0.2 ? "none" : "";
      });
      chapters.forEach((n, i) => {
        const c = CHAPTERS[i];
        const a = smoothstep(c.from, c.from + 0.03, p) * (1 - smoothstep(c.to - 0.03, c.to, p));
        n.style.opacity = String(a);
        n.style.transform = `translateY(${(1 - a) * (p < c.from + 0.05 ? 36 : -36)}px)`;
        n.style.visibility = a < 0.01 ? "hidden" : "visible";
      });
      if (finale) {
        const a = smoothstep(0.88, 0.95, p);
        finale.style.opacity = String(a);
        finale.style.transform = `translateY(${(1 - a) * 36}px)`;
        finale.style.visibility = a < 0.01 ? "hidden" : "visible";
        finale.style.pointerEvents = a > 0.5 ? "" : "none";
      }
    };
    render(0);

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      scrub: reduced ? false : 0.6,
      onUpdate: (self) => render(clamp(self.progress)),
      onToggle: (self) => setActive(self.isActive || self.progress < 1),
    });

    const vis = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "100px" });
    vis.observe(el);

    skyline.rise = reduced ? 1 : 0;
    let tw: gsap.core.Tween | null = null;
    const cancel = whenRevealed(() => {
      if (!reduced) tw = gsap.to(skyline, { rise: 1, duration: 3.2, ease: "power2.out" });
      gsap.fromTo(
        el.querySelectorAll("[data-intro-line]"),
        { yPercent: 110 },
        { yPercent: 0, duration: 1.4, ease: "expo.out", stagger: 0.1, delay: 0.5 },
      );
      gsap.fromTo(el.querySelectorAll("[data-intro-fade]"), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", stagger: 0.08, delay: 1.1 });
    });

    return () => {
      st.kill();
      vis.disconnect();
      cancel();
      tw?.kill();
    };
  }, []);

  return (
    <section ref={section} data-tone="light" className="relative h-[620vh] bg-stone" aria-label="Runwal across Mumbai">
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        <div className="absolute inset-0">
          <SkylineScene active={active} />
        </div>

        {/* tower labels, placed every frame by the scene */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {LANDMARKS.map((l, i) => (
            <div
              key={l.slug}
              ref={(el) => {
                labels[i] = el;
              }}
              className="absolute left-0 top-0 whitespace-nowrap opacity-0 will-change-transform"
            >
              <div className="flex flex-col items-center gap-1.5">
                <span className="border border-white/25 bg-graphite/90 px-3 py-1.5 text-[11px] font-medium tracking-wide text-white">{l.name}</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white [text-shadow:0_1px_8px_rgba(0,0,0,.6)]">{l.area}</span>
                <span className="h-7 w-px bg-gradient-to-b from-amber to-transparent" />
              </div>
            </div>
          ))}
        </div>

        {/* readability scrim behind the copy (bottom-left), stone by day and graphite by night */}
        <div
          ref={scrim}
          data-ink="dark"
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-[background] duration-700 data-[ink=dark]:bg-[linear-gradient(to_top_right,rgba(238,235,229,0.92)_0%,rgba(238,235,229,0.55)_32%,rgba(238,235,229,0)_58%)] data-[ink=light]:bg-[linear-gradient(to_top_right,rgba(10,12,16,0.85)_0%,rgba(10,12,16,0.5)_32%,rgba(10,12,16,0)_60%)]"
        />

        <div ref={overlay} data-ink="dark" className="pointer-events-none absolute inset-0 text-graphite transition-colors duration-500 data-[ink=light]:text-stone">
          {/* intro */}
          <div data-intro className="pointer-events-auto absolute inset-x-6 bottom-10 md:inset-x-10 md:bottom-14">
            <p data-intro-fade className="kicker mb-6 flex items-center gap-3 opacity-0">
              <span className="live-dot inline-block size-1.5 rounded-full bg-amber" /> Runwal Realty &middot; Building Mumbai since 1978
            </p>
            <h1 className="display text-[15vw] md:text-[min(10.5vw,12.5rem)]">
              <span className="-mb-[0.18em] block overflow-hidden pb-[0.18em]">
                <span data-intro-line className="block">
                  Built for
                </span>
              </span>
              <span className="-mb-[0.28em] -ml-[0.2em] block overflow-hidden pb-[0.28em] pl-[0.2em]">
                <span data-intro-line className="block">
                  <span className="accent normal-case">generations</span>.
                </span>
              </span>
            </h1>
            <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <p data-intro-fade className="max-w-md text-[0.95rem] leading-relaxed opacity-0">
                Homes, offices and city landmarks across Mumbai, Thane and Pune. Scroll to fly over the Runwal skyline, from morning to night.
              </p>
              <div data-intro-fade className="flex items-center gap-3 opacity-0">
                <Magnetic>
                  <TLink href="/residences" className="group inline-flex items-center gap-3 bg-graphite px-6 py-4 text-sm font-medium text-stone transition-colors hover:bg-dusk">
                    Explore residences
                    <span className="transition-transform duration-500 group-hover:translate-x-1">&rarr;</span>
                  </TLink>
                </Magnetic>
                <TLink href="/enquire" className="border border-graphite/25 px-6 py-4 text-sm font-medium backdrop-blur-sm transition-colors hover:border-graphite">
                  Book a site visit
                </TLink>
              </div>
            </div>
          </div>

          {/* chapters */}
          {CHAPTERS.map((c) => (
            <div key={c.kicker} data-chapter className="invisible absolute bottom-24 left-6 max-w-xl opacity-0 md:bottom-28 md:left-10">
              <p className="kicker mb-5 text-amber">{c.kicker}</p>
              <h2 className="title text-4xl md:text-6xl">{c.title}</h2>
              <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed opacity-80">{c.body}</p>
              <p className="kicker mt-6 opacity-70">{c.places}</p>
            </div>
          ))}

          {/* finale */}
          <div data-finale className="invisible absolute inset-x-6 bottom-24 opacity-0 md:inset-x-10 md:bottom-28">
            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="kicker mb-5 text-amber">Every light, a family home</p>
                <h2 className="display text-[11vw] md:text-[min(5.6vw,6.6rem)]">
                  35 delivered.
                  <br />
                  <span className="dusk-text">17 rising.</span>
                </h2>
              </div>
              <TLink href="/residences" className="pointer-events-auto group inline-flex items-center gap-3 self-start bg-amber px-6 py-4 text-sm font-medium text-graphite transition-colors hover:bg-stone md:self-end">
                See every Runwal address
                <span className="transition-transform duration-500 group-hover:translate-x-1">&rarr;</span>
              </TLink>
            </div>
          </div>

          {/* data credit for the real buildings, coastline and roads */}
          <p className="kicker absolute right-6 top-[10.25rem] hidden text-right text-[0.58rem]! opacity-45 md:right-10 md:top-[11.5rem] md:block">Buildings &amp; map data &copy; OpenStreetMap contributors</p>

          {/* HUD */}
          <div className="absolute right-6 top-24 hidden flex-col items-end gap-1 text-right md:right-10 md:top-28 md:flex" data-intro-fade>
            <span className="kicker opacity-60">Mumbai &middot; local time</span>
            <span ref={time} className="title text-3xl tabular-nums">
              07:10
            </span>
          </div>
          <div className="absolute inset-x-6 bottom-6 md:inset-x-10 md:bottom-8" data-intro-fade>
            <div className="relative h-px w-full bg-current/20">
              <div ref={bar} className="dusk-line absolute inset-0 origin-left scale-x-0" />
              {REGIONS.map((r) => (
                <span key={r.label} className="kicker absolute top-3 hidden -translate-x-1/2 opacity-60 md:block" style={{ left: `${r.at * 100}%` }}>
                  {r.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
