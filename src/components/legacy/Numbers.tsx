import { RANKING, STATS, STATS_SOURCE } from "@/lib/company";
import { Counter } from "../site/Counter";

/** The DRHP numbers as a blueprint ledger. */
export function Numbers() {
  return (
    <section className="blueprint relative bg-stone px-6 py-24 md:px-10 md:py-32">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <h2 className="display text-[12vw] md:text-[min(5.4vw,6.5rem)]" data-split>
          By the <span className="accent normal-case">numbers</span>
        </h2>
        <p className="max-w-md text-[0.95rem] leading-relaxed text-graphite-2" data-fade>
          {RANKING}
        </p>
      </div>
      <dl className="mt-16 grid grid-cols-2 border-l border-t border-graphite/15 md:grid-cols-5">
        {STATS.map((s) => (
          <div key={s.label} className="flex min-h-56 flex-col justify-between border-b border-r border-graphite/15 bg-stone/70 p-5 backdrop-blur-[2px] md:p-7" data-fade>
            <dt className="kicker text-mute">{s.label}</dt>
            <dd>
              <span className="display block text-[13vw] md:text-[min(5vw,5.6rem)]">
                <Counter to={s.value} decimals={"decimals" in s ? s.decimals : 0} />
                <span className="text-[0.4em] tracking-normal">{s.suffix}</span>
              </span>
              <span className="mt-3 block text-sm leading-snug text-mute">{s.note}</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="kicker mt-6 text-mute">{STATS_SOURCE}</p>
    </section>
  );
}
