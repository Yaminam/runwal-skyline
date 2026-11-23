// Shared state for "A day in a Runwal district": written by the scroll overlay, read by the WebGL scene
// inside useFrame (never React state). Hours run 06:00 -> 24:00 across the pinned scroll.

export type BuildingKey = "office" | "plaza" | "mall" | "hotel" | "home";

export const district = {
  /** 0..1 progress through the pinned scroll */
  p: 0,
  /** 0..1 the block rises out of its plinth the first time it comes into view */
  rise: 0,
  /** building currently being described (amber outline + label) */
  focus: null as BuildingKey | null,
  /** DOM label positioned each frame by the scene */
  label: null as HTMLElement | null,
  /** reduced motion: hold a single evening frame */
  still: false,
};

export const START_HOUR = 6;
export const END_HOUR = 24;

export const hourAt = (p: number) => START_HOUR + p * (END_HOUR - START_HOUR);
export const pAt = (hour: number) => (hour - START_HOUR) / (END_HOUR - START_HOUR);

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** 0 outside [a, b], 1 inside, with soft ramps of `r` hours at both ends */
export const bump = (h: number, a: number, b: number, r: number) => smooth(a, a + r, h) * (1 - smooth(b - r, b, h));

/** Time-of-day mix: 0 = day, then dusk, then night. */
export function light(h: number) {
  const dusk = smooth(16.6, 18.6, h);
  const night = smooth(18.6, 20.6, h);
  const dawn = 1 - smooth(6, 7.6, h);
  return { dusk, night, dawn };
}

// Same palette family as the home skyline: stone white day, golden dusk, graphite night.
const SKY = {
  day: { top: [222, 228, 236], bottom: [239, 236, 230] },
  dawn: { top: [220, 222, 232], bottom: [243, 233, 222] },
  dusk: { top: [96, 108, 160], bottom: [242, 180, 138] },
  night: { top: [8, 9, 12], bottom: [24, 27, 34] },
};

const mix3 = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

/** CSS gradient for the backdrop behind the transparent canvas */
export function skyCss(h: number) {
  const { dusk, night, dawn } = light(h);
  let top = mix3(SKY.day.top, SKY.dawn.top, dawn);
  let bottom = mix3(SKY.day.bottom, SKY.dawn.bottom, dawn);
  top = mix3(mix3(top, SKY.dusk.top, dusk), SKY.night.top, night);
  bottom = mix3(mix3(bottom, SKY.dusk.bottom, dusk), SKY.night.bottom, night);
  return `linear-gradient(to bottom, rgb(${top.join(",")}) 0%, rgb(${bottom.join(",")}) 100%)`;
}

export type Phase = { key: BuildingKey; from: number; to: number };

export const PHASES: Phase[] = [
  { key: "office", from: 7.0, to: 11.4 },
  { key: "plaza", from: 11.8, to: 14.8 },
  { key: "mall", from: 15.2, to: 19.7 },
  { key: "hotel", from: 20.0, to: 22.35 },
  { key: "home", from: 22.4, to: 24.5 },
];

export function focusAt(h: number): BuildingKey | null {
  return PHASES.find((ph) => h >= ph.from && h < ph.to)?.key ?? null;
}
