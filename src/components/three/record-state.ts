// Shared, mutable state between the Manifesto band (DOM) and the 3D record tower.
// Written by ScrollTrigger / hover handlers, read inside useFrame (never React state).
export type RecordGroup = "done" | "now" | "next";

export type BandPoint = { g: RecordGroup; x: number; y: number; on: number };

export const record = {
  /** 0..1 build progress */
  p: 0,
  /** hovered group, or null */
  focus: null as RecordGroup | null,
  /** called every frame with the screen position (canvas pixels) of each floor band's right edge */
  project: null as ((pts: BandPoint[]) => void) | null,
};

export const DONE = 35;
export const NOW = 17;
export const NEXT = 24;
export const FLOORS = 19;
export const PER = 4;

/** project index -> group (4 projects per floor, bottom floor first) */
export const groupOf = (i: number): RecordGroup => (i < DONE ? "done" : i < DONE + NOW ? "now" : "next");

/** floor ranges for each group, in floors from the bottom */
export const BANDS: Record<RecordGroup, [number, number]> = {
  done: [0, DONE / PER],
  now: [DONE / PER, (DONE + NOW) / PER],
  next: [(DONE + NOW) / PER, FLOORS],
};
