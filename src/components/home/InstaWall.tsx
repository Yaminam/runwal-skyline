"use client";

import { useEffect, useRef } from "react";
import { INSTA_POSTS, INSTAGRAM } from "@/lib/instagram";
import { Pic } from "../site/Pic";

const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

/**
 * "From @runwal": the brand's latest posts as a strip of story cards. Drag (or swipe, or
 * shift-scroll) to move through them; each card opens its post on Instagram.
 */
export function InstaWall() {
  const strip = useRef<HTMLDivElement>(null);

  // pointer drag with a little glide; a drag never counts as a click
  useEffect(() => {
    const el = strip.current;
    if (!el || window.matchMedia("(pointer: coarse)").matches) return;
    let down = false;
    let moved = 0;
    let startX = 0;
    let startLeft = 0;
    let v = 0;
    let lastX = 0;
    let raf = 0;
    const glide = () => {
      v *= 0.92;
      el.scrollLeft -= v;
      if (Math.abs(v) > 0.4) raf = requestAnimationFrame(glide);
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      down = true;
      moved = 0;
      startX = lastX = e.clientX;
      startLeft = el.scrollLeft;
      cancelAnimationFrame(raf);
      el.dataset.dragging = "1";
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      v = e.clientX - lastX;
      lastX = e.clientX;
      el.scrollLeft = startLeft - dx;
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      delete el.dataset.dragging;
      raf = requestAnimationFrame(glide);
    };
    const onClick = (e: MouseEvent) => {
      if (moved > 6) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("click", onClick, true);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("click", onClick, true);
    };
  }, []);

  return (
    <section className="relative overflow-hidden bg-stone py-24 md:py-32" aria-labelledby="ig-h">
      <div className="mb-10 flex flex-col gap-6 px-6 md:mb-14 md:flex-row md:items-end md:justify-between md:px-10">
        <div>
          <p className="kicker flex items-center gap-3 text-dusk">
            <span className="live-dot inline-block size-1.5 rounded-full bg-amber" /> From @runwal
          </p>
          <h2 id="ig-h" data-split className="display mt-5 text-[11vw] md:text-[min(5.4vw,6.4rem)]">
            This month <span className="accent normal-case">at Runwal</span>
          </h2>
        </div>
        <div data-fade className="flex items-center gap-6">
          <p className="kicker hidden text-mute md:block">Drag to browse</p>
          <a
            href={INSTAGRAM}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-3 border border-graphite/25 px-6 py-4 text-sm font-medium transition-colors hover:border-graphite hover:bg-graphite hover:text-stone"
          >
            Follow on Instagram <span className="transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">&#8599;</span>
          </a>
        </div>
      </div>

      <div
        ref={strip}
        className="no-scrollbar flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-6 pt-3 select-none data-[dragging]:cursor-grabbing data-[dragging]:snap-none md:snap-none md:gap-5 md:px-10"
      >
        {INSTA_POSTS.map((p, i) => {
          const d = p.date ? fmt.format(new Date(`${p.date}T12:00:00`)) : "";
          return (
            <a
              key={p.code}
              href={p.href}
              target="_blank"
              rel="noreferrer"
              draggable={false}
              data-fade
              className="group shrink-0 snap-start"
              aria-label={`Instagram ${p.video ? "reel" : "post"}: ${p.note}${d ? `, ${d}` : ""}`}
            >
              <div
                className="relative h-[22rem] overflow-hidden bg-graphite shadow-[0_1px_0_rgba(22,24,27,0.04)] transition-[transform,box-shadow] duration-700 ease-[var(--ease-out-expo)] group-hover:-translate-y-2 group-hover:shadow-[0_30px_50px_-28px_rgba(22,24,27,0.55)] md:h-[26rem] md:group-hover:rotate-[-0.8deg]"
                style={{ aspectRatio: `${p.w} / ${p.h}` }}
              >
                <Pic src={p.src} alt={p.note} fill sizes="(min-width: 768px) 15rem, 13rem" className="pointer-events-none transition-transform duration-[1.4s] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]" />
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent" />
                <span className="kicker absolute left-3 top-3 bg-paper/85 px-1.5 py-0.5 text-[0.6rem] text-graphite backdrop-blur">{String(i + 1).padStart(2, "0")}</span>
                {p.video && (
                  <span className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur" aria-hidden>
                    <svg viewBox="0 0 16 16" className="ml-0.5 size-3" fill="currentColor">
                      <path d="M4 2.5v11l9-5.5z" />
                    </svg>
                  </span>
                )}
                {d && <span className="kicker absolute bottom-3 left-3 text-[0.6rem] text-white/85">{d}</span>}
              </div>
              <p className="mt-3 line-clamp-2 max-w-[13rem] text-[0.82rem] leading-snug text-graphite-2 md:max-w-[14.5rem]">{p.note}</p>
            </a>
          );
        })}
        <a
          href={INSTAGRAM}
          target="_blank"
          rel="noreferrer"
          className="group flex h-[22rem] w-[12rem] shrink-0 snap-start flex-col justify-between bg-graphite p-6 text-stone md:h-[26rem] md:w-[14rem]"
        >
          <span className="kicker text-amber">@runwal</span>
          <span className="title text-3xl leading-tight">
            More on
            <br />
            Instagram
          </span>
          <span className="text-2xl transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1">&#8599;</span>
        </a>
      </div>
    </section>
  );
}
