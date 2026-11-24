"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { whenRevealed } from "@/lib/gate";
import { prefersReducedMotion } from "@/lib/motion";
import { getProject } from "@/lib/projects";
import { Pic } from "../site/Pic";
import { TLink } from "../site/Transition";

type Shot = {
  slug: string;
  src: string;
  what: string;
  /** grid placement on desktop (12 cols) */
  col: string;
  /** vertical offset on desktop, rem */
  drop: number;
  /** aspect ratio class */
  ratio: string;
  /** parallax depth: positive drifts up faster, negative lags */
  depth: number;
  sizes: string;
  /** object-position, to crop film stills clear of overlay text and watermarks */
  pos?: string;
  /** caption override when the picture is a part of the project (e.g. its clubhouse) */
  label?: string;
  /** for pictures not tied to one residence: caption place + external link */
  place?: string;
  href?: string;
};

// Runwal's own renders. "what" describes the picture, not the product.
const SHOTS: Shot[] = [
  { slug: "runwal-malabar", src: "/images/projects/runwal-malabar/feature.webp", what: "Crown at dusk", col: "md:col-start-1 md:col-span-5", drop: 0, ratio: "aspect-[1344/1080]", depth: 0.5, sizes: "(min-width: 768px) 40vw, 100vw" },
  { slug: "runwal-auris", src: "/images/projects/runwal-auris/feature.webp", what: "The tower over Link Road", col: "md:col-start-7 md:col-span-4", drop: 9, ratio: "aspect-[4/5]", depth: 1.3, sizes: "(min-width: 768px) 32vw, 50vw" },
  { slug: "runwal-raaya", src: "/images/projects/runwal-raaya/overview.webp", what: "Twin towers", col: "md:col-start-11 md:col-span-2", drop: 2, ratio: "aspect-[615/800]", depth: -0.6, sizes: "(min-width: 768px) 16vw, 50vw" },
  { slug: "runwal-rare", src: "/images/projects/runwal-rare/feature.webp", what: "Rooftop deck", col: "md:col-start-2 md:col-span-4", drop: -4, ratio: "aspect-[4/3]", depth: 1.0, sizes: "(min-width: 768px) 32vw, 50vw" },
  { slug: "runwal-timeless", src: "/images/projects/runwal-timeless/feature.webp", what: "Living room", col: "md:col-start-7 md:col-span-5", drop: 4, ratio: "aspect-[1344/1080]", depth: -0.4, sizes: "(min-width: 768px) 40vw, 100vw" },
  { slug: "runwal-zenith", src: "/images/projects/runwal-zenith/overview.webp", what: "51 storeys in Balkum", col: "md:col-start-1 md:col-span-3", drop: -6, ratio: "aspect-[615/800]", depth: 1.4, sizes: "(min-width: 768px) 24vw, 50vw" },
  { slug: "runwal-lands-end", src: "/images/projects/runwal-lands-end/hero.webp", what: "A deck over the water", col: "md:col-start-4 md:col-span-5", drop: 3, ratio: "aspect-[1920/910]", depth: 0.3, sizes: "(min-width: 768px) 40vw, 100vw" },
  { slug: "runwal-the-central-park", src: "/images/social/central-park-facade.webp", what: "Forty storeys over the park", col: "md:col-start-10 md:col-span-3", drop: -2, ratio: "aspect-[4/5]", depth: 0.9, sizes: "(min-width: 768px) 24vw, 50vw", pos: "object-[68%_50%]" },
  { slug: "", src: "/images/ig/Df91MuXsRtJ.webp", what: "On site, under a curved concrete shell", col: "md:col-start-1 md:col-span-2", drop: 8, ratio: "aspect-[360/640]", depth: 1.5, sizes: "(min-width: 768px) 16vw, 50vw", label: "Construction", place: "@runwal, Nov 2026", href: "https://www.instagram.com/runwal/reel/Df91MuXsRtJ/" },
  { slug: "runwal-one", src: "/images/social/runwal-one-night.webp", what: "Evening on the podium", col: "md:col-start-3 md:col-span-6", drop: 2, ratio: "aspect-[4/3]", depth: -0.5, sizes: "(min-width: 768px) 48vw, 100vw", pos: "object-[34%_50%]" },
  { slug: "runwal-the-central-park", src: "/images/social/club-oasis.webp", what: "Club Oasis", col: "md:col-start-9 md:col-span-4", drop: 14, ratio: "aspect-[4/3]", depth: 1.1, sizes: "(min-width: 768px) 32vw, 100vw", pos: "object-[22%_50%]", label: "The Central Park" },
];

const raaya = getProject("runwal-raaya");

/** Links a collage tile to its residence, or out to the source post for site photography. */
function Frame({ shot, label, children }: { shot: Shot; label: string; children: React.ReactNode }) {
  if (shot.href) {
    return (
      <a href={shot.href} target="_blank" rel="noreferrer" className="group block" aria-label={label}>
        {children}
      </a>
    );
  }
  return (
    <TLink href={`/residences/${shot.slug}`} className="group block" aria-label={label}>
      {children}
    </TLink>
  );
}

/**
 * "The architecture": an editorial collage of Runwal renders at different depths (they drift at
 * their own speed and un-crop as they arrive), then one render that opens like a window.
 */
