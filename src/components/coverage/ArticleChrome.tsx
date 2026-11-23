"use client";

import { useEffect, useRef, useState } from "react";
import { scrollToEl } from "../SmoothScroll";
import { useTransition } from "../site/Transition";

/**
 * Reading furniture for an article: a dusk progress line pinned under the nav, the contents list
 * that tracks the section you are in, and internal links inside the article text routed through the
 * page transition.
 */
export function ArticleChrome({ toc, children }: { toc: { id: string; label: string }[]; children: React.ReactNode }) {
  const body = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(toc[0]?.id ?? null);
  const { go } = useTransition();

  useEffect(() => {
    const el = body.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (window.innerHeight * 0.35 - r.top) / r.height));
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      let cur: string | null = null;
      for (const t of toc) {
        const h = document.getElementById(t.id);
        if (h && h.getBoundingClientRect().top < window.innerHeight * 0.3) cur = t.id;
      }
      setActive((a) => (a === cur ? a : cur ?? toc[0]?.id ?? null));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [toc]);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px]" aria-hidden>
        <div ref={bar} className="dusk-line h-full origin-left scale-x-0" />
      </div>
      <div className="grid gap-12 lg:grid-cols-12">
        {toc.length > 1 ? (
          <aside className="hidden lg:col-span-3 lg:block">
            <nav aria-label="In this article" className="sticky top-28">
              <p className="kicker text-mute">In this article</p>
              <ol className="mt-5 flex flex-col gap-3 border-l border-graphite/15">
                {toc.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => scrollToEl(`#${t.id}`, -110)}
                      className={`-ml-px border-l-2 pl-4 text-left text-sm leading-snug transition-colors ${active === t.id ? "border-dusk text-graphite" : "border-transparent text-mute hover:text-graphite"}`}
                    >
                      {t.label}
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>
        ) : null}
        <div
          ref={body}
          className={`min-w-0 ${toc.length > 1 ? "lg:col-span-8 lg:col-start-5" : "lg:col-span-8 lg:col-start-3"}`}
          onClick={(e) => {
            const a = (e.target as HTMLElement).closest("a[data-internal]");
            if (!a || e.metaKey || e.ctrlKey) return;
            e.preventDefault();
            go(a.getAttribute("href") || "/");
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}

/** Share: copy link, WhatsApp, LinkedIn, X. */
export function ShareBar({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const url = () => (typeof window === "undefined" ? "" : window.location.href);
  const open = (u: string) => window.open(u, "_blank", "noopener,noreferrer");
  const btn = "kicker border border-graphite/20 px-3.5 py-2.5 transition-colors hover:border-graphite hover:text-graphite";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="kicker mr-2 text-mute">Share</span>
      <button
        type="button"
        className={btn}
        onClick={() =>
          navigator.clipboard?.writeText(url()).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          })
        }
      >
        {copied ? "Copied" : "Copy link"}
      </button>
      <button type="button" className={btn} onClick={() => open(`https://wa.me/?text=${encodeURIComponent(`${title} ${url()}`)}`)}>
        WhatsApp
      </button>
      <button type="button" className={btn} onClick={() => open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url())}`)}>
        LinkedIn
      </button>
      <button type="button" className={btn} onClick={() => open(`https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url())}`)}>
        X
      </button>
    </div>
  );
}
