import { COMMERCIAL, HOSPITALITY, IPO, RETAIL, UPCOMING } from "@/lib/company";
import { Pic } from "../site/Pic";
import { TLink } from "../site/Transition";

export function PlacesHero() {
  return (
    <section className="relative bg-stone pt-28 md:pt-32">
      <div className="px-6 md:px-10">
        <div className="flex items-center justify-between border-b border-graphite/15 pb-5" data-fade>
          <p className="kicker">Places &middot; Beyond the home</p>
          <p className="kicker hidden md:block">Commercial &middot; Retail &middot; Hospitality</p>
        </div>
        <div className="grid gap-10 py-12 md:grid-cols-12 md:py-16">
          <h1 className="display text-[14vw] md:col-span-9 md:text-[min(8.4vw,10rem)]" data-split="now">
            Where Mumbai works, shops <span className="accent normal-case">and stays.</span>
          </h1>
          <div className="flex flex-col justify-end gap-6 md:col-span-3" data-fade>
            <p className="text-[0.98rem] leading-relaxed text-graphite-2">
              Grade A offices, the malls the Eastern suburbs grew up in, and a new hospitality portfolio from Worli to Alibaug.
            </p>
            <p className="kicker text-mute">2.89 mn sq ft of commercial &amp; retail across MMR</p>
          </div>
        </div>
      </div>
      <div className="relative h-[62svh] overflow-hidden md:h-[84svh]" data-reveal-img>
        <div className="absolute inset-x-0 -inset-y-[12%]" data-parallax="8">
          <Pic src="/images/company/retail/banner.webp" alt="Runwal organised retail destinations" fill priority sizes="100vw" />
        </div>
      </div>
    </section>
  );
}

