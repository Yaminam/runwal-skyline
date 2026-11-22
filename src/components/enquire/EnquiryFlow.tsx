"use client";

import gsap from "gsap";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { BUDGETS, CONTACT, ENQUIRY_PROJECTS } from "@/lib/company";
import { prefersReducedMotion } from "@/lib/motion";
import { scrollToEl } from "../SmoothScroll";
import { TLink } from "../site/Transition";

type Project = (typeof ENQUIRY_PROJECTS)[number];
const STEPS = ["Residence", "Home", "Visit", "Details"] as const;
const HOME_TYPES = ["1 BHK", "2 BHK", "3 BHK", "4 BHK", "5 BHK & above"];
const OFFICE_TYPES = ["Boutique office", "Full floor", "Flex office"];
const SLOTS = ["10:00", "11:30", "13:00", "15:00", "16:30", "18:00"];

function nextDays(n: number) {
  const out: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 1; i <= n; i++) {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    out.push(x);
  }
  return out;
}

const fmtDay = (d: Date) => d.toLocaleDateString("en-IN", { weekday: "short" });
const fmtLong = (d: Date) => d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

function Field({ label, type = "text", value, onChange, required, autoComplete, inputMode }: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email";
}) {
  const id = label.toLowerCase().replace(/\W+/g, "-");
  return (
    <div className="group relative border-b border-graphite/20 transition-colors focus-within:border-graphite">
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder=" "
        onChange={(e) => onChange(e.target.value)}
        className="peer w-full bg-transparent pb-3 pt-7 text-lg outline-none"
        data-no-ring
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-0 top-6 origin-left text-lg text-mute transition-all duration-500 ease-[var(--ease-out-expo)] peer-focus:top-1 peer-focus:scale-[0.62] peer-focus:text-dusk peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:scale-[0.62]"
      >
        {label}
        {required && <span className="text-amber-deep"> *</span>}
      </label>
      <span className="dusk-line absolute bottom-[-1px] left-0 h-px w-full origin-left scale-x-0 transition-transform duration-700 ease-[var(--ease-out-expo)] group-focus-within:scale-x-100" />
    </div>
  );
}

