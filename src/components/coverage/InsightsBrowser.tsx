"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { BLOGS, DIGITAL_COVERAGE, PRESS_RELEASES, PRINT_COVERAGE, VIDEO_COVERAGE, type Story } from "@/lib/coverage";
import { Pic } from "../site/Pic";
import { BlogMagazine, type BlogCard } from "./BlogMagazine";
import { TLink } from "../site/Transition";

type Tab = "blogs" | "digital" | "press" | "media";
const TABS: Array<{ id: Tab; label: string; count: number }> = [
  { id: "blogs", label: "Blogs", count: BLOGS.length },
  { id: "digital", label: "Digital coverage", count: DIGITAL_COVERAGE.length },
  { id: "press", label: "Press", count: PRESS_RELEASES.length },
  { id: "media", label: "Print & video", count: PRINT_COVERAGE.length + VIDEO_COVERAGE.length },
];

/**
 * The insights index. An editorial list: hover a headline and its cover floats beside the cursor
 * (fine pointers), tabs swap between blogs, coverage and press, and the films play inline.
 */
export function InsightsBrowser({ blogs }: { blogs: BlogCard[] }) {
  const [tab, setTab] = useState<Tab>("blogs");
  const [hover, setHover] = useState<Story | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const preview = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);

  // cursor-follow preview
  useEffect(() => {
    const el = preview.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;
    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });
    const move = (e: PointerEvent) => {
      xTo(e.clientX + 28);
      yTo(e.clientY - 120);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  // re-run the entrance when the tab changes
  useEffect(() => {
    const rows = list.current?.querySelectorAll("[data-row]");
    if (!rows?.length) return;
    gsap.fromTo(rows, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8, ease: "expo.out", stagger: 0.04 });
  }, [tab]);

  const stories = tab === "blogs" ? BLOGS : tab === "digital" ? DIGITAL_COVERAGE : tab === "press" ? PRESS_RELEASES : PRINT_COVERAGE;

  return (
    <section className="relative bg-stone px-6 pb-28 md:px-10 md:pb-40">
      <div className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto border-y border-graphite/10 px-6 py-4 md:mx-0 md:flex-wrap md:px-0" role="tablist" aria-label="Insights">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => {
              setTab(t.id);
              setHover(null);
              setPlaying(null);
            }}
            className={`flex shrink-0 items-center gap-2 border px-4 py-2.5 text-sm transition-colors ${
              tab === t.id ? "border-graphite bg-graphite text-stone" : "border-graphite/15 text-graphite-2 hover:border-graphite/50"
            }`}
          >
            {t.label}
            <span className={`kicker ${tab === t.id ? "text-amber" : "text-mute"}`}>{String(t.count).padStart(2, "0")}</span>
          </button>
        ))}
        <TLink href="/legacy#awards" className="flex shrink-0 items-center gap-2 border border-graphite/15 px-4 py-2.5 text-sm text-graphite-2 transition-colors hover:border-graphite/50">
          Awards <span className="kicker text-mute">&rarr;</span>
        </TLink>
      </div>

      <div ref={list} className="mt-10">
        {tab === "blogs" ? (
          <BlogMagazine cards={blogs} />
        ) : (
          <>
            <ul onMouseLeave={() => setHover(null)}>
              {stories.map((s, i) => (
                <li key={s.url + i} data-row>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    onMouseEnter={() => setHover(s)}
                    onFocus={() => setHover(s)}
                    className="group grid grid-cols-[2.5rem_1fr] items-baseline gap-x-4 gap-y-1 border-t border-graphite/15 py-6 md:grid-cols-[3rem_12rem_1fr_auto] md:gap-x-8 md:py-7"
                  >
                    <span className="kicker text-mute">{String(i + 1).padStart(2, "0")}</span>
                    <span className="kicker text-amber-deep md:order-none">{s.outlet}</span>
                    <span className="title col-start-2 text-xl leading-snug transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:translate-x-2 md:col-start-auto md:text-3xl">
                      {s.title}
                    </span>
                    <span className="kicker col-start-2 text-mute md:col-start-auto">Read &#8599;</span>
                  </a>
                </li>
              ))}
            </ul>

            {tab === "media" ? (
              <div className="mt-20">
                <p className="kicker text-dusk">On screen</p>
                <h3 className="title mt-3 text-3xl md:text-5xl">
                  Video <span className="accent">coverage</span>
                </h3>
                <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {VIDEO_COVERAGE.map((v) => (
                    <div key={v.id} data-row className="group">
                      <div className="relative aspect-video overflow-hidden bg-graphite">
                        {playing === v.id ? (
                          <iframe
                            src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`}
                            title={v.title}
                            allow="autoplay; encrypted-media; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0 size-full"
                          />
                        ) : (
                          <button type="button" onClick={() => setPlaying(v.id)} className="absolute inset-0" aria-label={`Play: ${v.title}`}>
                            <Pic src={v.image} alt="" fill sizes="(min-width: 1024px) 30vw, 100vw" className="transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-[1.05]" />
                            <span className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/15" />
                            <span className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-black/30 text-white backdrop-blur transition-transform duration-500 group-hover:scale-110">
                              &#9654;
                            </span>
                          </button>
                        )}
                      </div>
                      <p className="mt-4 text-[0.95rem] leading-snug">{v.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* floating cover that follows the cursor over the editorial list */}
      <div
        ref={preview}
        aria-hidden
        className={`pointer-events-none fixed left-0 top-0 z-30 hidden w-72 overflow-hidden bg-stone-2 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.45)] transition-[opacity,scale] duration-300 lg:block ${
          hover && hover.image && tab !== "blogs" ? "scale-100 opacity-100" : "scale-90 opacity-0"
        }`}
      >
        {hover?.image ? (
          <div className="relative aspect-[4/3]">
            <Pic src={hover.image} alt="" fill sizes="18rem" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