export function Architecture() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let ctx: gsap.Context | null = null;
    const cancel = whenRevealed(() => {
      ctx = gsap.context(() => {
        const mm = gsap.matchMedia();
        // un-crop reveal for every frame (all sizes)
        gsap.utils.toArray<HTMLElement>(".ar-frame").forEach((f) => {
          const img = f.querySelector(".ar-img");
          const st = { trigger: f, start: "top 92%", once: true };
          gsap.fromTo(f, { clipPath: "inset(14% 10% 14% 10%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.out", scrollTrigger: st });
          if (img) gsap.fromTo(img, { scale: 1.25 }, { scale: 1.06, duration: 2, ease: "expo.out", scrollTrigger: st });
        });
        gsap.fromTo(".ar-cap", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.05, scrollTrigger: { trigger: ".ar-collage", start: "top 80%", once: true } });

        // depth parallax only where there is room for it
        mm.add("(min-width: 768px)", () => {
          gsap.utils.toArray<HTMLElement>(".ar-shot").forEach((s) => {
            const d = parseFloat(s.dataset.depth || "0");
            gsap.fromTo(s, { y: d * 90 }, { y: d * -90, ease: "none", scrollTrigger: { trigger: ".ar-collage", start: "top bottom", end: "bottom top", scrub: true } });
            const img = s.querySelector(".ar-img");
            if (img) gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: "none", scrollTrigger: { trigger: s, start: "top bottom", end: "bottom top", scrub: true } });
          });
        });

        // the window: insets open while the render settles from a zoom
        gsap
          .timeline({ scrollTrigger: { trigger: ".ar-window", start: "top 85%", end: "center 45%", scrub: 0.6 } })
          .fromTo(".ar-window-frame", { clipPath: "inset(12% 18% 12% 18%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none" }, 0)
          .fromTo(".ar-window-img", { scale: 1.3 }, { scale: 1.05, ease: "none" }, 0)
          .fromTo(".ar-window-cap", { opacity: 0, y: 30 }, { opacity: 1, y: 0, ease: "none" }, 0.55);
      }, el);
    });
    return () => {
      cancel();
      ctx?.revert();
    };
  }, []);

  return (
    <section ref={root} className="relative overflow-hidden bg-paper" aria-labelledby="ar-h">
      <div className="px-6 pb-10 pt-28 md:px-10 md:pb-16 md:pt-40">
        <div className="grid gap-8 md:grid-cols-12">
          <p className="kicker text-dusk md:col-span-3">The architecture</p>
          <div className="md:col-span-9">
            <h2 id="ar-h" data-split className="display text-[11vw] md:text-[min(6vw,7rem)]">
              Light, air, views <span className="accent normal-case">and time</span>
            </h2>
            <p data-fade className="mt-8 max-w-xl text-[0.98rem] leading-relaxed text-graphite-2">
              Towers that rise out of podium gardens, decks that open to the sea, rooms that face the light. A look at the buildings Runwal is raising now.
            </p>
          </div>
        </div>
      </div>

      {/* collage */}
      <div className="ar-collage grid grid-cols-2 gap-x-4 gap-y-10 px-6 pb-20 md:grid-cols-12 md:gap-x-6 md:gap-y-14 md:px-10 md:pb-28">
        {SHOTS.map((s, i) => {
          const p = getProject(s.slug);
          const wide = s.ratio.includes("1920") || s.ratio.includes("1344") || s.ratio.includes("4/3");
          return (
            <figure
              key={s.src}
              data-depth={s.depth}
              className={`ar-shot ${s.col} ${wide ? "col-span-2" : "col-span-1"} will-change-transform md:mt-[var(--drop)]`}
              style={{ "--drop": `${s.drop}rem` } as React.CSSProperties}
            >
              <Frame shot={s} label={s.href ? `${s.label}: ${s.what}` : `${p?.name}, ${p?.area}`}>
                <div className={`ar-frame relative overflow-hidden bg-stone-2 ${s.ratio}`}>
                  <div className="ar-img absolute inset-[-6%] transition-transform duration-[1.6s] ease-[var(--ease-out-expo)] group-hover:scale-[1.03]">
                    <Pic src={s.src} alt={p ? `${p.name}: ${s.what.toLowerCase()}` : s.what} fill sizes={s.sizes} className={s.pos ?? ""} />
                  </div>
                  <span className="kicker absolute left-3 top-3 bg-paper/85 px-1.5 py-0.5 text-[0.6rem] text-graphite backdrop-blur">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <figcaption className="ar-cap mt-3 flex flex-col gap-1">
                  <span className="text-[0.85rem] text-graphite">{s.what}</span>
                  <span className="kicker text-[0.6rem] text-mute">
                    {s.label ?? p?.name.replace("Runwal ", "")} &middot; {s.place ?? p?.area}
                  </span>
                </figcaption>
              </Frame>
            </figure>
          );
        })}
      </div>

      {/* the window */}
      {raaya && (
        <div className="ar-window relative h-[78svh] md:h-[118vh]" data-tone="dark">
          <div className="ar-window-frame absolute inset-0 overflow-hidden bg-graphite">
            <div className="ar-window-img absolute inset-0">
              <Pic src={raaya.images.hero} alt={`${raaya.name}, ${raaya.area}`} fill sizes="100vw" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />
          </div>
          <div className="ar-window-cap absolute inset-x-6 bottom-10 flex flex-col gap-6 text-stone md:inset-x-10 md:bottom-16 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="kicker text-amber">
                {raaya.name} &middot; {raaya.area}
              </p>
              <p className="title mt-3 max-w-2xl text-3xl leading-tight md:text-5xl">{raaya.tagline}</p>
            </div>
            <TLink href={`/residences/${raaya.slug}`} className="group inline-flex items-center gap-3 self-start border border-stone/40 px-6 py-4 text-sm font-medium backdrop-blur-sm transition-colors hover:border-amber hover:text-amber md:self-auto">
              Step inside {raaya.short} <span className="transition-transform duration-500 group-hover:translate-x-1">&rarr;</span>
            </TLink>
          </div>
        </div>
      )}
    </section>
  );
}
