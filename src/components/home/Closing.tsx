import { Magnetic } from "../site/Magnetic";
import { TLink } from "../site/Transition";

// Official outlet logos (Wikimedia Commons, public domain). h = visual height so the wordmarks read evenly.
const OUTLETS = [
  { src: "/images/press/et.svg", name: "The Economic Times", h: "h-[1.15rem] md:h-[1.4rem]" },
  { src: "/images/press/ht.svg", name: "Hindustan Times", h: "h-[1.5rem] md:h-[1.85rem]" },
  { src: "/images/press/toi.svg", name: "The Times of India", h: "h-[0.95rem] md:h-[1.15rem]" },
  { src: "/images/press/forbes.svg", name: "Forbes India", h: "h-[1.9rem] md:h-[2.4rem]" },
  { src: "/images/press/mint.svg", name: "Mint", h: "h-[1.7rem] md:h-[2.1rem]" },
  { src: "/images/press/cnbc.svg", name: "CNBC-TV18", h: "h-[1.9rem] md:h-[2.3rem]" },
  { src: "/images/press/fpj.svg", name: "The Free Press Journal", h: "h-[1.5rem] md:h-[1.8rem]" },
];

/** Press strip, then the invitation to visit. */
export function Closing() {
  return (
    <>
      <section className="border-y border-graphite/10 bg-paper py-10 md:py-12" aria-label="In the press">
        <p className="kicker mb-8 text-center text-mute">As featured in</p>
        <div className="group/m flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
          <div className="marquee flex shrink-0 items-center gap-16 pr-16 group-hover/m:[animation-play-state:paused] md:gap-24 md:pr-24">
            {[...OUTLETS, ...OUTLETS, ...OUTLETS].map((o, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={o.src}
                alt={i < OUTLETS.length ? o.name : ""}
                aria-hidden={i >= OUTLETS.length}
                draggable={false}
                className={`${o.h} w-auto shrink-0 opacity-60 [filter:grayscale(1)_brightness(0.15)] transition-[filter,opacity,transform] duration-500 hover:scale-105 hover:opacity-100 hover:[filter:none]`}
              />
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
