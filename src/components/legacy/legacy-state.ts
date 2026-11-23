// Shared state for the "48 years, 48 floors" set-piece: written by ScrollTrigger, read in useFrame.
import { JOURNEY } from "@/lib/company";

export const FLOORS = 48; // one floor per year, 1978 to 2025; 2026 is the crown
export const START_YEAR = 1978;

export const legacy = { p: 0 };

export const MILESTONES = JOURNEY.map((m, idx) => ({ ...m, idx, floor: parseInt(m.year.slice(0, 4), 10) - START_YEAR }));
export const MILESTONE_FLOORS = new Set(MILESTONES.map((m) => m.floor));

// Scroll schedule: every floor takes one beat to land; milestone floors then hold for a few beats
// so their story can be read before the next year arrives.
const HOLD = 2.6;
const P0 = 0.03;
const P1 = 0.86;
const SEGMENTS: Array<{ floor: number; hold: boolean; w: number }> = [];
for (let i = 0; i < FLOORS; i++) {
  SEGMENTS.push({ floor: i, hold: false, w: 1 });
  if (MILESTONE_FLOORS.has(i)) SEGMENTS.push({ floor: i, hold: true, w: HOLD });
}
const TOTAL = SEGMENTS.reduce((a, s) => a + s.w, 0);

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Continuous build count 0..48 for scroll progress p. */
export function buildAt(p: number) {
  let q = clamp((p - P0) / (P1 - P0)) * TOTAL;
  for (const s of SEGMENTS) {
    if (q < s.w) return s.hold ? s.floor + 1 : s.floor + q / s.w;
    q -= s.w;
  }
  return FLOORS;
}

/** 0..1 for the ending: crown, beacon, every window lit. */
export const finaleAt = (p: number) => smooth(0.87, 0.95, p);

/** 0..1 day to night across the build. */
export const nightAt = (p: number) => smooth(0.5, 0.88, p);

/** Index into MILESTONES of the card to show, or -1. */
export function milestoneAt(b: number, p: number) {
  if (finaleAt(p) > 0.05) return -1;
  let found = -1;
  for (const m of MILESTONES) if (b >= m.floor + 1) found = m.idx;
  if (found < 0) return -1;
  const m = MILESTONES[found];
  return b - (m.floor + 1) < 5.5 ? found : -1;
}
