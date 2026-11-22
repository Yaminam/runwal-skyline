"use client";

import { usePathname } from "next/navigation";
import { CONTACT, RERA_NOTE, SOCIALS } from "@/lib/company";
import { getLenis } from "../SmoothScroll";
import { RunwalMark, RunwalWords } from "./BrandLogo";
import { TLink } from "./Transition";

const SITEMAP = [
  {
    title: "Residences",
    links: [
      { href: "/residences/runwal-malabar", label: "Runwal Malabar" },
      { href: "/residences/runwal-raaya", label: "Runwal Raaya" },
      { href: "/residences/runwal-auris", label: "Runwal Auris" },
      { href: "/residences/runwal-one", label: "Runwal One" },
      { href: "/residences", label: "All residences" },
    ],
  },
  {
    title: "Runwal",
    links: [
      { href: "/legacy", label: "Legacy" },
      { href: "/places", label: "Offices & retail" },
      { href: "/places#hosp-h", label: "Hospitality" },
      { href: "/enquire", label: "Book a site visit" },
    ],
  },
];

export function Footer() {
  const pathname = usePathname();
  // the enquiry page is a focused flow: keep its footer compact
  const compact = pathname === "/enquire";

  return (
    <footer data-tone="dark" className="relative overflow-hidden bg-graphite text-stone">
      {!compact && (
        <div className="grid gap-14 border-b border-stone/10 px-6 pb-16 pt-24 md:grid-cols-12 md:px-10 md:pt-32">
          <div className="md:col-span-5">
            <p className="kicker text-amber">Visit a Runwal home</p>
            <p className="title mt-5 text-4xl leading-tight md:text-5xl">
              Walk the floors <span className="accent">before you decide.</span>
            </p>
            <TLink href="/enquire" className="group mt-8 inline-flex items-center gap-3 bg-stone px-6 py-4 text-sm font-medium text-graphite transition-colors hover:bg-amber">
              Book a site visit
              <span className="transition-transform duration-500 group-hover:translate-x-1">&rarr;</span>
            </TLink>
          </div>

          {SITEMAP.map((col) => (
            <nav key={col.title} className="md:col-span-2" aria-label={col.title}>
              <p className="kicker text-stone/40">{col.title}</p>
              <ul className="mt-5 flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <TLink href={l.href} className="ulink text-[0.95rem] text-stone/80 hover:text-stone">
                      {l.label}
                    </TLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="md:col-span-3">
            <p className="kicker text-stone/40">Corporate office</p>
            <address className="mt-5 text-[0.95rem] not-italic leading-relaxed text-stone/80">
              {CONTACT.address.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </address>
            <ul className="mt-5 flex flex-col gap-1.5 text-[0.95rem]">
              <li>
                <span className="kicker mr-3 text-stone/40">Sales</span>
                <a href={`tel:${CONTACT.sales.replace(/-/g, "")}`} className="ulink">
                  {CONTACT.sales}
                </a>
              </li>
              <li>
                <span className="kicker mr-3 text-stone/40">Office</span>
                <a href={`tel:${CONTACT.phone.replace(/-/g, "")}`} className="ulink">
                  {CONTACT.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT.email}`} className="ulink">
                  {CONTACT.email}
                </a>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* giant wordmark */}
      {!compact && (
        <div className="relative px-6 pt-14 md:px-10 md:pt-20" aria-hidden>
          <RunwalWords className="h-auto w-full text-stone/[0.07]" />
          <div className="absolute inset-x-6 top-14 flex items-start justify-between md:inset-x-10 md:top-20">
            <RunwalMark className="h-10 w-auto text-amber md:h-14" />
            <p className="kicker text-stone/40">Built for generations &middot; Since 1978</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 px-6 py-8 md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <ul className="flex flex-wrap gap-6">
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noreferrer" className="kicker ulink text-stone/70 hover:text-stone">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => {
              const l = getLenis();
              if (l) l.scrollTo(0, { duration: 2 });
              else window.scrollTo({ top: 0, behavior: "smooth" });
            }} className="kicker group flex items-center gap-3 text-stone/70 transition-colors hover:text-amber">
            Back to top
            <span className="flex size-8 items-center justify-center rounded-full border border-stone/25 transition-all duration-500 group-hover:-translate-y-1 group-hover:border-amber">&uarr;</span>
          </button>
        </div>
        <p className="max-w-4xl text-xs leading-relaxed text-stone/40">
          {RERA_NOTE} Runwal Realty is the brand name of Runwal Developers Limited. Runwal Realty and Runwal Enterprises Limited are separate companies.
        </p>
        <div className="flex flex-wrap justify-between gap-3 border-t border-stone/10 pt-5 text-xs text-stone/40">
          <p>&copy; 2026 Runwal Developers Limited</p>
          <p>Concept demo by Garage Collective &middot; not the official website</p>
        </div>
      </div>
    </footer>
  );
}
