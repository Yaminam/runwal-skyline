"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, type ComponentProps } from "react";
import { closeGate, openGate } from "@/lib/gate";
import { prefersReducedMotion } from "@/lib/motion";
import { scrollToEl, scrollToTop } from "../SmoothScroll";

type Ctx = { go: (href: string) => void };
const TransitionCtx = createContext<Ctx>({ go: () => {} });
export const useTransition = () => useContext(TransitionCtx);

const LABELS: Record<string, string> = {
  "/": "Runwal",
  "/residences": "Residences",
  "/legacy": "Legacy",
  "/places": "Places",
  "/enquire": "Enquire",
  "/insights": "Insights",
  "/customers": "Customer Corner",
  "/nri": "NRI Corner",
  "/club-oasis": "Club Oasis",
  "/investors": "Investors",
  "/careers": "Careers",
  "/contact": "Contact",
  "/faq": "FAQs",
  "/about/csr": "CSR",
};

function labelFor(path: string) {
  if (LABELS[path]) return LABELS[path];
  if (path.startsWith("/residences/")) return "Residence";
  return "Runwal";
}

const SLATS = 7;

/**
 * Page change as a building going up: graphite slats rise floor by floor to cover the screen,
 * the destination name and a floor counter read out, then the slats lift away from the top down.
 */
export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const pending = useRef(false);
  const busy = useRef(false);

  const go = useCallback(
    (href: string) => {
      const path = href.split(/[?#]/)[0] || "/";
      if (busy.current) return;
      if (path === pathname) {
        const hash = href.includes("#") ? href.slice(href.indexOf("#")) : "";
        if (href.includes("?") || hash) router.push(href, { scroll: false });
        if (hash.length > 1) setTimeout(() => scrollToEl(hash, -90), 60);
        return;
      }
      if (prefersReducedMotion() || !root.current) {
        router.push(href);
        return;
      }
      busy.current = true;
      pending.current = true;
      closeGate();
      if (label.current) label.current.textContent = labelFor(path);
      const slats = root.current.querySelectorAll(".tr-slat");
      gsap
        .timeline()
        .set(root.current, { visibility: "visible" })
        .fromTo(slats, { scaleY: 0, transformOrigin: "50% 100%" }, { scaleY: 1, duration: 0.6, ease: "expo.inOut", stagger: { each: 0.045, from: "end" } }, 0)
        .fromTo(label.current, { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: "expo.out" }, 0.35)
        .fromTo(".tr-meta", { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.4)
        .add(() => router.push(href), 0.75);
    },
    [pathname, router],
  );

  // New page mounted under the cover: reset scroll, then lift the slats away.
  useEffect(() => {
    if (!pending.current) return;
    pending.current = false;
    scrollToTop();
    const el = root.current;
    if (!el) return;
    const slats = el.querySelectorAll(".tr-slat");
    const id = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      // honour #anchors on the destination page (e.g. /legacy#awards)
      const hash = window.location.hash;
      if (hash.length > 1) setTimeout(() => scrollToEl(hash, -90), 700);
      gsap
        .timeline({ delay: 0.2 })
        .to(label.current, { yPercent: -110, duration: 0.5, ease: "expo.in" }, 0)
        .to(".tr-meta", { opacity: 0, duration: 0.3 }, 0)
        .to(slats, { scaleY: 0, transformOrigin: "50% 0%", duration: 0.7, ease: "expo.inOut", stagger: { each: 0.045, from: "start" } }, 0.25)
        .add(() => openGate(), 0.6)
        .set(el, { visibility: "hidden" })
        .add(() => {
          busy.current = false;
        });
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <TransitionCtx.Provider value={{ go }}>
      {children}
      <div ref={root} aria-hidden className="invisible fixed inset-0 z-70 flex flex-col">
        {Array.from({ length: SLATS }, (_, i) => (
          <div key={i} className="tr-slat -my-px flex-1 origin-bottom scale-y-0 bg-graphite" />
        ))}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-stone">
          <span className="overflow-hidden">
            <span ref={label} className="display block text-[13vw] md:text-[min(8vw,9rem)]">
              Runwal
            </span>
          </span>
          <span className="tr-meta kicker absolute bottom-10 left-6 text-stone/60 md:left-10">Runwal Realty &middot; Since 1978</span>
          <span className="tr-meta kicker absolute bottom-10 right-6 text-amber md:right-10">Mumbai &middot; Thane &middot; Pune</span>
        </div>
      </div>
    </TransitionCtx.Provider>
  );
}

/** Internal link that plays the transition. Falls back to normal behaviour for new-tab clicks. */
export function TLink({ href, onClick, ...rest }: ComponentProps<typeof Link> & { href: string }) {
  const { go } = useTransition();
  return (
    <Link
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        go(href);
      }}
      {...rest}
    />
  );
}
