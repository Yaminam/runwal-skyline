"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CONTACT, ENQUIRY_PROJECTS, RERA_NOTE, SOCIALS } from "@/lib/company";
import { SECTIONS, type NavLink } from "@/lib/site-sections";
import { getLenis } from "../SmoothScroll";
import { RunwalMark, RunwalWords } from "./BrandLogo";
import { NightSkyline } from "./NightSkyline";
import { TLink } from "./Transition";

const CREDIT = "Buildings © OpenStreetMap contributors";

const HOMES = ENQUIRY_PROJECTS.filter((p) => p.kind === "home");
const SKYLINE_TOWERS = HOMES.map((p) => ({ slug: p.slug, name: p.name, area: p.area }));

const COLUMNS: Array<{ title: string; links: NavLink[] }> = [
  SECTIONS[0],
  {
    title: "Residences",
    links: [
      ...HOMES.slice(0, 6).map((p) => ({ href: `/residences/${p.slug}`, label: p.name.replace("Runwal ", "") })),
      { href: "/residences", label: "All residences" },
    ],
  },
  SECTIONS[1],
  SECTIONS[2],
  SECTIONS[3],
  SECTIONS[4],
];

/** Live Mumbai time for the bottom bar. */
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

/** A classic footer: brand and contact, a full sitemap, the night skyline, a legal bar. */
export function Footer() {
  const pathname = usePathname();
  const compact = pathname === "/enquire";
  const time = useMumbaiTime();

  const toTop = () => {
    const l = getLenis();
    if (l) l.scrollTo(0, { duration: 2 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const link =
    "group/l inline-flex items-center gap-1.5 text-[0.95rem] text-stone/70 transition-colors duration-300 hover:text-stone [background:linear-gradient(var(--color-amber),var(--color-amber))_left_bottom/0%_1px_no-repeat] hover:[background-size:100%_1px] [transition:background-size_.6s_var(--ease-out-expo),color_.3s]";

  return (
    <footer data-tone="dark" className="relative overflow-hidden bg-night text-stone">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber/60 to-transparent" aria-hidden />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[60%] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(242,166,90,0.12),transparent)]" aria-hidden />

      {!compact && (
        <div className="relative px-6 pt-16 md:px-10 md:pt-24">
          {/* brand + contact */}
          <div className="grid gap-10 border-b border-stone/10 pb-12 md:grid-cols-12 md:pb-16">
            <div className="md:col-span-5">
              <TLink href="/" className="inline-flex items-center gap-4" aria-label="Runwal Realty home">
                <RunwalMark className="h-14 w-auto text-stone" />
                <RunwalWords className="h-[1.9rem] w-auto text-stone" />
              </TLink>
              <p className="mt-6 max-w-sm text-[1rem] leading-relaxed text-stone/65">
                Homes, offices and city landmarks across Mumbai, Thane and Pune. <span className="text-stone/90">Building for generations since 1978.</span>
              </p>
              <TLink
                href="/enquire"
                className="group mt-8 inline-flex items-center gap-3 bg-amber px-6 py-4 text-[0.95rem] font-medium text-graphite transition-colors hover:bg-stone"
              >
                Book a private site visit
                <span className="transition-transform duration-500 group-hover:translate-x-1">&rarr;</span>
              </TLink>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:col-span-6 md:col-start-7">
              <a href={`tel:${CONTACT.sales.replace(/-/g, "")}`} className="group flex flex-col gap-2">
                <span className="kicker text-stone/40">Sales</span>
                <span className="title text-xl transition-colors group-hover:text-amber md:text-2xl">{CONTACT.sales}</span>
              </a>
              <a href={`tel:${CONTACT.phone.replace(/-/g, "")}`} className="group flex flex-col gap-2">
                <span className="kicker text-stone/40">Corporate office</span>
                <span className="title text-xl transition-colors group-hover:text-amber md:text-2xl">{CONTACT.phone}</span>
              </a>
              <a href={`mailto:${CONTACT.email}`} className="group col-span-2 flex min-w-0 flex-col gap-2 md:col-span-1">
                <span className="kicker text-stone/40">Write to us</span>
                <span className="truncate text-[1rem] text-stone/85 transition-colors group-hover:text-amber">{CONTACT.email}</span>
              </a>
              <a href={CONTACT.maps} target="_blank" rel="noreferrer" className="group col-span-2 flex flex-col gap-2 md:col-span-1">
                <span className="kicker text-stone/40">Head office &#8599;</span>
                <span className="text-[0.95rem] leading-relaxed text-stone/70 transition-colors group-hover:text-stone">
                  {CONTACT.address[0]}, {CONTACT.address[1]}, {CONTACT.address[2]}
                </span>
              </a>
            </div>
          </div>

          {/* sitemap */}
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 py-12 sm:grid-cols-3 md:py-16 lg:grid-cols-6">
            {COLUMNS.map((c, i) => (
              <div key={c.title}>
                <p className="kicker flex items-center gap-2 text-stone/40">
                  <span className="text-amber">{String(i + 1).padStart(2, "0")}</span>
                  {c.title}
                </p>
                <ul className="mt-5 flex flex-col gap-3">
                  {c.links.map((l) => (
                    <li key={`${l.href}-${l.label}`}>
                      <TLink href={l.href} className={link}>
                        {l.label}
                        <span className="-translate-x-1 text-amber opacity-0 transition-all duration-300 group-hover/l:translate-x-0 group-hover/l:opacity-100">&rarr;</span>
                      </TLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      )}

      {/* the city outside */}
      <div className="relative">
        <NightSkyline towers={SKYLINE_TOWERS} />
      </div>

      {/* legal bar */}
      <div className="relative border-t border-stone/10 px-6 py-8 md:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {SOCIALS.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="kicker text-stone/60 transition-colors hover:text-amber">
                {s.label} &#8599;
              </a>
            ))}
          </div>
          <div className="flex items-center justify-between gap-6 md:justify-end">
            <p className="kicker flex items-center gap-2 text-stone/50">
              <span className="live-dot inline-block size-1.5 rounded-full bg-amber" />
              Mumbai {time ? <span className="tabular-nums text-stone/80">{time} IST</span> : null}
            </p>
            <button
              type="button"
              onClick={toTop}
              aria-label="Back to top"
              className="group flex size-11 items-center justify-center rounded-full border border-stone/20 transition-colors hover:border-amber hover:text-amber"
            >
              <span className="transition-transform duration-500 group-hover:-translate-y-0.5">&uarr;</span>
            </button>
          </div>
        </div>
        <p className="mt-8 max-w-4xl text-xs leading-relaxed text-stone/40">
          {RERA_NOTE} Runwal Realty is the brand name of Runwal Developers Limited. Runwal Realty and Runwal Enterprises Limited are separate companies.
        </p>
        <div className="mt-4 flex flex-col gap-2 text-xs text-stone/40 md:flex-row md:justify-between">
          <p>&copy; 2026 Runwal Developers Limited</p>
          <p>{CREDIT}</p>
          <p>Concept demo by Garage Collective &middot; not the official website</p>
        </div>
      </div>
    </footer>
  );
}