export function Commercial() {
  return (
    <section className="bg-stone px-6 py-28 md:px-10 md:py-40" aria-labelledby="commercial-h">
      <div className="mb-16 flex flex-col justify-between gap-6 md:mb-24 md:flex-row md:items-end">
        <div>
          <p className="kicker text-dusk" data-fade>
            01 &middot; Commercial
          </p>
          <h2 id="commercial-h" className="display mt-5 text-[12vw] md:text-[min(6vw,7rem)]" data-split>
            Addresses for <span className="accent normal-case">ambition</span>
          </h2>
        </div>
        <p className="max-w-sm text-[0.95rem] leading-relaxed text-mute" data-fade>
          R Square: IGBC-certified offices in Andheri and Mulund, from 50,000 sq ft floor plates to self-contained boutique suites.
        </p>
      </div>

      <div className="flex flex-col gap-28 md:gap-40">
        {COMMERCIAL.map((c, i) => (
          <article key={c.slug} className="grid items-center gap-10 md:grid-cols-12">
            <div className={`relative md:col-span-7 ${i % 2 ? "md:order-2 md:col-start-6" : ""}`}>
              <div className="relative aspect-[16/10] overflow-hidden bg-stone-2" data-reveal-img>
                <div className="absolute inset-x-0 -inset-y-[10%]" data-parallax="6">
                  <Pic src={c.image} alt={c.name} fill sizes="(min-width: 768px) 58vw, 100vw" />
                </div>
              </div>
              <div
                className={`absolute -bottom-10 hidden aspect-[615/800] w-[26%] overflow-hidden border-8 border-stone shadow-[0_30px_60px_-30px_rgba(0,0,0,0.4)] md:block ${i % 2 ? "-left-10" : "-right-10"}`}
                data-tilt="6"
              >
                <Pic src={c.detail} alt={`${c.name} elevation`} fill sizes="18vw" />
              </div>
            </div>
            <div className={`md:col-span-4 ${i % 2 ? "md:order-1 md:col-start-1" : "md:col-start-9"}`}>
              <p className="kicker text-mute" data-fade>
                {c.area}
              </p>
              <h3 className="title mt-4 text-4xl md:text-5xl" data-fade>
                {c.name}
              </h3>
              <p className="accent mt-5 text-2xl leading-snug text-graphite-2" data-fade>
                {c.line}
              </p>
              <dl className="mt-8 grid grid-cols-2 border-t border-graphite/15" data-fade>
                {c.facts.map(([v, l]) => (
                  <div key={l} className="border-b border-graphite/15 py-4 pr-3">
                    <dt className="title text-xl">{v}</dt>
                    <dd className="mt-1 text-xs text-mute">{l}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 text-[0.95rem] leading-relaxed text-graphite-2" data-fade>
                {c.text}
              </p>
              <div className="mt-8 flex gap-3" data-fade>
                <TLink href={`/residences/${c.slug}`} className="group inline-flex items-center gap-3 bg-graphite px-5 py-3.5 text-sm font-medium text-stone transition-colors hover:bg-dusk">
                  Explore {c.name}
                  <span className="transition-transform duration-500 group-hover:translate-x-1">&rarr;</span>
                </TLink>
                <TLink href={`/enquire?project=${c.slug}`} className="border border-graphite/25 px-5 py-3.5 text-sm font-medium transition-colors hover:border-graphite">
                  Enquire
                </TLink>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function Retail() {
  const [feature, ...rest] = RETAIL;
  return (
    <section data-tone="dark" className="bg-graphite py-28 text-stone md:py-40" aria-labelledby="retail-h">
      <div className="px-6 md:px-10">
        <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="kicker text-amber" data-fade>
              02 &middot; Organised retail
            </p>
            <h2 id="retail-h" className="display mt-5 text-[12vw] md:text-[min(6vw,7rem)]" data-split>
              Since 2003, <span className="accent normal-case">the city&rsquo;s weekends</span>
            </h2>
          </div>
          <p className="max-w-sm text-[0.95rem] leading-relaxed text-stone/60" data-fade>
            Runwal opened R Mall Mulund in 2003 and R City in 2009. Millions of visits a year now pass through four Runwal destinations.
          </p>
        </div>

        {/* feature */}
        <article className="group relative overflow-hidden">
          <div className="relative aspect-[4/5] overflow-hidden md:aspect-[1183/500]" data-reveal-img>
            <div className="absolute inset-x-0 -inset-y-[10%]" data-parallax="6">
              <Pic src={feature.wide ?? feature.image} alt={feature.name} fill sizes="100vw" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          </div>
          <div className="absolute inset-x-6 bottom-6 flex flex-col gap-6 md:inset-x-10 md:bottom-10 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="kicker text-white/70">{feature.area}</p>
              <h3 className="display mt-3 text-6xl text-white md:text-8xl">{feature.name}</h3>
              <p className="mt-4 max-w-md text-white/80">{feature.line}</p>
            </div>
            <ul className="flex flex-wrap gap-2">
              {feature.facts.map((f) => (
                <li key={f} className="kicker border border-white/25 px-3 py-2 text-white/85 backdrop-blur-md">
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </article>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {rest.map((r, i) => (
            <article key={r.name} className="group" data-fade>
              <div className="relative aspect-[1070/565] overflow-hidden bg-graphite-2">
                <Pic src={r.image} alt={r.name} fill sizes="(min-width: 768px) 32vw, 100vw" className="transition-transform duration-[1.4s] ease-[var(--ease-out-expo)] group-hover:scale-[1.05]" />
                <span className="kicker absolute left-3 top-3 bg-graphite/70 px-2 py-1 text-stone backdrop-blur">0{i + 2}</span>
              </div>
              <div className="flex items-baseline justify-between border-b border-stone/15 py-4">
                <h3 className="title text-2xl">{r.name}</h3>
                <p className="kicker text-stone/50">{r.area}</p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-stone/60">{r.line}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Hospitality() {
  return (
    <section className="bg-stone px-6 py-28 md:px-10 md:py-40" aria-labelledby="hosp-h">
      <div className="grid gap-14 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="kicker text-dusk" data-fade>
            03 &middot; Hospitality
          </p>
          <h2 id="hosp-h" className="display mt-5 text-[12vw] md:text-[min(5.6vw,6.6rem)]" data-split>
            Now, <span className="accent normal-case">hotels</span>
          </h2>
          <p className="mt-8 max-w-sm text-[0.98rem] leading-relaxed text-graphite-2" data-fade>
            {HOSPITALITY.text}
          </p>
        </div>
        <ol className="md:col-span-6 md:col-start-7">
          {HOSPITALITY.places.map((p, i) => (
            <li key={p.name} className="group relative border-b border-graphite/15 first:border-t" data-fade>
              <div className="relative z-10 flex items-baseline gap-6 py-7 transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:translate-x-3">
                <span className="kicker w-8 text-mute">0{i + 1}</span>
                <span className="display flex-1 text-5xl md:text-7xl">{p.name}</span>
                <span className="kicker text-mute">{p.note}</span>
              </div>
              <span className="dusk-line absolute bottom-[-1px] left-0 h-px w-full origin-left scale-x-0 transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-x-100" />
            </li>
          ))}
          <li className="kicker flex items-center gap-3 pt-6 text-mute" data-fade>
            <span className="live-dot inline-block size-1.5 rounded-full bg-amber" /> In development
          </li>
        </ol>
      </div>
    </section>
  );
}

export function DrawingBoard() {
  return (
    <section className="blueprint border-t border-graphite/10 bg-paper px-6 py-28 md:px-10 md:py-36" aria-labelledby="next-h">
      <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="kicker text-mute" data-fade>
            04 &middot; On the drawing board
          </p>
          <h2 id="next-h" className="display mt-5 text-[12vw] md:text-[min(5.6vw,6.6rem)]" data-split>
            24 more <span className="accent normal-case">addresses</span>
          </h2>
        </div>
        <p className="max-w-sm text-[0.95rem] leading-relaxed text-graphite-2" data-fade>
          4.2 acres acquired in South &amp; Central Mumbai and five redevelopment projects of 2.14 mn sq ft in the western suburbs. Among them:
        </p>
      </div>
      <div className="grid grid-cols-2 gap-px border border-graphite/15 bg-graphite/15 md:grid-cols-4">
        {UPCOMING.map((u) => (
          <article key={u.name} className="group flex flex-col bg-paper p-5" data-fade>
            <div className="relative aspect-square overflow-hidden">
              {u.image ? (
                <Pic src={u.image} alt={`${u.name} sketch`} fill sizes="(min-width: 768px) 24vw, 48vw" contain className="mix-blend-multiply transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-105" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="display text-7xl text-graphite/10">R</span>
                </div>
              )}
            </div>
            <p className="title mt-4 text-lg">{u.name}</p>
            <p className="kicker mt-1 text-mute">{u.area}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function Investors() {
  return (
    <section data-tone="dark" className="bg-night px-6 py-24 text-stone md:px-10 md:py-32" aria-labelledby="ipo-h">
      <div className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="kicker text-amber">Investors</p>
          <h2 id="ipo-h" className="title mt-5 text-4xl md:text-6xl">
            Draft Red Herring Prospectus <span className="accent">filed with SEBI.</span>
          </h2>
        </div>
        <dl className="grid grid-cols-2 gap-px self-end bg-stone/10 md:col-span-6 md:col-start-7">
          {[
            ["Filed", IPO.date],
            ["Proposed issue", IPO.size],
            ["Structure", IPO.structure],
            ["Listing", IPO.listing],
          ].map(([k, v]) => (
            <div key={k} className="bg-night p-5">
              <dt className="kicker text-stone/45">{k}</dt>
              <dd className="mt-2 text-[0.98rem] leading-snug">{v}</dd>
            </div>
          ))}
          <div className="col-span-2 flex flex-col justify-between gap-4 bg-night p-5 md:flex-row md:items-center">
            <p className="text-sm text-stone/55">Book running lead managers: {IPO.managers.join(", ")}.</p>
            <a href={IPO.url} target="_blank" rel="noreferrer" className="kicker ulink shrink-0 text-amber">
              Read the DRHP on SEBI &nearr;
            </a>
          </div>
        </dl>
      </div>
    </section>
  );
}
