import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AnyHour } from "@/components/residences/AnyHour";
import { ExplorerSection } from "@/components/residences/ExplorerSection";
import { Gallery } from "@/components/residences/Gallery";
import { HeroFade } from "@/components/residences/HeroFade";
import { HeroZoom } from "@/components/residences/HeroZoom";
import { PageFx } from "@/components/site/PageFx";
import { Pic } from "@/components/site/Pic";
import { TLink } from "@/components/site/Transition";
import { bhkLabel, carpetSpan } from "@/lib/project-format";
import { ALL_PROJECTS, getProject, nextProject } from "@/lib/projects";

// Every slug is prerendered by generateStaticParams, so the page is fully static; skip the
// dev-time "params outside Suspense" navigation check.
export const instant = false;

export function generateStaticParams() {
  return ALL_PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/residences/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) return {};
  return {
    title: `${p.name}, ${p.area}`,
    description: p.description,
    openGraph: { title: `${p.name} | ${p.tagline}`, description: p.description, images: [p.images.hero] },
  };
}

export default async function ResidencePage({ params }: PageProps<"/residences/[slug]">) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) notFound();
  const next = nextProject(p.slug);
  const carpet = carpetSpan(p);
  const isHome = p.kind === "Residential";

  return (
    <>
      <PageFx />

      {/* Hero */}
      <section data-tone="dark" className="relative h-svh min-h-[40rem] overflow-hidden bg-graphite text-stone">
        <HeroZoom>
          <Pic src={p.images.hero} alt={`${p.name}, ${p.area}: artist's impression`} fill priority sizes="100vw" />
        </HeroZoom>
        <div className="absolute inset-0 bg-gradient-to-t from-graphite/85 via-graphite/15 to-graphite/35" />
        <div className="absolute inset-x-6 bottom-10 md:inset-x-10 md:bottom-14">
          <HeroFade delay={0.2}>
            <p className="kicker mb-6 flex items-center gap-3">
              <span className="live-dot inline-block size-1.5 rounded-full bg-amber" />
              {p.region} &middot; {p.area} &middot; {p.status}
            </p>
          </HeroFade>
          <h1 className="display text-[16vw] md:text-[min(11vw,13rem)]" data-split="now">
            {p.short}
          </h1>
          <HeroFade className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between" delay={0.7}>
            <p className="max-w-xl text-2xl leading-snug md:text-3xl">
              <span className="accent">{p.tagline}</span>
            </p>
            <div className="flex items-center gap-3">
              <TLink href={`/enquire?project=${p.slug}`} className="group inline-flex items-center gap-3 bg-stone px-6 py-4 text-sm font-medium text-graphite transition-colors hover:bg-amber">
                Book a site visit
                <span className="transition-transform duration-500 group-hover:translate-x-1">&rarr;</span>
              </TLink>
            </div>
          </HeroFade>
        </div>
      </section>

      {/* Key facts */}
      <section className="border-b border-graphite/10 px-6 md:px-10" aria-label="Key facts">
        <dl className="grid grid-cols-2 divide-graphite/10 md:grid-cols-3 lg:grid-cols-6 lg:divide-x">
          <div className="py-8 lg:pr-6">
            <dt className="kicker text-mute">{isHome ? "Residences" : "Offices"}</dt>
            <dd className="title mt-3 text-xl">{bhkLabel(p)}</dd>
          </div>
          <div className="py-8 lg:px-6">
            <dt className="kicker text-mute">Carpet</dt>
            <dd className="title mt-3 whitespace-nowrap text-xl">{carpet ?? "On request"}</dd>
          </div>
          <div className="py-8 lg:px-6">
            <dt className="kicker text-mute">Starting</dt>
            <dd className="title mt-3 text-xl">{p.priceFrom ?? "On request"}</dd>
          </div>
          {p.facts.slice(0, 2).map((f) => (
            <div key={f.label} className="py-8 lg:px-6">
              <dt className="kicker text-mute">{f.label}</dt>
              <dd className="title mt-3 text-xl">{f.value}</dd>
            </div>
          ))}
          <div className="col-span-2 py-8 md:col-span-1 lg:pl-6">
            <dt className="kicker text-mute">MahaRERA</dt>
            <dd className="mt-3">
              {p.rera.length ? (
                <span className="inline-flex items-center gap-2 border border-dusk/30 bg-dusk/5 px-3 py-2 text-dusk">
                  <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
                    <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                  <span className="font-mono text-[0.72rem] tracking-wide">{p.rera[0]}</span>
                  {p.rera.length > 1 && <span className="font-mono text-[0.72rem] opacity-60">+{p.rera.length - 1}</span>}
                </span>
              ) : (
                <span className="text-sm text-graphite-2">{p.kind === "Commercial" ? "Commercial, not applicable" : "On request"}</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      {/* Story */}
      <section className="grid gap-14 px-6 py-28 md:grid-cols-12 md:px-10 md:py-40">
        <div className="md:col-span-5">
          <div className="md:sticky md:top-32">
            <p className="kicker mb-6 text-dusk" data-fade>
              {p.name}
            </p>
            <h2 className="title text-4xl md:text-[3.4rem]" data-split>
              {p.headline || p.tagline}
            </h2>
            {p.lines[0] && (
              <p className="mt-8 max-w-md border-l border-amber pl-5 text-lg leading-relaxed text-graphite-2" data-fade>
                <span className="accent text-2xl text-graphite">&ldquo;{p.lines[0]}&rdquo;</span>
              </p>
            )}
          </div>
        </div>
        <div className="md:col-span-6 md:col-start-7">
          <p className="text-xl leading-relaxed md:text-[1.45rem] md:leading-[1.55]" data-fade>
            {p.description}
          </p>
          <div className="mt-14 grid grid-cols-5 gap-4">
            {p.images.feature && (
              <div className="relative col-span-3 aspect-[4/5] overflow-hidden" data-reveal-img>
                <Pic src={p.images.feature} alt={`${p.name}: artist's impression`} fill sizes="(min-width: 768px) 30vw, 60vw" />
              </div>
            )}
            {p.images.overview && (
              <div className={`relative ${p.images.feature ? "col-span-2 mt-24" : "col-span-5"} aspect-[3/4] overflow-hidden`} data-reveal-img>
                <Pic src={p.images.overview} alt={`${p.name}: overview`} fill sizes="(min-width: 768px) 20vw, 40vw" />
              </div>
            )}
          </div>
          {p.awards.length > 0 && (
            <ul className="mt-14 flex flex-col border-t border-graphite/15" aria-label="Awards">
              {p.awards.map((a) => (
                <li key={a} className="flex items-baseline gap-4 border-b border-graphite/15 py-4 text-sm" data-fade>
                  <span className="kicker text-amber-deep">Award</span>
                  {a}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <AnyHour slug={p.slug} name={p.name} short={p.short} lines={p.lines} tagline={p.tagline} feature={p.images.feature} hero={p.images.hero} />

      <ExplorerSection project={p} />

      <Gallery name={p.name} images={p.images.gallery} />

      {/* Amenities */}
      {p.amenities.length > 0 && (
        <section className="px-6 py-28 md:px-10 md:py-40" aria-labelledby="amen-h">
          <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h2 id="amen-h" className="display max-w-[12ch] text-[11vw] md:text-[min(5.6vw,6.6rem)]" data-split>
              Life, <span className="accent">included</span>
            </h2>
            <p className="kicker text-mute" data-fade>
              {String(p.amenities.length).padStart(2, "0")} highlights
            </p>
          </div>
          <ol className="grid border-t border-graphite/15 sm:grid-cols-2 lg:grid-cols-3">
            {p.amenities.map((a, i) => (
              <li key={a} className="group relative flex items-baseline gap-5 border-b border-graphite/15 py-6 pr-6 sm:[&:nth-child(odd)]:border-r lg:border-r lg:[&:nth-child(3n)]:!border-r-0 lg:pl-6 lg:[&:nth-child(3n+1)]:pl-0" data-fade>
                <span className="kicker text-mute transition-colors group-hover:text-dusk">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-lg transition-transform duration-500 group-hover:translate-x-1">{a}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Location */}
      <section data-tone="dark" className="blueprint-dark grid gap-14 bg-graphite px-6 py-28 text-stone md:grid-cols-12 md:px-10 md:py-36" aria-labelledby="loc-h">
        <div className="md:col-span-5">
          <p className="kicker mb-6 text-amber" data-fade>
            {p.lat.toFixed(3)}&deg; N &middot; {p.lon.toFixed(3)}&deg; E
          </p>
          <h2 id="loc-h" className="display text-[11vw] md:text-[min(5vw,6rem)]" data-split>
            {p.area}
          </h2>
          <p className="mt-8 max-w-sm text-[0.95rem] leading-relaxed text-stone/70" data-fade>
            {p.address}
          </p>
        </div>
        <ul className="md:col-span-6 md:col-start-7">
          {p.connectivity.map((c, i) => (
            <li key={c} className="flex gap-5 border-b border-stone/15 py-5 text-[1.02rem] leading-relaxed" data-fade>
              <span className="kicker mt-1.5 text-stone/40">{String(i + 1).padStart(2, "0")}</span>
              {c}
            </li>
          ))}
        </ul>
      </section>

      {/* Visit */}
      <section className="grid gap-12 px-6 py-28 md:grid-cols-12 md:px-10 md:py-36">
        <div className="md:col-span-7">
          <h2 className="display text-[12vw] md:text-[min(6.4vw,7.6rem)]" data-split>
            Walk the <span className="accent">site</span>.
          </h2>
          <p className="mt-8 max-w-md text-[1.02rem] leading-relaxed text-graphite-2" data-fade>
            Our team will host you at {p.name}, walk you through the sample residence and answer everything, with no pressure and no follow-up you didn&rsquo;t ask for.
          </p>
          <div className="mt-10 flex flex-wrap gap-3" data-fade>
            <TLink href={`/enquire?project=${p.slug}`} className="group inline-flex items-center gap-3 bg-graphite px-7 py-4 text-sm font-medium text-stone transition-colors hover:bg-dusk">
              Book a private visit
              <span className="transition-transform duration-500 group-hover:translate-x-1">&rarr;</span>
            </TLink>
            <a href="tel:02262328585" className="border border-graphite/25 px-7 py-4 text-sm font-medium transition-colors hover:border-graphite">
              022 6232 8585
            </a>
          </div>
        </div>
        {p.rera.length > 0 && (
          <div className="self-end md:col-span-4 md:col-start-9" data-fade>
            <p className="kicker text-mute">MahaRERA registration</p>
            <ul className="mt-4 border-t border-graphite/15">
              {p.rera.map((r) => (
                <li key={r} className="flex items-center justify-between border-b border-graphite/15 py-3 font-mono text-[0.8rem]">
                  {r}
                  <span className="text-dusk">&#10003;</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-mute">
              Available at maharera.maharashtra.gov.in. Images are artist&rsquo;s impressions. Prices are starting prices, T&amp;C apply.
            </p>
          </div>
        )}
      </section>

      {/* Next */}
      <TLink href={`/residences/${next.slug}`} className="group relative block h-[70vh] overflow-hidden bg-graphite text-stone" data-tone="dark">
        <div className="absolute inset-0 scale-105 opacity-50 transition-[transform,opacity] duration-[1.6s] ease-[var(--ease-out-expo)] group-hover:scale-100 group-hover:opacity-80">
          <Pic src={next.images.hero} alt="" fill sizes="100vw" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-graphite/80 to-graphite/20" />
        <div className="absolute inset-x-6 bottom-10 flex items-end justify-between gap-6 md:inset-x-10 md:bottom-14">
          <div>
            <p className="kicker mb-4 text-amber">Next &middot; {next.area}</p>
            <p className="display text-[14vw] transition-transform duration-1000 ease-[var(--ease-out-expo)] group-hover:translate-x-4 md:text-[min(9vw,10rem)]">{next.short}</p>
          </div>
          <span className="mb-4 flex size-16 shrink-0 items-center justify-center border border-stone/30 text-xl transition-colors duration-500 group-hover:border-amber group-hover:bg-amber group-hover:text-graphite">&rarr;</span>
        </div>
      </TLink>
    </>
  );
}
