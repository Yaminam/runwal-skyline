import { Magnetic } from "../site/Magnetic";
import { TLink } from "../site/Transition";

const OUTLETS = ["The Economic Times", "Hindustan Times", "Times of India", "Forbes India", "Moneycontrol", "Mint", "CNBC-TV18", "Business Today", "PTI", "Free Press Journal", "Construction World"];

/** Press strip, then the invitation to visit. */
export function Closing() {
  return (
    <>
      <section className="border-y border-graphite/10 bg-paper py-8" aria-label="In the press">
        <div className="flex overflow-hidden">
          <div className="marquee flex shrink-0 items-center gap-14 pr-14">
            {[...OUTLETS, ...OUTLETS].map((o, i) => (
              <span key={i} className="flex items-center gap-14 whitespace-nowrap">
                <span className="title text-xl text-graphite/70 md:text-2xl">{o}</span>
                <span className="size-1.5 rotate-45 bg-amber" aria-hidden />
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-stone px-6 py-32 text-center md:px-10 md:py-48">
        <p className="kicker mb-8 text-dusk">Visit a Runwal home</p>
        <h2 data-split className="display mx-auto max-w-[14ch] text-[13vw] md:text-[min(8vw,9.5rem)]">
          Come <span className="accent normal-case">see</span> it in person
        </h2>
        <p data-fade className="mx-auto mt-8 max-w-md leading-relaxed text-graphite-2">
          Pick a residence, a day and a time. A Runwal relationship manager will meet you at the sales gallery.
        </p>
        <div data-fade className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Magnetic>
            <TLink href="/enquire" className="group inline-flex items-center gap-3 bg-graphite px-8 py-5 text-sm font-medium text-stone transition-colors hover:bg-dusk">
              Book a site visit <span className="transition-transform duration-500 group-hover:translate-x-1">&rarr;</span>
            </TLink>
          </Magnetic>
          <a href="tel:02262328585" className="border border-graphite/25 px-8 py-5 text-sm font-medium transition-colors hover:border-graphite">
            Call sales 022 6232 8585
          </a>
        </div>
      </section>
    </>
  );
}
