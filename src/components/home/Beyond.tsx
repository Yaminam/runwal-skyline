"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCallback, useEffect, useRef, useState } from "react";
import { whenRevealed } from "@/lib/gate";
import { prefersReducedMotion } from "@/lib/motion";
import { getLenis } from "../SmoothScroll";
import { Pic } from "../site/Pic";
import { TLink } from "../site/Transition";

type Shape = "atrium" | "shopfront" | "marquee" | "lobby" | "porte";
type Place = { no: number; k: string; name: string; sign: string; where: string; line: string; href: string; view: string; img: string; alt: string; pos: string; shape: Shape };

const STREET: Place[] = [
  {
    no: 1,
    k: "Retail",
    name: "R City",
    sign: "R CITY",
    where: "Ghatkopar West",
    line: "Mumbai's landmark mall on 28 acres, opened in 2009.",
    href: "/places#retail-h",
    view: "Visit R City",
    img: "/images/company/retail/r-city.webp",
    alt: "R City mall facade lit at night, Ghatkopar West",
    pos: "object-[50%_30%]",
    shape: "atrium",
  },
  {
    no: 2,
    k: "Retail",
    name: "R Mall",
    sign: "R MALL",
    where: "Thane West & Mulund West",
    line: "Runwal's first mall opened in Mulund in 2003.",
    href: "/places#retail-h",
    view: "Visit R Mall",
    img: "/images/company/retail/r-mall-mulund.webp",
    alt: "R Mall entrance with the R emblem lit at night",
    pos: "object-[50%_50%]",
    shape: "shopfront",
  },
  {
    no: 3,
    k: "Retail",
    name: "R Odeon",
    sign: "R ODEON",
    where: "Ghatkopar East",
    line: "A neighbourhood retail address in the eastern suburbs.",
    href: "/places#retail-h",
    view: "Visit R Odeon",
    img: "/images/company/retail/r-odeon.webp",
    alt: "R Odeon building, Ghatkopar East",
    pos: "object-[50%_45%]",
    shape: "marquee",
  },
  {
    no: 4,
    k: "Offices",
    name: "R Square",
    sign: "R SQUARE",
    where: "Andheri East & Mulund West",
    line: "IGBC-certified office addresses on the city's business corridors.",
    href: "/residences/r-square-andheri",
    view: "View the offices",
    img: "/images/projects/r-square-andheri/hero.webp",
    alt: "R Square Andheri entrance plaza with a timber canopy",
    pos: "object-[60%_50%]",
    shape: "lobby",
  },
  {
    no: 5,
    k: "Hotels",
    name: "Hospitality",
    sign: "HOTELS",
    where: "Worli · Thane · Pune · Alibaug",
    line: "Hotels in development under the Runwal name.",
    href: "/places#hosp-h",
    view: "See the hotel cities",
    img: "/images/social/sea-link-diwali.webp",
    alt: "The Bandra-Worli Sea Link at night, seen from a Runwal home",
    pos: "object-[52%_50%]",
    shape: "porte",
  },
];

// window outline per architecture: size (desktop, in svh / vw) and mask
const WIN: Record<Shape, { w: string; h: string; radius: string }> = {
  atrium: { w: "min(22vw,26rem)", h: "52svh", radius: "rounded-t-[999px]" },
  shopfront: { w: "min(34vw,40rem)", h: "34svh", radius: "rounded-none" },
  marquee: { w: "min(28vw,32rem)", h: "36svh", radius: "rounded-[0.4rem]" },
  lobby: { w: "min(26vw,30rem)", h: "50svh", radius: "rounded-none" },
  porte: { w: "min(34vw,40rem)", h: "40svh", radius: "rounded-t-[45%_70%]" },
};

