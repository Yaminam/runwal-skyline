import { PROJECTS, type Project } from "@/lib/projects";

/*
  The scroll-driven flight over the residences map: an aerial opening, one chapter per residence
  (south to north, then Pune), and a night finale over the whole region. Shared by the overlay
  (chapter cards, clock) and the map (camera, grading), so both read the same progress.
*/

const ORDER = [
  "runwal-malabar",
  "runwal-raaya",
  "runwal-timeless",
  "runwal-rare",
  "runwal-auris",
  "runwal-sanctuary",
  "runwal-one",
  "runwal-zenith",
  "runwal-lands-end",
  "runwal-the-central-park",
];

export const TOUR: Project[] = ORDER.map((s) => PROJECTS.find((p) => p.slug === s)).filter((p): p is Project => !!p);

/** Mutable state written by the section (scroll) and read by the map every frame. */
export type TourState = { p: number; active: boolean; explore: boolean };
export const tourState: TourState = { p: 0, active: true, explore: false };

const INTRO_END = 0.07;
const FINALE_START = 0.9;
const SPAN = (FINALE_START - INTRO_END) / TOUR.length;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** -1 = opening, 0..n-1 = residence chapter, n = finale; t = progress inside it */
export function chapterAt(p: number): { i: number; t: number } {
  if (p < INTRO_END) return { i: -1, t: p / INTRO_END };
  if (p >= FINALE_START) return { i: TOUR.length, t: (p - FINALE_START) / (1 - FINALE_START) };
  const k = (p - INTRO_END) / SPAN;
  const i = Math.min(TOUR.length - 1, Math.floor(k));
  return { i, t: k - i };
}

export type Cam = { center: [number, number]; zoom: number; pitch: number; bearing: number };

function opening(mobile: boolean, t: number): Cam {
  return { center: [72.9, 19.09], zoom: (mobile ? 9.2 : 10.25) + 0.35 * smooth(t), pitch: mobile ? 42 : 50, bearing: -24 + 6 * t };
}
function finaleView(mobile: boolean): Cam {
  return { center: [73.2, 18.93], zoom: mobile ? 7.7 : 8.9, pitch: mobile ? 35 : 42, bearing: -12 };
}
function chapterView(i: number, mobile: boolean, hold: number): Cam {
  const p = TOUR[i];
  return {
    center: [p.lon, p.lat],
    zoom: (mobile ? 13.4 : 14.55) + 0.3 * hold,
    pitch: mobile ? 52 : 63,
    bearing: -28 + i * 17 + 22 * hold,
  };
}

const km = (a: [number, number], b: [number, number]) => {
  const dx = (a[0] - b[0]) * 105;
  const dy = (a[1] - b[1]) * 111;
  return Math.hypot(dx, dy);
};

/** Blend two views with a "hop": the camera lifts mid-way, more for longer journeys. */
function travel(a: Cam, b: Cam, t: number): Cam {
  const e = smooth(t);
  const hop = Math.min(4.2, Math.max(0.7, km(a.center, b.center) / 5));
  return {
    center: [lerp(a.center[0], b.center[0], e), lerp(a.center[1], b.center[1], e)],
    zoom: lerp(a.zoom, b.zoom, e) - hop * Math.sin(Math.PI * e),
    pitch: lerp(a.pitch, b.pitch, e) - 14 * Math.sin(Math.PI * e),
    bearing: lerp(a.bearing, b.bearing, e),
  };
}

export function cameraAt(p: number, mobile: boolean): Cam {
  const { i, t } = chapterAt(p);
  if (i < 0) return opening(mobile, t);
  if (i >= TOUR.length) return travel(chapterView(TOUR.length - 1, mobile, 1), finaleView(mobile), Math.min(1, t / 0.7));
  const TRANSIT = 0.36;
  const from = i === 0 ? opening(mobile, 1) : chapterView(i - 1, mobile, 1);
  if (t < TRANSIT) return travel(from, chapterView(i, mobile, 0), t / TRANSIT);
  return chapterView(i, mobile, (t - TRANSIT) / (1 - TRANSIT));
}

/** 0 = morning, 1 = golden hour/dusk, 2 = night */
export function gradeAt(p: number): number {
  return 2 * smooth(clamp01((p - 0.22) / (0.92 - 0.22)));
}

/** Mumbai local time shown on the clock: 07:00 to 22:40 */
export function clockAt(p: number): string {
  const mins = 7 * 60 + Math.round(clamp01(p) * (15 * 60 + 40));
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

export const REGION_MARKS = (() => {
  const marks: Array<{ at: number; label: string }> = [];
  TOUR.forEach((p, i) => {
    if (i === 0 || TOUR[i - 1].region !== p.region) marks.push({ at: INTRO_END + SPAN * i, label: p.region });
  });
  return marks;
})();

export const CONSTELLATION: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
  type: "FeatureCollection",
  features: [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: TOUR.map((p) => [p.lon, p.lat]) } }],
};
