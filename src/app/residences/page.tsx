import type { Metadata } from "next";
import { ResidencesBrowser } from "@/components/residences/ResidencesBrowser";
import { PageFx } from "@/components/site/PageFx";
import { Pic } from "@/components/site/Pic";
import { TLink } from "@/components/site/Transition";
import { COMMERCIAL, PROJECTS } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Residences",
  description:
    "Every ongoing Runwal residence across Mumbai, Thane and Pune: Runwal Malabar, Raaya, Timeless, Rare, Auris, Sanctuary, One, Zenith, Lands End and The Central Park.",
};

export default function ResidencesPage() {
  const cities = new Set(PROJECTS.map((p) => p.city)).size;
  return (
    <>
      <PageFx />
      <section className="relative px-6 pb-10 pt-36 md:px-10 md:pt-44">
        <div className="blueprint pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" aria-hidden />
        <div className="relative">
          <p className="kicker mb-8 flex items-center gap-3" data-fade>
            <span className="live-dot inline-block size-1.5 rounded-full bg-amber" /> Residences &middot; {PROJECTS.length} ongoing addresses &middot; {cities} cities
          </p>
          <h1 className="display max-w-[14ch] text-[13vw] md:text-[min(8.6vw,10rem)]" data-split="now">
            Every address, a <span className="accent">legacy</span>.
          </h1>
          <div className="mt-12 grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
            <p className="max-w-xl text-[1.02rem] leading-relaxed text-graphite-2" data-fade>
              From 11 sky mansions on Malabar Hill to 26-acre townships in Pune, each Runwal residence is planned around the way families actually live: light, air, views and time.
            </p>
            <dl className="grid grid-cols-3 gap-8 border-t border-graphite/15 pt-6 md:min-w-[30rem]" data-fade>
              <div>
                <dt className="kicker text-mute">Since</dt>
                <dd className="title mt-2 text-3xl">1978</dd>
              </div>
              <div>
                <dt className="kicker text-mute">Delivered</dt>
                <dd className="title mt-2 text-3xl">35</dd>
              </div>
              <div>
                <dt className="kicker text-mute">Ongoing</dt>
                <dd className="title mt-2 text-3xl">17</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="px-6 pb-32 pt-6 md:px-10" aria-label="All residences">
        <ResidencesBrowser />
      </section>

      {/* Commercial */}
      <section data-tone="dark" className="blueprint-dark bg-graphite px-6 py-28 text-stone md:px-10 md:py-36" aria-labelledby="work-h">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="kicker mb-6 text-amber" data-fade>
              Commercial &middot; R Square
            </p>
            <h2 id="work-h" className="display max-w-[12ch] text-[11vw] md:text-[min(6vw,7rem)]" data-split>
              Addresses for <span className="accent">ambition</span>
            </h2>
          </div>
          <p className="max-w-sm text-[0.95rem] leading-relaxed text-stone/70" data-fade>
            IGBC Gold-certified offices in Andheri and ready-to-move boutique offices in Mulund, built with the same care as our homes.
          </p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {COMMERCIAL.map((p, i) => (
            <TLink key={p.slug} href={`/residences/${p.slug}`} className="group block" data-fade>
              <div className="relative aspect-[16/9] overflow-hidden">
                <Pic src={p.images.hero} alt={`${p.name}, ${p.area}`} fill sizes="(min-width: 768px) 50vw, 100vw" className="transition-transform duration-[1.6s] ease-[var(--ease-out-expo)] group-hover:scale-[1.05]" />
                <div className="absolute inset-0 bg-gradient-to-t from-graphite/80 via-graphite/10 to-transparent" />
                <div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="kicker text-amber">
                      {String(i + 1).padStart(2, "0")} &middot; {p.area}
                    </p>
                    <h3 className="title mt-2 text-3xl md:text-4xl">{p.short}</h3>
                    <p className="mt-2 text-sm text-stone/75">{p.tagline}</p>
                  </div>
                  <span className="flex size-12 shrink-0 items-center justify-center border border-stone/30 transition-colors duration-500 group-hover:border-amber group-hover:bg-amber group-hover:text-graphite">&rarr;</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 border-t border-stone/15 pt-4">
                {p.facts.map((f) => (
                  <div key={f.label}>
                    <p className="kicker text-stone/50">{f.label}</p>
                    <p className="mt-1.5 text-sm">{f.value}</p>
                  </div>
                ))}
              </div>
            </TLink>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-start gap-8 px-6 py-28 md:flex-row md:items-end md:justify-between md:px-10 md:py-36">
        <h2 className="display max-w-[16ch] text-[10vw] md:text-[min(5.4vw,6.4rem)]" data-split>
          See it in <span className="accent">person</span>.
        </h2>
        <div className="flex flex-wrap gap-3" data-fade>
          <TLink href="/enquire" className="group inline-flex items-center gap-3 bg-graphite px-7 py-4 text-sm font-medium text-stone transition-colors hover:bg-dusk">
            Book a private site visit
            <span className="transition-transform duration-500 group-hover:translate-x-1">&rarr;</span>
          </TLink>
          <a href="tel:02262328585" className="border border-graphite/25 px-7 py-4 text-sm font-medium transition-colors hover:border-graphite">
            Call 022 6232 8585
          </a>
        </div>
      </section>
    </>
  );
}