/** Window ornaments drawn over the image: mullions, awnings, marquee bulbs, canopies. */
function Ornament({ shape, lit }: { shape: Shape; lit: boolean }) {
  if (shape === "shopfront")
    return (
      <>
        <div className="pointer-events-none absolute inset-0 grid grid-cols-4" aria-hidden>
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i} className="border-r-[3px] border-[#20252c] last:border-r-0" />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[14%] border-b-[3px] border-[#20252c] bg-[#20252c]/40" aria-hidden />
      </>
    );
  if (shape === "lobby")
    return (
      <div className="pointer-events-none absolute inset-0 grid grid-cols-5 grid-rows-6" aria-hidden>
        {Array.from({ length: 30 }, (_, i) => (
          <span key={i} className="border-b border-r border-[#20252c]/90" />
        ))}
      </div>
    );
  if (shape === "atrium")
    return (
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <span className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-[#20252c]" />
        <span className="absolute inset-x-0 top-[38%] h-[3px] bg-[#20252c]" />
        <span className="absolute inset-x-0 top-[70%] h-[3px] bg-[#20252c]" />
      </div>
    );
  if (shape === "porte")
    return (
      <div className="pointer-events-none absolute inset-x-[8%] bottom-[18%] flex justify-between" aria-hidden>
        {Array.from({ length: 2 }, (_, i) => (
          <span key={i} className="h-[46%] w-[6%] bg-[#20252c]" />
        ))}
      </div>
    );
  // marquee: the bulb border lives on the frame (see below); a slim mullion here
  return (
    <span
      className={`pointer-events-none absolute inset-x-0 bottom-0 h-[22%] border-t-[3px] border-[#20252c] transition-colors duration-700 ${lit ? "bg-[#20252c]/20" : "bg-[#20252c]/60"}`}
      aria-hidden
    />
  );
}

function Sign({ text, lit, mobile }: { text: string; lit: number; mobile?: boolean }) {
  const letters = text.split("");
  return (
    <p className={`display flex select-none justify-center whitespace-nowrap leading-none ${mobile ? "text-[11vw]" : "text-[min(3.4vw,4rem)]"}`} aria-hidden>
      {letters.map((ch, i) => {
        const on = i < lit;
        return (
          <span
            key={i}
            className={`inline-block transition-[color,text-shadow] duration-300 ${ch === " " ? "w-[0.35em]" : ""} ${
              on
                ? "text-[#fff3df] [text-shadow:0_0_6px_rgba(255,226,180,.95),0_0_22px_rgba(242,166,90,.85),0_0_44px_rgba(242,166,90,.45)] st-flick"
                : "text-transparent [-webkit-text-stroke:1px_rgba(238,235,229,0.18)]"
            }`}
            style={on ? { animationDelay: `${(i * 0.37) % 2}s` } : undefined}
          >
            {ch}
          </span>
        );
      })}
    </p>
  );
}

function StreetWindow({ p, lit, onOpen, mobile }: { p: Place; lit: boolean; onOpen: (el: HTMLElement) => void; mobile?: boolean }) {
  const win = WIN[p.shape];
  return (
    <div className="relative">
      {p.shape === "marquee" && (
        <div className="relative mx-auto mb-2 h-6 w-[108%] -translate-x-[3.7%] border border-[#3a404a] bg-[#1c2027]" aria-hidden>
          <div className="absolute inset-[3px] bg-[radial-gradient(circle,rgba(255,214,150,0.95)_0_2px,transparent_2.5px)] bg-[length:12px_100%] transition-opacity duration-700" style={{ opacity: lit ? 1 : 0.25 }} />
        </div>
      )}
      {p.shape === "porte" && (
        <div className="relative mx-auto mb-0 h-3 w-[118%] -translate-x-[7.6%] bg-[#2a2f37] shadow-[0_6px_20px_rgba(0,0,0,0.6)]" aria-hidden>
          <div className="absolute inset-x-[10%] top-full flex justify-between">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className="block h-8 w-6 bg-[radial-gradient(50%_100%_at_50%_0%,rgba(255,220,170,0.7),transparent)] transition-opacity duration-700" style={{ opacity: lit ? 1 : 0.2 }} />
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={(e) => onOpen(e.currentTarget)}
        aria-label={`Step inside ${p.name}`}
        className={`st-win group relative block overflow-hidden border-[6px] border-[#262b33] bg-[#0b0d11] shadow-[inset_0_0_30px_rgba(0,0,0,0.8),0_0_60px_rgba(242,166,90,0.12)] ${win.radius}`}
        style={mobile ? { width: "100%", aspectRatio: p.shape === "atrium" || p.shape === "lobby" ? "3 / 4" : "4 / 3" } : { width: win.w, height: win.h }}
      >
        <div className="st-interior absolute -inset-x-[14%] inset-y-0 will-change-transform">
          <Pic src={p.img} alt={p.alt} fill sizes="(min-width: 768px) 40vw, 100vw" className={`object-cover transition-[filter] duration-700 ${p.pos} ${lit ? "brightness-100" : "brightness-[0.45] saturate-[0.6]"}`} />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(80%_70%_at_50%_60%,transparent,rgba(5,6,9,0.55))]" aria-hidden />
        <Ornament shape={p.shape} lit={lit} />
        <span className="kicker absolute bottom-3 right-3 bg-black/55 px-2 py-1 text-[0.6rem]! text-stone/90 opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          Step inside &rarr;
        </span>
      </button>
      {/* wet pavement reflection */}
      {!mobile && (
        <div className="pointer-events-none absolute left-0 top-full mt-[4svh] h-[14svh] w-full overflow-hidden opacity-40 [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.7),transparent)]" aria-hidden>
          <div className={`h-full w-full scale-y-[-1] blur-[3px] ${win.radius}`}>
            <div className="relative h-[200%] w-full -translate-y-1/2">
              <Pic src={p.img} alt="" fill sizes="30vw" className={`object-cover ${p.pos} ${lit ? "" : "brightness-50"}`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Beyond homes, as "the street at night": the camera pans along one continuous dark facade with five
 * lit display windows, each shaped like its building (atrium, shopfront, cinema marquee, office lobby,
 * hotel porte-cochere) with the real place inside. Signs flicker on letter by letter as each window
 * arrives; the centred one lights fully and shows its plaque. Clicking a window steps inside it.
 */
export function Beyond() {
  const stage = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [lit, setLit] = useState<number[]>(() => STREET.map(() => 0));
  const [active, setActive] = useState(0);
  const [inside, setInside] = useState<{ i: number; rect: DOMRect } | null>(null);
  const overlay = useRef<HTMLDivElement>(null);

  // horizontal pan (desktop), signs and interiors follow each window's distance from centre
  useEffect(() => {
    const st = stage.current;
    const tr = track.current;
    if (!st || !tr) return;
    const reduced = prefersReducedMotion();
    const mm = gsap.matchMedia();
    let cancel = () => {};

    const measure = () => {
      const bays = tr.querySelectorAll<HTMLElement>(".st-bay");
      const vw = window.innerWidth;
      const next: number[] = [];
      let best = 0;
      let bestD = Infinity;
      bays.forEach((bay, i) => {
        const r = bay.getBoundingClientRect();
        const off = (r.left + r.width / 2 - vw / 2) / vw; // -1..1 around the centre
        const interior = bay.querySelector<HTMLElement>(".st-interior");
        if (interior) interior.style.transform = `translate3d(${(-off * 9).toFixed(2)}%,0,0)`;
        const near = Math.max(0, 1 - Math.abs(off) * 1.25);
        next.push(Math.min(STREET[i].sign.length, Math.round(near * 1.45 * STREET[i].sign.length)));
        if (Math.abs(off) < bestD) {
          bestD = Math.abs(off);
          best = i;
        }
      });
      setLit((prev) => (prev.every((v, i) => v === next[i]) ? prev : next));
      setActive((prev) => (prev === best ? prev : best));
    };

    cancel = whenRevealed(() => {
      mm.add("(min-width: 768px)", () => {
        if (reduced) {
          setLit(STREET.map((p) => p.sign.length));
          return;
        }
        const dist = () => tr.scrollWidth - window.innerWidth;
        const tween = gsap.to(tr, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: {
            trigger: st,
            start: "top top",
            end: () => `+=${dist() * 1.15}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
            onUpdate: measure,
            onRefresh: measure,
          },
        });
        measure();
        return () => tween.scrollTrigger?.kill();
      });
      // phones: no pin, each sign lights as its window scrolls in
      mm.add("(max-width: 767.98px)", () => {
        const triggers = Array.from(st.querySelectorAll<HTMLElement>(".st-bay")).map((bay, i) =>
          ScrollTrigger.create({
            trigger: bay,
            start: "top 75%",
            once: true,
            onEnter: () => {
              const n = STREET[i].sign.length;
              for (let k = 1; k <= n; k++) gsap.delayedCall(k * 0.09, () => setLit((prev) => prev.map((v, j) => (j === i ? Math.max(v, k) : v))));
            },
          }),
        );
        return () => triggers.forEach((t) => t.kill());
      });
    });
    return () => {
      cancel();
      mm.revert();
    };
  }, []);

  const open = (i: number, btn: HTMLElement) => setInside({ i, rect: btn.getBoundingClientRect() });
  const close = useCallback(() => {
    const el = overlay.current;
    const cur = inside;
    const done = () => {
      setInside(null);
      getLenis()?.start();
    };
    if (!el || !cur || prefersReducedMotion()) return done();
    const r = cur.rect;
    gsap.to(el, {
      clipPath: `inset(${r.top}px ${window.innerWidth - r.right}px ${window.innerHeight - r.bottom}px ${r.left}px)`,
      duration: 0.7,
      ease: "expo.inOut",
      onComplete: done,
    });
  }, [inside]);

  // step inside: the window's image grows from its frame to fill the screen
  useEffect(() => {
    const el = overlay.current;
    if (!inside || !el) return;
    const r = inside.rect;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    getLenis()?.stop();
    const from = `inset(${r.top}px ${vw - r.right}px ${vh - r.bottom}px ${r.left}px)`;
    if (prefersReducedMotion()) gsap.set(el, { clipPath: "inset(0px 0px 0px 0px)" });
    else {
      gsap.fromTo(el, { clipPath: from }, { clipPath: "inset(0px 0px 0px 0px)", duration: 0.9, ease: "expo.inOut" });
      gsap.fromTo(el.querySelector(".st-in-img"), { scale: 1.25 }, { scale: 1, duration: 1.4, ease: "expo.out" });
      gsap.fromTo(el.querySelectorAll(".st-in-fade"), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, ease: "expo.out", stagger: 0.06, delay: 0.55 });
    }
    const esc = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [inside, close]);

  const placeIn = inside ? STREET[inside.i] : null;

  return (
    <section data-tone="dark" className="relative overflow-hidden bg-night text-stone">
      {/* intro */}
      <div className="relative grid gap-10 px-6 pb-6 pt-36 md:grid-cols-12 md:px-10 md:pb-0 md:pt-44">
        <div className="md:col-span-7">
          <p className="kicker mb-6 text-amber">Beyond homes &middot; The street at night</p>
          <h2 data-split className="display text-[11vw] md:text-[min(5.4vw,6.4rem)]">
            Where the city shops, works &amp; <span className="accent normal-case">stays</span>
          </h2>
        </div>
        <div className="flex flex-col justify-end gap-8 md:col-span-4 md:col-start-9">
          <p data-fade className="max-w-md leading-relaxed text-stone/70">
            Runwal built Mumbai&rsquo;s first generation of modern malls, and now builds offices and hotels. 2.89 million sq ft of commercial and retail
            space has been handed over so far.
          </p>
          <TLink
            href="/places"
            data-fade
            className="inline-flex items-center gap-3 self-start border border-stone/25 px-6 py-4 text-sm font-medium transition-colors hover:border-amber hover:text-amber"
          >
            Explore Runwal places <span>&rarr;</span>
          </TLink>
        </div>
      </div>

      {/* the street */}
      <div ref={stage} className="relative md:h-svh md:overflow-hidden">
        {/* sky and far rooftops */}
        <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-[16svh] bg-[linear-gradient(180deg,#0d1015,#141823)] md:block" aria-hidden />

        <div ref={track} className="relative flex flex-col gap-24 px-6 py-16 md:h-full md:w-max md:flex-row md:items-stretch md:gap-0 md:p-0">
          {/* opening wall */}
          <div className="hidden w-[18vw] shrink-0 border-r border-black/50 bg-[#151920] md:block" aria-hidden>
            <div className="mt-[16svh] h-[2px] bg-[#2a3039]" />
          </div>

          {STREET.map((p, i) => {
            const on = active === i;
            return (
              <div
                key={p.name}
                className="st-bay relative flex shrink-0 flex-col items-center md:h-full md:w-[52vw] md:border-r md:border-black/50 md:bg-[linear-gradient(180deg,#171b22_0%,#1a1e26_60%,#14171c_100%)] md:pt-[16svh]"
              >
                {/* building front: cornice, sign, window, plaque */}
                <div className="hidden w-full md:block" aria-hidden>
                  <div className="h-[2px] w-full bg-[#2a3039]" />
                  <div className="mx-[6%] h-3 border-b border-[#262b33]" />
                </div>
                <div className="flex w-full items-baseline justify-between md:absolute md:left-[6%] md:right-[6%] md:top-[17.5svh] md:w-auto">
                  <span className="kicker text-stone/40">No. {p.no}</span>
                  <span className="kicker text-stone/30">{p.k}</span>
                </div>

                <div className="mt-6 w-full md:mt-[5svh] md:w-auto">
                  <div className="hidden md:block">
                    <Sign text={p.sign} lit={lit[i]} />
                  </div>
                  <div className="md:hidden">
                    <Sign text={p.sign} lit={lit[i]} mobile />
                  </div>
                </div>

                <div className="mt-6 w-full md:mt-[3svh] md:w-auto">
                  <div className="hidden md:block">
                    <StreetWindow p={p} lit={lit[i] > 0} onOpen={(el) => open(i, el)} />
                  </div>
                  <div className="md:hidden">
                    <StreetWindow p={p} lit={lit[i] > 0} onOpen={(el) => open(i, el)} mobile />
                  </div>
                </div>

                {/* plaque */}
                <div
                  className={`relative z-10 mt-6 w-full max-w-[26rem] border border-stone/15 bg-[#101318]/90 p-4 backdrop-blur transition-[opacity,transform] duration-700 ease-[var(--ease-out-expo)] md:absolute md:bottom-[13svh] md:right-[6%] md:mt-0 md:w-[min(24vw,24rem)] ${
                    on ? "md:translate-y-0 md:opacity-100" : "md:pointer-events-none md:translate-y-4 md:opacity-0"
                  }`}
                >
                  <p className="kicker text-amber">
                    {p.k} &middot; {p.where}
                  </p>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-stone/80">{p.line}</p>
                  <TLink href={p.href} className="kicker ulink mt-3 inline-block text-stone hover:text-amber">
                    {p.view} &rarr;
                  </TLink>
                </div>

                {/* streetlamp at the left of each bay */}
                <div className="pointer-events-none absolute bottom-[9svh] left-[3%] hidden md:block" aria-hidden>
                  <span className="absolute bottom-0 left-0 h-[34svh] w-[3px] bg-[#2b3038]" />
                  <span className="absolute bottom-[34svh] left-0 h-[3px] w-6 bg-[#2b3038]" />
                  <span
                    className="absolute bottom-[calc(34svh-0.6rem)] left-5 size-2.5 rounded-full bg-[#ffe3b8] transition-shadow duration-700"
                    style={{ boxShadow: on ? "0 0 18px 6px rgba(255,214,150,0.75)" : "0 0 8px 2px rgba(255,214,150,0.35)" }}
                  />
                  <span
                    className="absolute -bottom-[3svh] left-[-6rem] h-[8svh] w-[16rem] rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,200,130,0.35),transparent)] transition-opacity duration-700"
                    style={{ opacity: on ? 1 : 0.35 }}
                  />
                </div>
              </div>
            );
          })}

          {/* closing wall */}
          <div className="hidden w-[18vw] shrink-0 bg-[#151920] md:block" aria-hidden>
            <div className="mt-[16svh] h-[2px] bg-[#2a3039]" />
          </div>
        </div>

        {/* pavement */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[9svh] border-t border-[#2e333b] bg-[linear-gradient(180deg,#191d24,#0d1015)] md:block" aria-hidden>
          <div className="absolute inset-x-0 top-[38%] h-px bg-[repeating-linear-gradient(90deg,rgba(238,235,229,0.15)_0_40px,transparent_40px_80px)]" />
        </div>

        {/* street number readout */}
        <div className="pointer-events-none absolute right-10 top-[11.5svh] hidden items-center gap-4 md:flex">
          <span className="kicker text-stone/40">On the street</span>
          <span className="title text-2xl tabular-nums">
            No. <span className="text-amber">{STREET[active].no}</span>
            <span className="text-stone/40"> / {STREET.length}</span>
          </span>
        </div>
      </div>

      {/* stepped inside */}
      {placeIn && (
        <div ref={overlay} className="fixed inset-0 z-[60] bg-night" role="dialog" aria-modal="true" aria-label={placeIn.name}>
          <div className="st-in-img absolute inset-0">
            <Pic src={placeIn.img} alt={placeIn.alt} fill sizes="100vw" className={`object-cover ${placeIn.pos}`} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />
          <button type="button" onClick={close} className="st-in-fade kicker absolute right-6 top-6 border border-stone/40 bg-black/40 px-4 py-3 text-stone backdrop-blur hover:border-amber hover:text-amber md:right-10 md:top-8">
            Back to the street &times;
          </button>
          <div className="absolute inset-x-6 bottom-10 md:inset-x-10 md:bottom-14">
            <p className="st-in-fade kicker text-amber">
              No. {placeIn.no} &middot; {placeIn.k} &middot; {placeIn.where}
            </p>
            <p className="st-in-fade display mt-4 text-[13vw] text-stone md:text-[min(8vw,9rem)]">{placeIn.name}</p>
            <div className="st-in-fade mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <p className="max-w-lg leading-relaxed text-stone/85">{placeIn.line}</p>
              <TLink href={placeIn.href} onClick={() => getLenis()?.start()} className="inline-flex items-center gap-3 self-start bg-stone px-6 py-4 text-sm font-medium text-graphite transition-colors hover:bg-amber">
                {placeIn.view} <span>&rarr;</span>
              </TLink>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes st-flick { 0%,100% { opacity: 1 } 3% { opacity: .55 } 5% { opacity: 1 } 61% { opacity: 1 } 62% { opacity: .7 } 63% { opacity: 1 } }
        .st-flick { animation: st-flick 4.5s infinite; }
        @media (prefers-reduced-motion: reduce) { .st-flick { animation: none } }
      `}</style>
    </section>
  );
}
