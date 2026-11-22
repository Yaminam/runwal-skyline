"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * The Runwal brand film, playing silently in a frame that widens to full bleed as it scrolls in.
 * Custom controls: play/pause and sound, with a thin progress line.
 */
export function Reel() {
  const video = useRef<HTMLVideoElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const v = video.current;
    const f = frame.current;
    if (!v || !f) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !prefersReducedMotion()) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.35 },
    );
    io.observe(f);
    const onTime = () => {
      if (bar.current && v.duration) bar.current.style.transform = `scaleX(${v.currentTime / v.duration})`;
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);

    // frame opens from inset to full bleed as it crosses the viewport
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = f.getBoundingClientRect();
        const t = Math.min(1, Math.max(0, 1 - r.top / window.innerHeight));
        const inset = (1 - t) * 6;
        f.style.clipPath = `inset(${inset}% ${inset}% ${inset}% ${inset}%)`;
      });
    };
    if (!prefersReducedMotion()) {
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
    return () => {
      io.disconnect();
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const sound = () => {
    const v = video.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted && v.paused) v.play().catch(() => {});
  };

  return (
    <section data-tone="dark" className="bg-graphite pb-6 md:pb-10">
      <div ref={frame} className="relative h-[78svh] w-full overflow-hidden bg-black md:h-svh">
        <video
          ref={video}
          src="/video/runwal-reel.mp4"
          poster="/images/company/brand/reel-poster.webp"
          muted
          loop
          playsInline
          preload="none"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/25" />
        <div className="absolute inset-x-6 top-8 flex items-start justify-between gap-6 text-white md:inset-x-10 md:top-28">
          <div>
            <p className="kicker">Brand film</p>
            <p className="title mt-4 max-w-xl text-3xl md:text-5xl">
              The art of <span className="accent">having it all.</span>
            </p>
          </div>
          <p className="kicker shrink-0 text-white/70">Runwal Realty &middot; 2025</p>
        </div>
        <div className="absolute bottom-8 right-6 flex text-white md:bottom-12 md:right-10">
          <div className="flex items-center gap-3">
            <button type="button" onClick={toggle} className="flex h-12 items-center gap-3 border border-white/30 px-5 text-sm backdrop-blur-md transition-colors hover:bg-white hover:text-graphite" aria-label={playing ? "Pause film" : "Play film"}>
              {playing ? (
                <span className="flex gap-1" aria-hidden>
                  <span className="h-3 w-0.5 bg-current" />
                  <span className="h-3 w-0.5 bg-current" />
                </span>
              ) : (
                <span className="size-0 border-y-[6px] border-l-[10px] border-y-transparent border-l-current" aria-hidden />
              )}
              {playing ? "Pause" : "Play"}
            </button>
            <button type="button" onClick={sound} className="flex h-12 items-center gap-3 border border-white/30 px-5 text-sm backdrop-blur-md transition-colors hover:bg-white hover:text-graphite" aria-label={muted ? "Turn sound on" : "Mute"}>
              <span className="flex h-3 items-end gap-[2px]" aria-hidden>
                {[0.4, 1, 0.6, 0.85].map((h, i) => (
                  <span key={i} className={`w-[2px] bg-current transition-all duration-500 ${muted ? "h-[2px]" : ""}`} style={muted ? undefined : { height: `${h * 100}%` }} />
                ))}
              </span>
              {muted ? "Sound off" : "Sound on"}
            </button>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/15">
          <div ref={bar} className="h-full origin-left scale-x-0 bg-amber" />
        </div>
      </div>
    </section>
  );
}
