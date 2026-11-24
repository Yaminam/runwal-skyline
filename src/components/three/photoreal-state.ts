"use client";

import { useSyncExternalStore } from "react";

/*
  Photoreal mode for the home hero: Google Photorealistic 3D Tiles instead of the OSM clay city.
  Activated only when NEXT_PUBLIC_GOOGLE_MAPS_KEY is set; any failure (bad key, 403, network, no
  tiles within a timeout) flips the status to "failed" and the hero falls back to the clay city.
*/

export const PHOTOREAL_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";

export type PhotoStatus = "off" | "loading" | "ready" | "failed";

type State = { status: PhotoStatus; attribution: string };

let state: State = { status: "off", attribution: "" };
const subs = new Set<() => void>();

export const photoreal = {
  get: () => state,
  set(patch: Partial<State>) {
    const next = { ...state, ...patch };
    if (next.status === state.status && next.attribution === state.attribution) return;
    state = next;
    subs.forEach((f) => f());
  },
  subscribe(f: () => void) {
    subs.add(f);
    return () => {
      subs.delete(f);
    };
  },
  /** true while the camera should fly the photoreal path (tiles loading or shown) */
  active: () => state.status === "loading" || state.status === "ready",
  /** performance.now() when the first tiles became visible, -1 until then */
  readyAt: -1,
};

const SERVER: State = { status: "off", attribution: "" };

export function usePhotoreal() {
  return useSyncExternalStore(photoreal.subscribe, photoreal.get, () => SERVER);
}

const FAIL_KEY = "runwal-photoreal-failed";

/** Remember a root failure (bad key, 403/429, quota) for the rest of this visit. */
export function rememberPhotorealFailure() {
  try {
    sessionStorage.setItem(FAIL_KEY, "1");
  } catch {}
}

/**
 * Whether this device and visit should try photoreal tiles at all. Every TilesRenderer opens a
 * billable root session (free tier), so: desktop and tablet only (phones always get the clay
 * city), WebGL2, enough memory where the browser reports it, no reduced-motion preference, and
 * never again in this visit once the root request has failed.
 */
export function canUsePhotoreal(mobile: boolean) {
  if (!PHOTOREAL_KEY || typeof window === "undefined") return false;
  if (state.status === "failed") return false;
  if (mobile || window.innerWidth < 768) return false;
  if (typeof WebGL2RenderingContext === "undefined") return false;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (mem !== undefined && mem < 4) return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const q = new URLSearchParams(window.location.search);
  if (q.has("osm")) return false;
  try {
    if (sessionStorage.getItem(FAIL_KEY) === "1") return false;
  } catch {}
  return true;
}

/*
  Geometry: the tiles are re-oriented so (19.07 N, 72.87 E) sits at the origin with +Y up, then
  rotated so east = +x and north = -z, and scaled to the hero's model units. geo() in
  skyline-state.ts uses 200 units per degree on both axes, i.e. 526 m per unit east-west and
  553 m per unit north-south at Mumbai's latitude, so the tiles get exactly that anisotropic
  scale (a 2.5% stretch nobody can see) and line up with the landmarks, camera path and the
  baked OSM ground texture. Heights are real (no exaggeration): 540 m per unit.
*/
export const ORIGIN = { lat: 19.07, lon: 72.87 };
export const M_PER_UNIT = { x: 526.0, y: 540.0, z: 553.0 };
/** Ellipsoid height of mean sea level at Mumbai (geoid undulation, approx. EGM2008). */
export const SEA_LEVEL_ELLIPSOID = -62;
export const realUnits = (metres: number) => metres / M_PER_UNIT.y;
