"use client";

import gsap from "gsap";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CONTACT, ENQUIRY_PROJECTS, RERA_NOTE, SOCIALS } from "@/lib/company";
import { prefersReducedMotion } from "@/lib/motion";
import { SECTIONS, type NavLink } from "@/lib/site-sections";
import { getLenis } from "../SmoothScroll";
import { NightSkyline } from "./NightSkyline";
import { TLink } from "./Transition";

const HOMES = ENQUIRY_PROJECTS.filter((p) => p.kind === "home");
const SKYLINE_TOWERS = HOMES.map((p) => ({ slug: p.slug, name: p.name, area: p.area }));

type Tower = { id: string; code: string; title: string; links: NavLink[]; tall?: boolean };

// The street: every section of the site is a tower, every link is a floor.
const RESIDENCES: Tower = {
  id: "residences",
  code: "R",
  title: "Residences",
  tall: true,
  links: HOMES.map((p) => ({ href: `/residences/${p.slug}`, label: p.name.replace("Runwal ", "").replace("The Central Park", "Central Park") })),
};
const STREET: Tower[] = [
  { ...SECTIONS[0], code: "M1" },
  { ...SECTIONS[1], code: "M2" },
  RESIDENCES,
  { ...SECTIONS[2], code: "M3" },
  { ...SECTIONS[3], code: "M4" },
  { ...SECTIONS[4], code: "M5" },
];

