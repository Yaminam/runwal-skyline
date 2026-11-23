import { TEAM } from "@/lib/company";
import { Pic } from "../site/Pic";
import { FamilyTree } from "./FamilyTree";
import { TwoGenerations } from "./TwoGenerations";

/** Founder and Managing Director, the 2016 separation explained plainly, and the board. */
export function Leadership() {
  return (
    <>
      <TwoGenerations />
      <FamilyTree />

      <section id="team" className="scroll-mt-24 bg-stone px-6 py-28 md:px-10 md:py-36">
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
