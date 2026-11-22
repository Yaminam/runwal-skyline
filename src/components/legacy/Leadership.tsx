import { MD, SPLIT_2016, TEAM } from "@/lib/company";
import { Pic } from "../site/Pic";

/** Founder and Managing Director, the 2016 separation explained plainly, and the board. */
export function Leadership() {
  return (
    <>
      <section className="bg-paper px-6 py-28 md:px-10 md:py-40">
        <div className="grid items-end gap-14 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="relative aspect-[395/345] w-full max-w-sm overflow-hidden bg-stone-2" data-reveal-img>
              <Pic src={MD.image} alt={MD.name} fill sizes="(min-width: 768px) 28vw, 90vw" className="grayscale-[0.2]" />
            </div>
            <p className="kicker mt-5 text-mute">{MD.title}</p>
            <p className="title mt-1 text-xl">{MD.name}</p>
          </div>
          <div className="md:col-span-7 md:col-start-6">
            <p className="kicker text-mute" data-fade>
              Two generations
            </p>
            <blockquote className="mt-6">
              <p className="title text-[2rem] leading-[1.15] md:text-[3.2rem]" data-split>
                Founded by Subhash Runwal in 1978. Led by his son since 1993, <span className="accent text-dusk">with the same promise.</span>
              </p>
            </blockquote>
            <ul className="mt-10 grid gap-6 border-t border-graphite/15 pt-8 md:grid-cols-2" data-fade>
              {MD.lines.map((l) => (
                <li key={l} className="text-[0.95rem] leading-relaxed text-graphite-2">
                  {l}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-stone px-6 md:px-10">
        <div className="grid gap-8 border-y border-graphite/15 py-14 md:grid-cols-12 md:py-20">
          <div className="md:col-span-4">
            <p className="kicker text-amber-deep">Since 2016</p>
            <h2 className="title mt-4 text-3xl md:text-4xl">{SPLIT_2016.title}</h2>
          </div>
          <div className="md:col-span-7 md:col-start-6">
            <p className="text-[1.05rem] leading-relaxed">{SPLIT_2016.text}</p>
            <p className="mt-5 text-sm leading-relaxed text-mute">{SPLIT_2016.note}</p>
            <div className="mt-8 grid grid-cols-2 gap-px bg-graphite/15 text-sm">
              <div className="bg-stone py-4 pr-4">
                <p className="kicker text-mute">This website</p>
                <p className="title mt-2 text-lg">Runwal Realty</p>
                <p className="text-mute">Runwal Developers Ltd &middot; Sandeep Runwal</p>
              </div>
              <div className="bg-stone py-4 pl-4">
                <p className="kicker text-mute">Separate company</p>
                <p className="title mt-2 text-lg text-graphite/50">Runwal Enterprises</p>
                <p className="text-mute">Subodh Runwal</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-stone px-6 py-28 md:px-10 md:py-36">
        <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h2 className="display text-[12vw] md:text-[min(5.4vw,6.5rem)]" data-split>
            Board &amp; <span className="accent normal-case">management</span>
          </h2>
          <p className="max-w-sm text-[0.95rem] leading-relaxed text-mute" data-fade>
            Experience across real estate development, finance, engineering and corporate governance.
          </p>
        </div>
        <ul className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((t, i) => (
            <li key={t.name} className="group" data-fade>
              <div className="relative aspect-[395/345] overflow-hidden bg-stone-2">
                <Pic
                  src={t.image}
                  alt={t.name}
                  fill
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                  className="grayscale transition-[filter,transform] duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-[1.03] group-hover:grayscale-0"
                />
                <span className="kicker absolute left-3 top-3 bg-stone/85 px-2 py-1 backdrop-blur">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <p className="title mt-5 text-xl">{t.name}</p>
              <p className="kicker mt-2 text-dusk">{t.title}</p>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-mute">{t.bio}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