/** Live Mumbai time for the headline. */
function useMumbaiTime() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });
    const set = () => setNow(fmt.format(new Date()));
    set();
    const id = setInterval(set, 20_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/**
 * "The city is the sitemap". The footer is a street of towers standing in front of the real Mumbai
 * night skyline: each tower is a section of the site and each floor is a link. On arrival the towers
 * rise and their windows come on floor by floor; hovering a floor lights it amber and the crown glows.
 */
export function Footer() {
  const pathname = usePathname();
  const compact = pathname === "/enquire";
  const time = useMumbaiTime();
  const root = useRef<HTMLElement>(null);
  const city = useRef<HTMLDivElement>(null);
  const [riding, setRiding] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el || compact) return;
    const towers = el.querySelectorAll<HTMLElement>(".st-tower");
    const floors = Array.from(el.querySelectorAll<HTMLElement>(".st-floor"));
    if (prefersReducedMotion()) {
      floors.forEach((f) => (f.dataset.on = "1"));
      return;
    }
    const calls: gsap.core.Tween[] = [];
    const ctx = gsap.context(() => {
      gsap.set(towers, { yPercent: 104 });
      gsap
        .timeline({ scrollTrigger: { trigger: el.querySelector(".st-street"), start: "top 85%", once: true } })
        .to(towers, { yPercent: 0, duration: 1.6, ease: "expo.out", stagger: { each: 0.09, from: "center" } })
        .add(() => {
          // evening: the windows come on, lower floors first, a little out of order
          floors
            .map((f) => ({ f, k: Number(f.dataset.i) + Math.random() * 3 }))
            .sort((a, b) => a.k - b.k)
            .forEach(({ f }, i) => {
              // about two thirds of the homes are in tonight
              if (Math.random() < 0.68) calls.push(gsap.delayedCall(i * 0.03, () => (f.dataset.on = Math.random() < 0.3 ? "2" : "1")));
            });
        }, 0.6);
    }, el);

    // the far city drifts against the cursor, the street a little with it
    const fine = window.matchMedia("(pointer: fine)").matches;
    const street = el.querySelector<HTMLElement>(".st-street");
    const xBack = city.current ? gsap.quickTo(city.current, "x", { duration: 1.2, ease: "power3.out" }) : null;
    const xFront = street && window.innerWidth >= 768 ? gsap.quickTo(street, "x", { duration: 1.2, ease: "power3.out" }) : null;
    const move = (e: PointerEvent) => {
      const n = e.clientX / window.innerWidth - 0.5;
      xBack?.(n * -28);
      xFront?.(n * 10);
    };
    if (fine) el.addEventListener("pointermove", move);
    return () => {
      calls.forEach((c) => c.kill());
      ctx.revert();
      if (fine) el.removeEventListener("pointermove", move);
    };
  }, [compact]);

  const ride = () => {
    setRiding(true);
    const l = getLenis();
    if (l) l.scrollTo(0, { duration: 2.2, onComplete: () => setRiding(false) });
    else {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => setRiding(false), 1500);
    }
  };

  return (
    <footer ref={root} data-tone="dark" className="relative overflow-hidden bg-night text-stone">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[75%] bg-[radial-gradient(60%_80%_at_50%_100%,rgba(59,91,219,0.18),transparent_70%)]" aria-hidden />

      {!compact && (
        <>
          {/* headline + contact */}
          <div className="relative grid gap-10 px-6 pt-20 md:grid-cols-12 md:px-10 md:pt-28">
            <div className="md:col-span-7">
              <p className="kicker flex items-center gap-3 text-amber">
                <span className="live-dot inline-block size-1.5 rounded-full bg-amber" />
                Lights on in Mumbai {time ? <span className="tabular-nums text-stone/70">{time} IST</span> : null}
              </p>
              <h2 className="display mt-6 text-[13vw] md:text-[min(7vw,8.4rem)]">
                Every floor,
                <br />
                <span className="accent normal-case text-amber">a door.</span>
              </h2>
            </div>
            <div className="flex flex-col justify-end gap-6 md:col-span-4 md:col-start-9">
              <TLink href="/enquire" className="group flex items-center justify-between bg-stone px-6 py-5 text-[0.95rem] font-medium text-graphite transition-colors hover:bg-amber">
                Book a private site visit
                <span className="transition-transform duration-500 group-hover:translate-x-1">&rarr;</span>
              </TLink>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-[0.9rem]">
                <a href={`tel:${CONTACT.sales.replace(/-/g, "")}`} className="flex flex-col gap-1">
                  <span className="kicker text-stone/40">Sales</span>
                  <span className="ulink self-start text-stone/90">{CONTACT.sales}</span>
                </a>
                <a href={`mailto:${CONTACT.email}`} className="flex min-w-0 flex-col gap-1">
                  <span className="kicker text-stone/40">Write</span>
                  <span className="ulink self-start truncate text-stone/90">{CONTACT.email}</span>
                </a>
                <a href={CONTACT.maps} target="_blank" rel="noreferrer" className="col-span-2 flex flex-col gap-1">
                  <span className="kicker text-stone/40">Lobby &middot; Sion (East) &#8599;</span>
                  <span className="text-stone/70">
                    {CONTACT.address[0]}, {CONTACT.address[1]}
                  </span>
                </a>
              </div>
            </div>
          </div>

          {/* the street, in front of the real city */}
          <div className="relative mt-14 md:mt-20">
            <div ref={city} className="pointer-events-none absolute inset-x-0 bottom-0 opacity-80 md:inset-x-[-2rem] [&_p]:hidden" aria-hidden>
              <NightSkyline towers={SKYLINE_TOWERS} />
            </div>

            <p className="kicker relative mb-4 px-6 text-stone/40 md:hidden">Swipe the street &rarr;</p>
            <div className="st-street no-scrollbar relative flex snap-x snap-mandatory items-end gap-3 overflow-x-auto px-6 md:grid md:grid-cols-6 md:gap-4 md:overflow-visible md:px-10">
              {STREET.map((t) => (
                <nav key={t.id} aria-label={t.title} className="st-tower group/t relative w-[64vw] shrink-0 snap-center md:w-auto">
                  {/* crown */}
                  <div className="mx-auto flex w-[56%] flex-col items-center">
                    <span className={`block h-6 w-px transition-colors duration-500 ${t.tall ? "bg-amber" : "bg-stone/25 group-hover/t:bg-amber"}`} />
                    <span
                      className={`block size-2 rounded-full transition-[background-color,box-shadow] duration-500 ${
                        t.tall
                          ? "bg-amber shadow-[0_0_14px_4px_rgba(242,166,90,.55)]"
                          : "bg-stone/30 group-hover/t:bg-amber group-hover/t:shadow-[0_0_14px_4px_rgba(242,166,90,.55)]"
                      }`}
                    />
                    <div className="mt-1 h-3 w-full border-x border-t border-stone/15 bg-[#1b1f26]" />
                  </div>

                  {/* body: one floor per link, top floor first */}
                  <div className="border border-stone/15 bg-[linear-gradient(180deg,#1d2129,#13161b)] transition-[border-color,box-shadow] duration-500 group-hover/t:border-amber/40 group-hover/t:shadow-[0_-24px_70px_-30px_rgba(242,166,90,0.45)]">
                    {t.links.map((l, i) => {
                      const n = t.links.length - i;
                      return (
                        <TLink
                          key={`${l.href}-${l.label}`}
                          href={l.href}
                          data-i={n}
                          className="st-floor group/f relative grid grid-cols-[1.9rem_1fr] items-center gap-2 border-b border-stone/[0.07] px-3 py-2.5 transition-colors duration-300 hover:bg-amber/10"
                        >
                          <span className="kicker tabular-nums text-stone/30 transition-colors group-hover/f:text-amber">{String(n).padStart(2, "0")}</span>
                          <span className="min-w-0">
                            <span className="block truncate text-[0.92rem] text-stone/80 transition-colors duration-300 group-hover/f:text-stone">{l.label}</span>
                            <span
                              aria-hidden
                              className="mt-1.5 block h-[5px] w-full text-[#2a3039] transition-[color,filter] duration-700 [background-image:repeating-linear-gradient(90deg,currentColor_0_7px,transparent_7px_11px)] [.st-floor[data-on='1']_&]:text-[#7a5d3f] [.st-floor[data-on='2']_&]:text-[#c8894a] group-hover/f:!text-amber group-hover/f:[filter:drop-shadow(0_0_4px_rgba(242,166,90,.9))]"
                            />
                          </span>
                        </TLink>
                      );
                    })}
                    {/* lobby plaque */}
                    <div className="flex items-baseline justify-between gap-2 bg-black/40 px-3 py-3">
                      <span className="kicker text-amber">{t.code}</span>
                      <span className="kicker truncate text-stone/60">{t.title}</span>
                    </div>
                  </div>
                </nav>
              ))}
            </div>

            {/* ground line */}
            <div className="relative border-t border-amber/30 bg-night px-6 py-6 md:px-10">
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {SOCIALS.map((s) => (
                    <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="kicker ulink text-stone/60 hover:text-amber">
                      {s.label} &#8599;
                    </a>
                  ))}
                </div>
                <button type="button" onClick={ride} className="group flex items-center gap-3" aria-label="Back to top">
                  <span className="kicker text-stone/60 transition-colors group-hover:text-amber">{riding ? "Going up…" : "Take the lift up"}</span>
                  <span
                    className={`flex size-11 items-center justify-center rounded-full border transition-all duration-500 ${
                      riding ? "border-amber text-amber shadow-[0_0_0_6px_rgba(242,166,90,0.15),0_0_24px_rgba(242,166,90,0.45)]" : "border-stone/25 group-hover:border-amber group-hover:text-amber"
                    }`}
                  >
                    &#9650;
                  </span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {compact && (
        <div className="relative">
          <NightSkyline towers={SKYLINE_TOWERS} />
        </div>
      )}

      <div className="relative flex flex-col gap-5 border-t border-stone/10 bg-night px-6 py-8 md:px-10">
        <p className="max-w-4xl text-xs leading-relaxed text-stone/40">
          {RERA_NOTE} Runwal Realty is the brand name of Runwal Developers Limited. Runwal Realty and Runwal Enterprises Limited are separate companies.
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone/40">
          <p>&copy; 2026 Runwal Developers Limited &middot; {CONTACT.phone}</p>
          <p>Mumbai, Thane &amp; Pune</p>
          <p>Concept demo by Garage Collective &middot; not the official website</p>
        </div>
      </div>
    </footer>
  );
}