export function EnquiryFlow() {
  const params = useSearchParams();
  const initial = ENQUIRY_PROJECTS.find((p) => p.slug === params.get("project")) ?? null;
  const [step, setStep] = useState(initial ? 1 : 0);
  const [project, setProject] = useState<Project | null>(initial);
  const [type, setType] = useState<string | null>(null);
  const [budget, setBudget] = useState(3);
  const [days, setDays] = useState<Date[]>([]);
  const [day, setDay] = useState<number | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);

  // dates are computed on the client so the server render never disagrees about "today"
  useEffect(() => {
    setDays(nextDays(14));
  }, []);

  useEffect(() => {
    if (!panel.current || prefersReducedMotion()) return;
    gsap.fromTo(panel.current.querySelectorAll("[data-step-in]"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.05 });
  }, [step]);

  useEffect(() => {
    if (!done || !doneRef.current || prefersReducedMotion()) return;
    const el = doneRef.current;
    gsap
      .timeline()
      .fromTo(el.querySelector(".dn-door-l"), { xPercent: 0 }, { xPercent: -100, duration: 1.4, ease: "expo.inOut" }, 0.5)
      .fromTo(el.querySelector(".dn-door-r"), { xPercent: 0 }, { xPercent: 100, duration: 1.4, ease: "expo.inOut" }, 0.5)
      .fromTo(el.querySelector(".dn-key"), { rotate: -90, scale: 0.6, opacity: 0 }, { rotate: 0, scale: 1, opacity: 1, duration: 0.8, ease: "back.out(1.6)" }, 0)
      .to(el.querySelector(".dn-key"), { rotate: 90, duration: 0.5, ease: "power3.inOut" }, 0.75)
      .to(el.querySelector(".dn-key"), { opacity: 0, scale: 1.4, duration: 0.5 }, 1.1)
      .fromTo(el.querySelectorAll(".dn-in"), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.1, ease: "expo.out", stagger: 0.08 }, 1.3);
  }, [done]);

  const types = project?.kind === "office" ? OFFICE_TYPES : HOME_TYPES;
  const canNext = [!!project, !!type, day !== null && !!slot, name.trim().length > 1 && phone.replace(/\D/g, "").length >= 10 && consent][step];

  const go = (n: number) => {
    setStep(n);
    if (top.current && window.innerWidth < 768) scrollToEl(top.current, -80);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canNext) return;
    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      setDone(true);
    }, 1200);
  };

  const summary = useMemo(
    () => [
      ["Residence", project ? `${project.name}` : "—"],
      ["Location", project?.area ?? "—"],
      [project?.kind === "office" ? "Office" : "Home", type ?? "—"],
      ["Budget", BUDGETS[budget]],
      ["Visit", day !== null && days[day] ? `${fmtLong(days[day])}${slot ? `, ${slot}` : ""}` : "—"],
    ],
    [project, type, budget, day, days, slot],
  );

  if (done) {
    return (
      <div ref={doneRef} className="relative flex min-h-[78svh] items-center justify-center overflow-hidden bg-graphite text-stone" data-tone="dark">
        <div className="blueprint-dark absolute inset-0" />
        <div className="relative z-10 flex max-w-2xl flex-col items-center px-6 text-center">
          <p className="dn-in kicker text-amber">Visit requested</p>
          <h2 className="dn-in display mt-6 text-[13vw] md:text-[min(7vw,8rem)]">
            See you <span className="accent normal-case">soon,</span>
          </h2>
          <p className="dn-in title mt-2 text-3xl md:text-4xl">{name.split(" ")[0] || "friend"}.</p>
          <p className="dn-in mt-8 max-w-md text-[1.02rem] leading-relaxed text-stone/70">
            A Runwal relationship manager will call you on {phone} to confirm your visit to {project?.name}
            {day !== null && days[day] ? ` on ${fmtLong(days[day])} at ${slot}` : ""}.
          </p>
          <div className="dn-in mt-10 flex flex-wrap justify-center gap-3">
            {project && (
              <TLink href={`/residences/${project.slug}`} className="bg-amber px-6 py-4 text-sm font-medium text-graphite transition-colors hover:bg-stone">
                Back to {project.name}
              </TLink>
            )}
            <TLink href="/" className="border border-stone/25 px-6 py-4 text-sm font-medium transition-colors hover:border-stone">
              Home
            </TLink>
          </div>
          <p className="dn-in kicker mt-10 text-stone/40">Demo: no data was sent</p>
        </div>
        {/* doors */}
        <div className="dn-door-l absolute inset-y-0 left-0 z-20 w-1/2 border-r border-amber/40 bg-stone" aria-hidden />
        <div className="dn-door-r absolute inset-y-0 right-0 z-20 w-1/2 border-l border-amber/40 bg-stone" aria-hidden />
        <div className="dn-key absolute left-1/2 top-1/2 z-30 -ml-8 -mt-8 flex size-16 items-center justify-center rounded-full bg-amber text-graphite opacity-0" aria-hidden>
          <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="8" cy="12" r="4" />
            <path d="M12 12h9M18 12v3M21 12v2" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div ref={top} className="grid bg-stone pt-16 md:grid-cols-12 md:items-start md:pt-20">
      {/* live visit pass */}
      <aside className="relative bg-graphite px-6 py-10 text-stone md:sticky md:top-20 md:col-span-4 md:h-[calc(100svh-5rem)] md:px-10 md:pb-10 md:pt-12" data-tone="dark">
        <div className="flex h-full flex-col justify-between gap-10">
          <div>
            <p className="kicker text-amber">Site visit pass</p>
            <p className="title mt-4 text-3xl leading-tight md:text-4xl">{project ? project.name : "Choose a residence"}</p>
            <dl className="mt-8 border-t border-stone/15">
              {summary.map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 border-b border-stone/15 py-3.5">
                  <dt className="kicker text-stone/45">{k}</dt>
                  <dd className={`text-right text-sm transition-colors ${v === "—" ? "text-stone/30" : "text-stone"}`}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="hidden text-sm text-stone/55 md:block">
            <p>Prefer to talk?</p>
            <a href={`tel:${CONTACT.sales.replace(/-/g, "")}`} className="title ulink mt-1 inline-block text-xl text-stone">
              {CONTACT.sales}
            </a>
          </div>
        </div>
      </aside>

      <form onSubmit={submit} className="flex min-h-[calc(100svh-5rem)] flex-col bg-stone px-6 pb-10 pt-10 md:col-span-8 md:px-14 md:pt-12" noValidate>
        {/* progress */}
        <ol className="grid grid-cols-4 gap-2">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button type="button" disabled={i > step} onClick={() => go(i)} className="w-full text-left disabled:cursor-not-allowed">
                <span className="block h-px w-full bg-graphite/15">
                  <span className={`block h-full origin-left bg-graphite transition-transform duration-700 ease-[var(--ease-out-expo)] ${i <= step ? "scale-x-100" : "scale-x-0"}`} />
                </span>
                <span className={`kicker mt-3 block transition-colors ${i === step ? "text-graphite" : "text-mute"}`}>
                  0{i + 1} {s}
                </span>
              </button>
            </li>
          ))}
        </ol>

        <div ref={panel} key={step} className="flex-1 py-12">
          {step === 0 && (
            <>
              <h1 data-step-in className="display text-[11vw] md:text-[min(5vw,5.8rem)]">
                Which <span className="accent normal-case">address?</span>
              </h1>
              <ul className="mt-10 grid gap-px bg-graphite/12 sm:grid-cols-2" role="listbox" aria-label="Residence">
                {ENQUIRY_PROJECTS.map((p) => {
                  const on = project?.slug === p.slug;
                  return (
                    <li key={p.slug} data-step-in>
                      <button
                        type="button"
                        role="option"
                        aria-selected={on}
                        onClick={() => {
                          setProject(p);
                          setType(null);
                        }}
                        className={`group flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition-colors duration-300 ${on ? "bg-graphite text-stone" : "bg-stone hover:bg-paper"}`}
                      >
                        <span>
                          <span className="title block text-xl">{p.name}</span>
                          <span className={`kicker mt-1.5 block ${on ? "text-amber" : "text-mute"}`}>
                            {p.area} &middot; {p.kind === "office" ? "Offices" : "Homes"}
                          </span>
                        </span>
                        <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border transition-all duration-500 ${on ? "border-amber bg-amber text-graphite" : "border-graphite/25 group-hover:border-graphite"}`}>
                          {on && (
                            <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 8.5l3 3 7-7" />
                            </svg>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {step === 1 && (
            <>
              <h1 data-step-in className="display text-[11vw] md:text-[min(5vw,5.8rem)]">
                {project?.kind === "office" ? (
                  <>
                    What kind of <span className="accent normal-case">office?</span>
                  </>
                ) : (
                  <>
                    How much <span className="accent normal-case">home?</span>
                  </>
                )}
              </h1>
              <div data-step-in className="mt-10 flex flex-wrap gap-2" role="radiogroup" aria-label="Configuration">
                {types.map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={type === t}
                    onClick={() => setType(t)}
                    className={`min-w-28 border px-6 py-5 text-left transition-all duration-300 ${type === t ? "border-graphite bg-graphite text-stone" : "border-graphite/20 hover:border-graphite"}`}
                  >
                    <span className="title block text-2xl">{t.split(" ")[0]}</span>
                    <span className={`kicker mt-1 block ${type === t ? "text-amber" : "text-mute"}`}>{t.split(" ").slice(1).join(" ") || " "}</span>
                  </button>
                ))}
              </div>
              <div data-step-in className="mt-14 max-w-xl">
                <div className="flex items-baseline justify-between">
                  <label htmlFor="budget" className="kicker text-mute">
                    Budget
                  </label>
                  <span className="title text-2xl">{BUDGETS[budget]}</span>
                </div>
                <input id="budget" type="range" min={0} max={BUDGETS.length - 1} step={1} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="range mt-4" />
                <div className="kicker mt-2 flex justify-between text-mute">
                  <span>{BUDGETS[0]}</span>
                  <span>{BUDGETS[BUDGETS.length - 1]}</span>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 data-step-in className="display text-[11vw] md:text-[min(5vw,5.8rem)]">
                When can we <span className="accent normal-case">show you?</span>
              </h1>
              <p data-step-in className="kicker mt-10 text-mute">
                Pick a day
              </p>
              <div data-step-in className="no-scrollbar -mx-6 mt-4 flex gap-2 overflow-x-auto px-6 md:mx-0 md:px-0" role="radiogroup" aria-label="Visit day">
                {days.map((d, i) => {
                  const on = day === i;
                  const sunday = d.getDay() === 0;
                  return (
                    <button
                      key={d.toISOString()}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      aria-label={fmtLong(d)}
                      onClick={() => setDay(i)}
                      className={`flex w-[4.6rem] shrink-0 flex-col items-center gap-1 border py-4 transition-all duration-300 ${on ? "border-graphite bg-graphite text-stone" : "border-graphite/15 hover:border-graphite"}`}
                    >
                      <span className={`kicker ${on ? "text-amber" : sunday ? "text-amber-deep" : "text-mute"}`}>{fmtDay(d)}</span>
                      <span className="title text-3xl">{d.getDate()}</span>
                      <span className="kicker text-[0.6rem] opacity-60">{d.toLocaleDateString("en-IN", { month: "short" })}</span>
                    </button>
                  );
                })}
              </div>
              <p data-step-in className="kicker mt-10 text-mute">
                And a time
              </p>
              <div data-step-in className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6" role="radiogroup" aria-label="Visit time">
                {SLOTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={slot === s}
                    onClick={() => setSlot(s)}
                    className={`border py-4 text-center transition-all duration-300 ${slot === s ? "border-graphite bg-graphite text-stone" : "border-graphite/15 hover:border-graphite"}`}
                  >
                    <span className="title text-lg tabular-nums">{s}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 data-step-in className="display text-[11vw] md:text-[min(5vw,5.8rem)]">
                Who should <span className="accent normal-case">we call?</span>
              </h1>
              <div data-step-in className="mt-10 grid max-w-2xl gap-6">
                <Field label="Full name" value={name} onChange={setName} required autoComplete="name" />
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field label="Mobile (+91)" type="tel" inputMode="tel" value={phone} onChange={setPhone} required autoComplete="tel" />
                  <Field label="Email" type="email" inputMode="email" value={email} onChange={setEmail} autoComplete="email" />
                </div>
              </div>
              <button
                data-step-in
                type="button"
                role="checkbox"
                aria-checked={consent}
                onClick={() => setConsent((c) => !c)}
                className="mt-10 flex max-w-2xl items-start gap-4 text-left"
              >
                <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center border transition-colors ${consent ? "border-graphite bg-graphite text-amber" : "border-graphite/40"}`}>
                  {consent && (
                    <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <path d="M3 8.5l3 3 7-7" />
                    </svg>
                  )}
                </span>
                <span className="text-sm leading-relaxed text-graphite-2">
                  I agree that Runwal Realty may call, text or email me about this enquiry. My details will be used only for this request.
                </span>
              </button>
            </>
          )}
        </div>

        {/* nav */}
        <div className="flex items-center justify-between gap-4 border-t border-graphite/15 pt-6">
          <button type="button" onClick={() => go(Math.max(0, step - 1))} className={`text-sm font-medium transition-opacity ${step === 0 ? "pointer-events-none opacity-0" : "opacity-70 hover:opacity-100"}`}>
            &larr; Back
          </button>
          {step < 3 ? (
            <button
              type="button"
              disabled={!canNext}
              onClick={() => go(step + 1)}
              className="group inline-flex items-center gap-3 bg-graphite px-7 py-4 text-sm font-medium text-stone transition-all hover:bg-dusk disabled:cursor-not-allowed disabled:bg-graphite/25"
            >
              Continue
              <span className="transition-transform duration-500 group-hover:translate-x-1">&rarr;</span>
            </button>
          ) : (
            <button type="submit" disabled={!canNext || sending} className="group inline-flex items-center gap-3 bg-amber px-7 py-4 text-sm font-medium text-graphite transition-all hover:bg-graphite hover:text-stone disabled:cursor-not-allowed disabled:opacity-40">
              {sending ? "Booking…" : "Request my visit"}
              <span className="transition-transform duration-500 group-hover:translate-x-1">&rarr;</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

/** Static shell shown while search params resolve (and in the prerendered HTML). */
export function EnquiryShell() {
  return (
    <div className="grid bg-stone pt-16 md:grid-cols-12 md:pt-20">
      <aside className="bg-graphite px-6 py-10 text-stone md:col-span-4 md:h-[calc(100svh-5rem)] md:px-10 md:pt-12" data-tone="dark">
        <p className="kicker text-amber">Site visit pass</p>
        <p className="title mt-4 text-3xl md:text-4xl">Choose a residence</p>
      </aside>
      <div className="min-h-[calc(100svh-5rem)] bg-stone px-6 pt-10 md:col-span-8 md:px-14 md:pt-12">
        <h1 className="display text-[11vw] md:text-[min(5vw,5.8rem)]">
          Which <span className="accent normal-case">address?</span>
        </h1>
      </div>
    </div>
  );
}
