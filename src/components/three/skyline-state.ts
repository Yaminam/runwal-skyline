// Shared, mutable state between the scroll-driven DOM overlay and the WebGL skyline.
// Written by GSAP / ScrollTrigger, read inside useFrame (never React state, so no re-renders).
export const skyline = {
  /** 0..1 progress through the pinned hero scroll */
  p: 0,
  /** 0..1 intro: the city rises out of the ground once the page is revealed */
  rise: 0,
};

/** DOM labels for the Runwal towers, positioned each frame by the scene (index = LANDMARKS index). */
export const labels: Array<HTMLElement | null> = [];

/** Map a real lat/long to the stylised model (1 unit ~ 550 m). North is -z, the sea is -x. */
export function geo(lat: number, lon: number): [number, number] {
  return [(lon - 72.87) * 200, -(lat - 19.07) * 200];
}

export type Landmark = {
  slug: string;
  name: string;
  area: string;
  lat: number;
  lon: number;
  /** storeys-ish height of the model tower */
  h: number;
  /** footprint */
  w: number;
  /** "twin" towers, "stepped" setbacks or a plain "slab" */
  form: "twin" | "stepped" | "slab" | "cluster";
  /** progress (0..1) at which the camera passes it and its light comes on */
  at: number;
};

// Runwal addresses placed at their real coordinates (approximate, by locality).
export const LANDMARKS: Landmark[] = [
  { slug: "runwal-malabar", name: "Runwal Malabar", area: "Malabar Hill", lat: 18.955, lon: 72.797, h: 13, w: 1.6, form: "stepped", at: 0.2 },
  { slug: "runwal-raaya", name: "Runwal Raaya", area: "Worli", lat: 19.012, lon: 72.818, h: 17, w: 1.5, form: "twin", at: 0.27 },
  { slug: "runwal-timeless", name: "Runwal Timeless", area: "Wadala", lat: 19.021, lon: 72.866, h: 14, w: 1.7, form: "cluster", at: 0.34 },
  { slug: "runwal-rare", name: "Runwal Rare", area: "Andheri West", lat: 19.136, lon: 72.829, h: 11, w: 1.5, form: "slab", at: 0.47 },
  { slug: "runwal-auris", name: "Runwal Auris", area: "Malad", lat: 19.187, lon: 72.842, h: 12, w: 1.5, form: "stepped", at: 0.53 },
  { slug: "runwal-sanctuary", name: "Runwal Sanctuary", area: "Mulund West", lat: 19.172, lon: 72.948, h: 12, w: 1.7, form: "cluster", at: 0.62 },
  { slug: "runwal-one", name: "Runwal One", area: "Manpada, Thane", lat: 19.236, lon: 72.968, h: 16, w: 1.6, form: "twin", at: 0.7 },
  { slug: "runwal-zenith", name: "Runwal Zenith", area: "Balkum, Thane", lat: 19.214, lon: 72.985, h: 12, w: 1.4, form: "slab", at: 0.74 },
  { slug: "runwal-lands-end", name: "Runwal Lands End", area: "Kolshet, Thane", lat: 19.228, lon: 73.005, h: 13, w: 1.6, form: "cluster", at: 0.78 },
];
