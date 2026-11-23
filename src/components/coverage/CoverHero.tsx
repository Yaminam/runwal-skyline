import { Pic } from "../site/Pic";
import { TLink } from "../site/Transition";

type Crumb = { href?: string; label: string };

/**
 * Shared opening for the secondary pages: breadcrumb rail, a wide headline with one serif accent,
 * a short intro, and an optional full-bleed image that rises in and drifts on scroll.
 */
export function CoverHero({
  crumbs,
  kicker,
  title,
  accent,
  after,
  intro,
  image,
  imageAlt = "",
  meta,
}: {
  crumbs: Crumb[];
  kicker: string;
  title: string;
  accent?: string;
  after?: string;
  intro: React.ReactNode;
  image?: string;
  imageAlt?: string;
  meta?: React.ReactNode;
}) {
  return (
    <section className="relative bg-stone pt-28 md:pt-36">
      <div className="px-6 md:px-10">
        <div className="flex flex-col gap-2 border-b border-graphite/15 pb-5 md:flex-row md:items-center md:justify-between" data-fade>
          <nav aria-label="Breadcrumb" className="kicker flex flex-wrap items-center gap-2 text-mute">
            <TLink href="/" className="ulink hover:text-graphite">
              Home
            </TLink>
            {crumbs.map((c) => (
              <span key={c.label} className="flex items-center gap-2">
                <span aria-hidden>/</span>
                {c.href ? (
                  <TLink href={c.href} className="ulink hover:text-graphite">
                    {c.label}
                  </TLink>
                ) : (
                  <span className="text-graphite">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
          <p className="kicker text-dusk">{kicker}</p>
        </div>
        <div className="grid gap-10 py-12 md:grid-cols-12 md:py-16">
          <h1 className="display text-[10.5vw] md:col-span-8 md:text-[min(7.4vw,9rem)]" data-split="now">
            {title}
            {accent ? (
              <>
                {" "}
                <span className="accent normal-case">{accent}</span>
              </>
            ) : null}
            {after ? <> {after}</> : null}
          </h1>
          <div className="flex flex-col justify-end gap-6 md:col-span-4" data-fade>
            <div className="text-[0.98rem] leading-relaxed text-graphite-2">{intro}</div>
            {meta ? <div className="kicker text-mute">{meta}</div> : null}
          </div>
        </div>
      </div>
      {image ? (
        <div className="relative h-[46svh] overflow-hidden md:h-[70svh]" data-reveal-img>
          <div className="absolute inset-x-0 -inset-y-[12%]" data-parallax="8">
            <Pic src={image} alt={imageAlt} fill priority sizes="100vw" />
          </div>
        </div>
      ) : null}
    </section>
  );
}

/** Small "source" line linking back to the official page. */
export function SourceNote({ href, label = "runwalrealty.com" }: { href: string; label?: string }) {
  return (
    <p className="kicker mt-10 text-mute/80">
      Source:{" "}
      <a href={href} target="_blank" rel="noreferrer" className="ulink hover:text-graphite">
        {label} &#8599;
      </a>
    </p>
  );
}
