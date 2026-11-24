"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { getVersion, Map as MaplibreMap, Marker, setWorkerUrl, type ExpressionSpecification, type LngLatBoundsLike, type Map as MLMap, type MapMouseEvent, type StyleSpecification } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import { bhkLabel } from "@/lib/project-format";
import { ALL_PROJECTS, type Project, type Region } from "@/lib/projects";
import { useTransition } from "../site/Transition";
import { CONSTELLATION, TOUR, cameraAt, chapterAt, gradeAt, tourState } from "./residence-tour";

/*
  The Runwal map, as an aerial view: Sentinel-2 cloudless satellite imagery (EOX) on real terrain
  (AWS terrain tiles), OpenStreetMap buildings from OpenFreeMap extruded in concrete and glass, and
  each Runwal address as a lit tower with an amber crown, a light beam and a glow on the ground.
  The filters below drive it: matching towers rise, the rest sink. Day and night modes.
*/

const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
const SAT_URL = "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/g/{z}/{y}/{x}.jpg";
const DEM_URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";

// The bundler can't follow MapLibre's worker import, so the worker ships as a static file
// (public/vendor, copied from node_modules/maplibre-gl/dist for the pinned version).
setWorkerUrl(`/vendor/maplibre-gl-worker-${getVersion()}.mjs`);

const C = {
  stone: "#eeebe5",
  land: "#c9c4b8",
  amber: "#f2a65a",
  dusk: "#6f86e8",
  label: "#f7f5f1",
};

/* ------------------------------------------------------------------ geometry */

type Feat = GeoJSON.Feature<GeoJSON.Polygon, { slug: string; h: number; base?: number; office: boolean }>;

const M_LAT = 1 / 111320;
const mLon = (lat: number) => 1 / (111320 * Math.cos((lat * Math.PI) / 180));

function square(lon: number, lat: number, dx: number, dz: number, half: number): GeoJSON.Polygon {
  const cx = lon + dx * mLon(lat);
  const cy = lat + dz * M_LAT;
  const hx = half * mLon(lat);
  const hy = half * M_LAT;
  return {
    type: "Polygon",
    coordinates: [
      [
        [cx - hx, cy - hy],
        [cx + hx, cy - hy],
        [cx + hx, cy + hy],
        [cx - hx, cy + hy],
        [cx - hx, cy - hy],
      ],
    ],
  };
}

// massing per project (offsets in metres), loosely after the real towers
function footprints(p: Project): Array<{ dx: number; dz: number; half: number; hk: number }> {
  if (p.kind === "Commercial") return [{ dx: 0, dz: 0, half: 55, hk: 1 }];
  switch (p.slug) {
    case "runwal-raaya":
    case "runwal-timeless":
      return [
        { dx: -45, dz: 0, half: 30, hk: 1 },
        { dx: 45, dz: 15, half: 30, hk: 0.86 },
      ];
    case "runwal-lands-end":
    case "runwal-sanctuary":
    case "runwal-one":
    case "runwal-the-central-park":
      return [
        { dx: 0, dz: -55, half: 28, hk: 1 },
        { dx: -70, dz: 40, half: 28, hk: 0.84 },
        { dx: 70, dz: 35, half: 28, hk: 0.72 },
      ];
    default:
      return [{ dx: 0, dz: 0, half: 34, hk: 1 }];
  }
}

// real storeys x ~3.4 m, lifted a little so Runwal reads above its neighbours
const heightOf = (p: Project) => Math.round(p.floors * 3.4 * 1.25 + 20);

const fc = <G extends GeoJSON.Geometry>(features: GeoJSON.Feature<G>[]): GeoJSON.FeatureCollection<G> => ({ type: "FeatureCollection", features });

const TOWERS = fc(
  ALL_PROJECTS.flatMap((p) =>
    footprints(p).map((f): Feat => ({ type: "Feature", geometry: square(p.lon, p.lat, f.dx, f.dz, f.half), properties: { slug: p.slug, h: heightOf(p) * f.hk, office: p.kind === "Commercial" } })),
  ),
);
const CROWNS = fc(
  ALL_PROJECTS.map((p): Feat => {
    const f = footprints(p)[0];
    return { type: "Feature", geometry: square(p.lon, p.lat, f.dx, f.dz, f.half * 0.55), properties: { slug: p.slug, h: heightOf(p) * f.hk, office: p.kind === "Commercial" } };
  }),
);
// at city zoom a 60 m tower is a pixel wide, so each address also gets a broad lit pillar
const PILLARS = fc(ALL_PROJECTS.map((p): Feat => ({ type: "Feature", geometry: square(p.lon, p.lat, 0, 0, 120), properties: { slug: p.slug, h: heightOf(p), office: p.kind === "Commercial" } })));
// light beams: broad for the overview, slim once the real towers take over
const BEAMS_WIDE = fc(ALL_PROJECTS.map((p): Feat => ({ type: "Feature", geometry: square(p.lon, p.lat, 0, 0, 70), properties: { slug: p.slug, h: heightOf(p), office: p.kind === "Commercial" } })));
const BEAMS_SLIM = fc(
  ALL_PROJECTS.map((p): Feat => {
    const f = footprints(p)[0];
    return { type: "Feature", geometry: square(p.lon, p.lat, f.dx, f.dz, 9), properties: { slug: p.slug, h: heightOf(p) * f.hk, office: p.kind === "Commercial" } };
  }),
);
const POINTS = fc(ALL_PROJECTS.map((p) => ({ type: "Feature", geometry: { type: "Point", coordinates: [p.lon, p.lat] }, properties: { slug: p.slug, office: p.kind === "Commercial" } }) as GeoJSON.Feature<GeoJSON.Point>));

function boundsFor(list: Project[]): LngLatBoundsLike {
  const lons = list.map((p) => p.lon);
  const lats = list.map((p) => p.lat);
  return [
    [Math.min(...lons) - 0.012, Math.min(...lats) - 0.012],
    [Math.max(...lons) + 0.012, Math.max(...lats) + 0.012],
  ];
}

const HOME = { center: [72.905, 19.085] as [number, number], zoom: 10.9 };
const HOME_MOBILE = { center: [72.878, 19.1] as [number, number], zoom: 9.55 };

/* ------------------------------------------------------------------ style */

const ROAD_KEEP = ["highway_major_inner", "highway_major_subtle", "highway_motorway_inner", "highway_motorway_subtle", "highway_motorway_bridge_inner", "tunnel_motorway_inner"];
const LABEL_KEEP = ["label_city", "label_town", "label_village", "water_name_point_label"];

function restyle(style: StyleSpecification): StyleSpecification {
  const kept = style.layers
    .filter((l) => {
      if (l.type === "background") return true;
      if (l.type === "symbol") return LABEL_KEEP.includes(l.id);
      if (l.id === "water" || l.id === "waterway") return true;
      return ROAD_KEEP.includes(l.id);
    })
    .map((l) => {
      const paint = { ...(l as { paint?: Record<string, unknown> }).paint };
      const layout = { ...(l as { layout?: Record<string, unknown> }).layout };
      if (l.type === "background") paint["background-color"] = C.land;
      if (l.id === "water") {
        paint["fill-color"] = "#6f8fa6";
        paint["fill-opacity"] = 0.18;
      }
      if (l.id === "waterway") {
        paint["line-color"] = "#7e98ad";
        paint["line-opacity"] = 0.35;
      }
      if (l.type === "line" && l.id.includes("highway")) {
        paint["line-color"] = "#ffffff";
        paint["line-opacity"] = 0.32;
      }
      if (l.type === "symbol") {
        layout["text-font"] = ["Noto Sans Regular"];
        layout["text-transform"] = "uppercase";
        layout["text-letter-spacing"] = 0.26;
        layout["icon-image"] = "";
        paint["text-color"] = C.label;
        paint["text-halo-color"] = "rgba(16,18,22,0.55)";
        paint["text-halo-width"] = 1.4;
        paint["text-halo-blur"] = 0.8;
        paint["text-opacity"] = 0.85;
      }
      const out = { ...l, paint, layout } as typeof l;
      const minZ: Record<string, number> = { water: 11.5, waterway: 11.5, label_town: 11.2, label_village: 12.6, water_name_point_label: 11 };
      if (minZ[l.id] !== undefined) (out as { minzoom?: number }).minzoom = minZ[l.id];
      return out;
    });

  const [bg, ...rest] = kept;
  return {
    ...style,
    sources: {
      ...style.sources,
      sat: { type: "raster", tiles: [SAT_URL], tileSize: 256, maxzoom: 14, attribution: "Sentinel-2 cloudless by EOX" },
      dem: { type: "raster-dem", tiles: [DEM_URL], tileSize: 256, maxzoom: 12, encoding: "terrarium" },
      demHs: { type: "raster-dem", tiles: [DEM_URL], tileSize: 256, maxzoom: 12, encoding: "terrarium" },
    },
    layers: [
      bg,
      {
        id: "satellite",
        type: "raster",
        source: "sat",
        paint: { "raster-saturation": -0.12, "raster-contrast": 0.08, "raster-brightness-min": 0.06, "raster-brightness-max": 0.97, "raster-fade-duration": 300 },
      },
      {
        id: "relief",
        type: "hillshade",
        source: "demHs",
        paint: { "hillshade-exaggeration": 0.28, "hillshade-shadow-color": "#2d2820", "hillshade-highlight-color": "#fff7e8", "hillshade-accent-color": "#3a332a", "hillshade-illumination-direction": 300 },
      },
      ...rest,
    ],
  };
}

/* ------------------------------------------------------------------ day / dusk / night */

type Pal = {
  sat: [number, number, number, number]; // saturation, contrast, brightness-min, brightness-max
  sky: string;
  horizon: string;
  fog: string;
  light: string;
  lightI: number;
  sunAz: number;
  sunPolar: number;
  road: string;
  roadO: number;
  roadBlur: number;
  water: string;
  waterO: number;
  bg: string;
  bld: [string, string, string, string, string];
  tower: string;
  beam: number;
  label: string;
  hsShadow: string;
  hsHigh: string;
};

const PAL: Record<"day" | "dusk" | "night", Pal> = {
  day: {
    sat: [-0.12, 0.08, 0.06, 0.97],
    sky: "#9db6d2",
    horizon: "#ece6db",
    fog: "#e9e3d8",
    light: "#fff6ea",
    lightI: 0.46,
    sunAz: 250,
    sunPolar: 38,
    road: "#ffffff",
    roadO: 0.32,
    roadBlur: 0,
    water: "#6f8fa6",
    waterO: 0.18,
    bg: "#b9b8ae",
    bld: ["#ddd5c7", "#d2cbbf", "#c3c8cd", "#aebccb", "#9db2c8"],
    tower: "#fbf6ee",
    beam: 0.22,
    label: "#f7f5f1",
    hsShadow: "#2d2820",
    hsHigh: "#fff7e8",
  },
  dusk: {
    sat: [0.04, 0.12, 0.03, 0.7],
    sky: "#45558f",
    horizon: "#f0a46a",
    fog: "#cf9270",
    light: "#ffb27a",
    lightI: 0.4,
    sunAz: 275,
    sunPolar: 70,
    road: "#ffe2c0",
    roadO: 0.45,
    roadBlur: 0.3,
    water: "#3c4f6b",
    waterO: 0.3,
    bg: "#6b5f5a",
    bld: ["#c9a58c", "#c09c86", "#a99a9a", "#8f93a8", "#8088a8"],
    tower: "#ffeedd",
    beam: 0.36,
    label: "#fff1e0",
    hsShadow: "#2a1d18",
    hsHigh: "#ffd2a8",
  },
  night: {
    sat: [-0.5, 0.12, 0, 0.26],
    sky: "#060912",
    horizon: "#1d2538",
    fog: "#121826",
    light: "#c3c6d0",
    lightI: 0.2,
    sunAz: 210,
    sunPolar: 50,
    road: "#f2a65a",
    roadO: 0.62,
    roadBlur: 0.8,
    water: "#0b1424",
    waterO: 0.5,
    bg: "#0c1119",
    bld: ["#2c2926", "#2e2c2d", "#302f31", "#33363d", "#3a3f4a"],
    tower: "#ffe7c6",
    beam: 0.5,
    label: "#e9e3d6",
    hsShadow: "#000000",
    hsHigh: "#4a4f60",
  },
};
type Mode = "day" | "night";

const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixHex = (a: string, b: string, t: number) => {
  const x = hexRgb(a);
  const y = hexRgb(b);
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
};
const mixN = (a: number, b: number, t: number) => a + (b - a) * t;

function mixPal(a: Pal, b: Pal, t: number): Pal {
  const out = {} as Record<string, unknown>;
  for (const k of Object.keys(a) as Array<keyof Pal>) {
    const va = a[k];
    const vb = b[k];
    if (typeof va === "number") out[k] = mixN(va, vb as number, t);
    else if (typeof va === "string") out[k] = mixHex(va, vb as string, t);
    else out[k] = (va as Array<string | number>).map((v, i) => (typeof v === "number" ? mixN(v, (vb as number[])[i], t) : mixHex(v, (vb as string[])[i], t)));
  }
  return out as Pal;
}

/** grade: 0 day, 1 dusk, 2 night */
export function paletteAt(grade: number): Pal {
  return grade <= 1 ? mixPal(PAL.day, PAL.dusk, Math.max(0, grade)) : mixPal(PAL.dusk, PAL.night, Math.min(1, grade - 1));
}

const BLD_STOPS = [0, 18, 40, 80, 150];
const bldExpr = (cols: string[]) => ["interpolate", ["linear"], ["coalesce", ["get", "render_height"], 9], ...BLD_STOPS.flatMap((s, i) => [s, cols[i]])];

// MapLibre's paint setters are strictly typed; the values here are hand-built expressions
type AnyPaint = (layer: string, name: string, value: unknown) => void;

function applyPalette(m: MLMap, s: Pal) {
  const paint = m.setPaintProperty.bind(m) as unknown as AnyPaint;
  const [sa, co, bmin, bmax] = s.sat;
  paint("satellite", "raster-saturation", sa);
  paint("satellite", "raster-contrast", co);
  paint("satellite", "raster-brightness-min", bmin);
  paint("satellite", "raster-brightness-max", bmax);
  try {
    m.setSky({ "sky-color": s.sky, "horizon-color": s.horizon, "fog-color": s.fog, "sky-horizon-blend": 0.7, "horizon-fog-blend": 0.8, "fog-ground-blend": 0.55, "atmosphere-blend": 0.7 });
  } catch {
    /* older spec */
  }
  m.setLight({ anchor: "map", position: [1.4, s.sunAz, s.sunPolar], color: s.light, intensity: s.lightI });
  paint("background", "background-color", s.bg);
  for (const l of m.getStyle().layers) {
    if (l.type === "line" && l.id.includes("highway")) {
      paint(l.id, "line-color", s.road);
      paint(l.id, "line-opacity", s.roadO);
      paint(l.id, "line-blur", s.roadBlur);
    }
    if (l.type === "symbol") paint(l.id, "text-color", s.label);
  }
  if (m.getLayer("water")) {
    paint("water", "fill-color", s.water);
    paint("water", "fill-opacity", s.waterO);
  }
  paint("relief", "hillshade-shadow-color", s.hsShadow);
  paint("relief", "hillshade-highlight-color", s.hsHigh);
  paint("osm-buildings", "fill-extrusion-color", bldExpr(s.bld));
  paint("runwal-beams-wide", "fill-extrusion-opacity", s.beam);
  paint("runwal-beams-slim", "fill-extrusion-opacity", Math.min(1, s.beam + 0.1));
  const kk = ["coalesce", ["feature-state", "k"], 0] as ExpressionSpecification;
  for (const id of ["runwal-towers", "runwal-pillars"]) {
    paint(id, "fill-extrusion-color", ["case", ["<", kk, 0.25], s.bg, ["boolean", ["feature-state", "hot"], false], "#f2a65a", ["get", "office"], "#dfe6f4", s.tower]);
  }
}

function applyMode(m: MLMap, mode: Mode) {
  applyPalette(m, PAL[mode]);
}

/* ------------------------------------------------------------------ component */

export type RealMapFinderProps = {
  match: string[];
  region: "All" | Region;
  onRegion: (r: "All" | Region) => void;
  /** scroll-driven flight (reads tourState); the map is interactive only in explore mode */
  tour?: boolean;
  explore?: boolean;
};

type Pin = { root: HTMLElement; chip: HTMLElement; lead: HTMLElement; w: number; h: number };

export default function RealMapFinder({ match, region, onRegion, tour = false, explore = false }: RealMapFinderProps) {
  const { go } = useTransition();
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const pinRefs = useRef(new Map<string, Pin>());
  const kRef = useRef(new Map<string, number>());
  const matchRef = useRef(new Set(match));
  const readyRef = useRef(false);
  const idleRef = useRef(true);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>("day");
  const modeRef = useRef<Mode>("day");
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [touch] = useState(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
  const [reduced] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const selected = picked && match.includes(picked) ? picked : null;
  const activeSlug = hovered ?? selected;
  const active = activeSlug ? ALL_PROJECTS.find((p) => p.slug === activeSlug) ?? null : null;
  const goRef = useRef(go);
  const stateRef = useRef({ hovered: null as string | null, selected: null as string | null });
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickRef = useRef<(slug: string) => void>(() => {});
  const flying = tour && !explore;
  const flyingRef = useRef(flying);
  useEffect(() => {
    flyingRef.current = flying;
  }, [flying]);

  useEffect(() => {
    goRef.current = go;
  }, [go]);

  const hover = (slug: string | null) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
    if (slug) setHovered(slug);
    else hoverTimer.current = setTimeout(() => setHovered(null), 240);
  };
  const hoverRef = useRef(hover);
  useEffect(() => {
    hoverRef.current = hover;
  });

  /* ---- create the map once ---- */
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let map: MLMap | null = null;
    let raf = 0;
    let layoutRaf = 0;
    let cancelled = false;
    const visible = { on: true };

    (async () => {
      let style: StyleSpecification;
      try {
        style = restyle((await (await fetch(STYLE_URL)).json()) as StyleSpecification);
      } catch {
        return;
      }
      if (cancelled) return;
      const m: MLMap = new MaplibreMap({
        container: el,
        style,
        center: touch ? HOME_MOBILE.center : HOME.center,
        zoom: touch ? HOME_MOBILE.zoom : HOME.zoom,
        pitch: touch ? 45 : 58,
        bearing: -18,
        maxPitch: 75,
        minZoom: 8.5,
        maxZoom: 17.5,
        attributionControl: false,
        scrollZoom: false,
        cooperativeGestures: touch,
        dragRotate: true,
        touchPitch: true,
        canvasContextAttributes: { antialias: true },
      });
      map = m;
      mapRef.current = m;

      m.on("load", () => {
        if (cancelled) return;
        try {
          if (!touch) m.setTerrain({ source: "dem", exaggeration: 1.5 });
        } catch {
          /* terrain is a bonus */
        }

        // OSM buildings: concrete low-rise to glass towers
        const firstLabel = m.getStyle().layers.find((l) => l.type === "symbol")?.id;
        m.addLayer(
          {
            id: "osm-buildings",
            type: "fill-extrusion",
            source: "openmaptiles",
            "source-layer": "building",
            minzoom: 12.5,
            paint: {
              "fill-extrusion-color": bldExpr(PAL.day.bld) as unknown as string,
              "fill-extrusion-height": ["coalesce", ["get", "render_height"], 9],
              "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
              "fill-extrusion-opacity": ["interpolate", ["linear"], ["zoom"], 12.5, 0, 13.6, 0.94] as unknown as number,
              "fill-extrusion-vertical-gradient": true,
            },
          },
          firstLabel,
        );

        m.addSource("runwal-towers", { type: "geojson", data: TOWERS, promoteId: "slug" });
        m.addSource("runwal-crowns", { type: "geojson", data: CROWNS, promoteId: "slug" });
        m.addSource("runwal-points", { type: "geojson", data: POINTS, promoteId: "slug" });
        m.addSource("runwal-pillars", { type: "geojson", data: PILLARS, promoteId: "slug" });
        m.addSource("runwal-beams-wide", { type: "geojson", data: BEAMS_WIDE, promoteId: "slug" });
        m.addSource("runwal-beams-slim", { type: "geojson", data: BEAMS_SLIM, promoteId: "slug" });

        m.addSource("runwal-constellation", { type: "geojson", data: CONSTELLATION });
        m.addLayer({
          id: "runwal-constellation",
          type: "line",
          source: "runwal-constellation",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": C.amber, "line-width": ["interpolate", ["linear"], ["zoom"], 8, 1.4, 13, 3], "line-blur": 0.6, "line-opacity": 0 },
        });

        const k = ["max", 0.015, ["coalesce", ["feature-state", "k"], 0]];
        const kk = ["coalesce", ["feature-state", "k"], 0];
        const tint = ["case", ["get", "office"], C.dusk, C.amber];

        // a soft glow and a crisp ring on the ground
        m.addLayer({
          id: "runwal-glow",
          type: "circle",
          source: "runwal-points",
          paint: {
            "circle-pitch-alignment": "map",
            "circle-radius": ["interpolate", ["exponential", 2], ["zoom"], 9, 22, 13, 120, 16, 420],
            "circle-color": tint,
            "circle-blur": 1,
            "circle-opacity": ["*", 0.45, kk],
          } as never,
        });
        m.addLayer({
          id: "runwal-halo",
          type: "circle",
          source: "runwal-points",
          paint: {
            "circle-pitch-alignment": "map",
            "circle-radius": ["interpolate", ["exponential", 2], ["zoom"], 9, 9, 13, 46, 16, 170],
            "circle-color": tint,
            "circle-opacity": ["*", 0.08, kk],
            "circle-stroke-color": tint,
            "circle-stroke-width": 1.4,
            "circle-stroke-opacity": ["*", 0.9, kk],
          } as never,
        });

        const pillarTop = ["interpolate", ["linear"], ["zoom"], 9, ["*", ["get", "h"], k, 16], 12.8, ["*", ["get", "h"], k, 4]];
        const towerTop = ["interpolate", ["linear"], ["zoom"], 12.4, ["*", ["get", "h"], k, 2.4], 14, ["*", ["get", "h"], k, 1.4], 16, ["*", ["get", "h"], k, 1.1]];

        m.addLayer({
          id: "runwal-beams-wide",
          type: "fill-extrusion",
          source: "runwal-beams-wide",
          maxzoom: 12.8,
          paint: {
            "fill-extrusion-base": 0,
            "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 9, ["+", ["*", ["get", "h"], k, 16], ["*", 5200, kk]], 12.8, ["+", ["*", ["get", "h"], k, 4], ["*", 1400, kk]]] as unknown as number,
            "fill-extrusion-color": tint as unknown as string,
            "fill-extrusion-opacity": PAL.day.beam,
            "fill-extrusion-vertical-gradient": false,
          },
        });
        m.addLayer({
          id: "runwal-pillars",
          type: "fill-extrusion",
          source: "runwal-pillars",
          maxzoom: 12.8,
          paint: { "fill-extrusion-height": pillarTop as unknown as number, "fill-extrusion-base": 0, "fill-extrusion-color": PAL.day.tower, "fill-extrusion-opacity": 1, "fill-extrusion-vertical-gradient": true },
        });
        m.addLayer({
          id: "runwal-pillar-crowns",
          type: "fill-extrusion",
          source: "runwal-pillars",
          maxzoom: 12.8,
          paint: {
            "fill-extrusion-base": pillarTop as unknown as number,
            "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 9, ["+", ["*", ["get", "h"], k, 16], ["*", 260, kk]], 12.8, ["+", ["*", ["get", "h"], k, 4], ["*", 60, kk]]] as unknown as number,
            "fill-extrusion-color": ["case", ["<", kk, 0.25], "rgba(0,0,0,0)", ["get", "office"], C.dusk, C.amber] as unknown as string,
            "fill-extrusion-opacity": 1,
          },
        });
        m.addLayer({
          id: "runwal-beams-slim",
          type: "fill-extrusion",
          source: "runwal-beams-slim",
          minzoom: 12.4,
          paint: {
            "fill-extrusion-base": 0,
            "fill-extrusion-height": [
              "interpolate",
              ["linear"],
              ["zoom"],
              12.4,
              ["+", ["*", ["get", "h"], k, 2.4], ["*", 1600, kk]],
              14,
              ["+", ["*", ["get", "h"], k, 1.4], ["*", 1000, kk]],
              16,
              ["+", ["*", ["get", "h"], k, 1.1], ["*", 700, kk]],
            ] as unknown as number,
            "fill-extrusion-color": tint as unknown as string,
            "fill-extrusion-opacity": PAL.day.beam + 0.1,
            "fill-extrusion-vertical-gradient": false,
          },
        });
        m.addLayer({
          id: "runwal-towers",
          type: "fill-extrusion",
          source: "runwal-towers",
          minzoom: 12.4,
          paint: { "fill-extrusion-height": towerTop as unknown as number, "fill-extrusion-base": 0, "fill-extrusion-color": PAL.day.tower, "fill-extrusion-opacity": 1, "fill-extrusion-vertical-gradient": true },
        });
        m.addLayer({
          id: "runwal-crowns",
          type: "fill-extrusion",
          source: "runwal-crowns",
          minzoom: 12.4,
          paint: {
            "fill-extrusion-base": towerTop as unknown as number,
            "fill-extrusion-height": [
              "interpolate",
              ["linear"],
              ["zoom"],
              12.4,
              ["+", ["*", ["get", "h"], k, 2.4], ["*", 40, kk]],
              14,
              ["+", ["*", ["get", "h"], k, 1.4], ["*", 22, kk]],
              16,
              ["+", ["*", ["get", "h"], k, 1.1], ["*", 14, kk]],
            ] as unknown as number,
            "fill-extrusion-color": ["case", ["<", kk, 0.25], "rgba(0,0,0,0)", ["get", "office"], C.dusk, C.amber] as unknown as string,
            "fill-extrusion-opacity": 1,
          },
        });
        applyMode(m, "day");

        // name chips: a pin (with a leader line) holding a chip that the layout pass can nudge
        for (const p of ALL_PROJECTS) {
          const root = document.createElement("div");
          root.className = "rw-pin";
          const lead = document.createElement("span");
          lead.className = "rw-lead";
          const chip = document.createElement("button");
          chip.type = "button";
          chip.className = "rw-chip";
          chip.setAttribute("aria-label", `${p.name}, ${p.area}`);
          chip.innerHTML = `<span class="rw-chip-dot" style="background:${p.kind === "Commercial" ? C.dusk : C.amber}"></span><span class="rw-chip-name">${p.short}</span><span class="rw-chip-area">${p.area.split(",")[0]}</span>`;
          chip.addEventListener("mouseenter", () => hoverRef.current(p.slug));
          chip.addEventListener("mouseleave", () => hoverRef.current(null));
          chip.addEventListener("click", (e) => {
            e.stopPropagation();
            pickRef.current(p.slug);
          });
          root.append(lead, chip);
          new Marker({ element: root, anchor: "top", offset: [0, 8] }).setLngLat([p.lon, p.lat]).addTo(m);
          pinRefs.current.set(p.slug, { root, chip, lead, w: 0, h: 0 });
        }

        // hover + click on the extrusions
        const slugAt = (e: MapMouseEvent) => {
          const f = m.queryRenderedFeatures(e.point, { layers: ["runwal-crowns", "runwal-towers", "runwal-pillar-crowns", "runwal-pillars"] })[0];
          const s = f?.properties?.slug as string | undefined;
          return s && matchRef.current.has(s) ? s : null;
        };
        m.on("mousemove", (e) => {
          if (flyingRef.current) return;
          const s = slugAt(e);
          m.getCanvas().style.cursor = s ? "pointer" : "";
          if (s) hoverRef.current(s);
          else if (stateRef.current.hovered) hoverRef.current(null);
        });
        m.on("click", (e) => {
          if (flyingRef.current) return;
          const s = slugAt(e);
          if (s) pickRef.current(s);
          else if (stateRef.current.selected) setPicked(null);
        });

        const stopIdle = () => {
          idleRef.current = false;
        };
        m.on("dragstart", stopIdle);
        m.on("rotatestart", stopIdle);
        m.on("pitchstart", stopIdle);
        m.on("zoomstart", (e) => {
          if ((e as { originalEvent?: unknown }).originalEvent) stopIdle();
        });

        readyRef.current = true;
        setReady(true);
        ALL_PROJECTS.forEach((p, i) => setTimeout(() => animateK(m, p.slug, matchRef.current.has(p.slug) ? 1 : 0), reduced ? 0 : 400 + i * 90));
      });

      // card follows its tower
      const placeCard = () => {
        const card = cardRef.current;
        const s = stateRef.current.hovered ?? stateRef.current.selected;
        if (!card || !s || flyingRef.current) return;
        const p = ALL_PROJECTS.find((x) => x.slug === s);
        if (!p) return;
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (touch) {
          card.dataset.mode = "dock";
          card.style.transform = `translate3d(${w / 2}px, ${h - 16}px, 0)`;
          return;
        }
        const pt = m.project([p.lon, p.lat]);
        const right = pt.x < w - 330;
        const x = right ? Math.min(w - 276, pt.x + 46) : Math.max(276, pt.x - 46);
        const y = Math.min(h - 320, Math.max(84, pt.y - 250));
        card.dataset.mode = right ? "right" : "left";
        card.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      };

      // label layout: chips never overlap; a pushed chip keeps a leader line to its tower
      const layoutChips = () => {
        layoutRaf = 0;
        const placed: Array<[number, number, number, number]> = [];
        const items: Array<{ p: Project; pin: Pin; pt: { x: number; y: number } }> = [];
        for (const p of ALL_PROJECTS) {
          const pin = pinRefs.current.get(p.slug);
          if (pin && matchRef.current.has(p.slug) && pin.root.dataset.tour !== "off") items.push({ p, pin, pt: m.project([p.lon, p.lat]) });
        }
        items.sort((a, b) => a.pt.y - b.pt.y);
        const hot = stateRef.current.hovered ?? stateRef.current.selected;
        for (const { p, pin, pt } of items) {
          if (!pin.w) {
            pin.w = pin.chip.offsetWidth || 90;
            pin.h = pin.chip.offsetHeight || 26;
          }
          const tries: Array<[number, number]> = [
            [0, 0],
            [0, 30],
            [pin.w / 2 + 10, 14],
            [-(pin.w / 2 + 10), 14],
            [0, 60],
            [pin.w / 2 + 10, 46],
            [-(pin.w / 2 + 10), 46],
            [0, 90],
            [0, 120],
          ];
          let pick: [number, number] = tries[tries.length - 1];
          for (const t of tries) {
            const x0 = pt.x - pin.w / 2 + t[0] - 4;
            const y0 = pt.y + 8 + t[1] - 3;
            const r: [number, number, number, number] = [x0, y0, x0 + pin.w + 8, y0 + pin.h + 6];
            if (!placed.some((q) => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1])) {
              pick = t;
              placed.push(r);
              break;
            }
          }
          let dx = pick[0];
          const dy = pick[1];
          const left = pt.x - pin.w / 2 + dx;
          if (left < 6) dx += 6 - left;
          if (left + pin.w > el.clientWidth - 6) dx -= left + pin.w - (el.clientWidth - 6);
          pin.chip.style.transform = `translate(${dx}px, ${dy}px)`;
          const len = Math.hypot(dx, dy + 8);
          const ang = Math.atan2(dx, dy + 8);
          pin.lead.style.height = `${len}px`;
          pin.lead.style.transform = `rotate(${-ang}rad)`;
          pin.root.dataset.hot = p.slug === hot ? "1" : "0";
        }
      };
      m.on("render", () => {
        placeCard();
        if (!layoutRaf) layoutRaf = requestAnimationFrame(layoutChips);
      });

      // the flight: camera, light and labels follow the scroll progress
      let lastP = -1;
      let lastGrade = -1;
      let lastChapter = -99;
      let interactive = true;
      const paintAny = m.setPaintProperty.bind(m) as unknown as AnyPaint;
      const setInteractive = (on: boolean) => {
        if (on === interactive) return;
        interactive = on;
        [m.dragPan, m.dragRotate, m.touchZoomRotate, m.doubleClickZoom, m.keyboard, m.touchPitch, m.boxZoom].forEach((h) => (on ? h.enable() : h.disable()));
      };
      const fly = () => {
        const p = tourState.p;
        if (Math.abs(p - lastP) < 0.0004) return;
        lastP = p;
        m.jumpTo({ ...cameraAt(p, touch), padding: touch ? { top: 40, bottom: Math.round(el.clientHeight * 0.42), left: 0, right: 0 } : { top: 0, bottom: 0, left: 0, right: 0 } });
        const g = gradeAt(p);
        if (Math.abs(g - lastGrade) > 0.02) {
          lastGrade = g;
          applyPalette(m, paletteAt(g));
        }
        const { i, t } = chapterAt(p);
        paintAny("runwal-constellation", "line-opacity", i >= TOUR.length ? Math.min(0.9, t * 1.6) : 0);
        if (i !== lastChapter) {
          lastChapter = i;
          const cur = i >= 0 && i < TOUR.length ? TOUR[i].slug : null;
          for (const pr of ALL_PROJECTS) {
            m.setFeatureState({ source: "runwal-towers", id: pr.slug }, { hot: pr.slug === cur });
            m.setFeatureState({ source: "runwal-pillars", id: pr.slug }, { hot: pr.slug === cur });
            const pin = pinRefs.current.get(pr.slug);
            if (pin) pin.root.dataset.tour = (cur === null && !touch) || pr.slug === cur ? "on" : "off";
          }
        }
      };

      // idle drift: a very slow turn of the city
      const tick = () => {
        raf = requestAnimationFrame(tick);
        if (!readyRef.current) return;
        if (flyingRef.current) {
          setInteractive(false);
          if (visible.on) fly();
          return;
        }
        if (!interactive) {
          setInteractive(true);
          m.setPadding({ top: 0, bottom: 0, left: 0, right: 0 });
          lastP = -1;
          lastGrade = -1;
          lastChapter = -99;
          for (const pin of pinRefs.current.values()) pin.root.dataset.tour = "on";
          paintAny("runwal-constellation", "line-opacity", 0);
          for (const pr of ALL_PROJECTS) {
            m.setFeatureState({ source: "runwal-towers", id: pr.slug }, { hot: false });
            m.setFeatureState({ source: "runwal-pillars", id: pr.slug }, { hot: false });
          }
          applyMode(m, modeRef.current);
        }
        if (!idleRef.current || reduced || !visible.on || m.isMoving()) return;
        if (stateRef.current.hovered || stateRef.current.selected) return;
        m.setBearing(m.getBearing() + 0.025);
      };
      raf = requestAnimationFrame(tick);
    })();

    const io = new IntersectionObserver(([e]) => {
      visible.on = e.isIntersecting;
    });
    io.observe(el);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(layoutRaf);
      io.disconnect();
      map?.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
    // the map is created once; later changes flow through refs and effects below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- tower height animation (feature-state k) ---- */
  function animateK(m: MLMap, slug: string, to: number) {
    const from = kRef.current.get(slug) ?? 0;
    if (Math.abs(from - to) < 0.001) return;
    const t0 = performance.now();
    const dur = reduced ? 1 : 650;
    const step = (now: number) => {
      if (!readyRef.current) return;
      const t = Math.min(1, (now - t0) / dur);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const v = from + (to - from) * e;
      kRef.current.set(slug, v);
      for (const src of ["runwal-towers", "runwal-crowns", "runwal-points", "runwal-pillars", "runwal-beams-wide", "runwal-beams-slim"]) m.setFeatureState({ source: src, id: slug }, { k: v });
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---- day / night ---- */
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !ready || flying) return;
    applyMode(m, mode);
  }, [mode, ready, flying]);

  /* ---- filters -> towers + chips ---- */
  useEffect(() => {
    matchRef.current = new Set(match);
    const m = mapRef.current;
    for (const [slug, pin] of pinRefs.current) pin.root.dataset.off = match.includes(slug) ? "0" : "1";
    if (!m || !ready) return;
    ALL_PROJECTS.forEach((p, i) => setTimeout(() => animateK(m, p.slug, match.includes(p.slug) ? 1 : 0), reduced ? 0 : i * 40));
    m.triggerRepaint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match, ready]);

  /* ---- region -> camera ---- */
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !ready || flyingRef.current) return;
    const pad = touch ? { top: 110, bottom: 60, left: 30, right: 30 } : { top: 110, bottom: 70, left: 80, right: 80 };
    if (region === "Pune") {
      const p = ALL_PROJECTS.find((x) => x.region === "Pune");
      if (p) m.flyTo({ center: [p.lon, p.lat], zoom: 14.6, pitch: 60, bearing: -24, duration: reduced ? 0 : 2600, essential: true });
      return;
    }
    if (region === "All") {
      const v = touch ? HOME_MOBILE : HOME;
      m.flyTo({ center: v.center, zoom: v.zoom, pitch: touch ? 45 : 58, bearing: -18, duration: reduced ? 0 : 2000, essential: true });
      return;
    }
    const list = ALL_PROJECTS.filter((p) => p.region === region);
    if (!list.length) return;
    if (list.length === 1) m.flyTo({ center: [list[0].lon, list[0].lat], zoom: 14.8, pitch: 60, duration: reduced ? 0 : 2000, essential: true });
    else m.fitBounds(boundsFor(list), { padding: pad, pitch: touch ? 45 : 58, bearing: -24, duration: reduced ? 0 : 2000, maxZoom: 14.4 });
  }, [region, ready, touch, reduced]);

  /* ---- hover / selection state into the map ---- */
  useEffect(() => {
    stateRef.current = { hovered, selected };
    const m = mapRef.current;
    if (!m || !ready) return;
    for (const p of ALL_PROJECTS) {
      const hot = p.slug === hovered || p.slug === selected;
      m.setFeatureState({ source: "runwal-towers", id: p.slug }, { hot });
      m.setFeatureState({ source: "runwal-pillars", id: p.slug }, { hot });
      const pin = pinRefs.current.get(p.slug);
      if (pin) pin.root.dataset.hot = hot ? "1" : "0";
    }
    m.triggerRepaint();
  }, [hovered, selected, ready]);

  useEffect(() => {
    pickRef.current = (slug: string) => {
      const m = mapRef.current;
      const p = ALL_PROJECTS.find((x) => x.slug === slug);
      if (!m || !p || !matchRef.current.has(slug)) return;
      if (stateRef.current.selected === slug) {
        goRef.current(`/residences/${slug}`);
        return;
      }
      idleRef.current = false;
      setPicked(slug);
      m.flyTo({ center: [p.lon, p.lat], zoom: 15.6, pitch: 62, bearing: m.getBearing() - 12, duration: reduced ? 0 : 2200, essential: true, offset: touch ? [0, -90] : [-120, 40] });
    };
  });

  const zoom = (d: number) => {
    idleRef.current = false;
    mapRef.current?.easeTo({ zoom: (mapRef.current?.getZoom() ?? 11) + d, duration: 500 });
  };
  const reset = () => {
    setPicked(null);
    const m = mapRef.current;
    if (!m) return;
    if (region === "Pune") onRegion("All");
    else if (region === "All") {
      const v = touch ? HOME_MOBILE : HOME;
      m.flyTo({ center: v.center, zoom: v.zoom, pitch: touch ? 45 : 58, bearing: -18, duration: 1600 });
    } else m.fitBounds(boundsFor(ALL_PROJECTS.filter((p) => p.region === region)), { padding: { top: 110, bottom: 70, left: 80, right: 80 }, pitch: touch ? 45 : 58, bearing: -18, duration: 1600, maxZoom: 14.4 });
  };

  const cardStats = useMemo(() => {
    if (!active) return null;
    return active.kind === "Commercial"
      ? { left: active.facts[0] ? `${active.facts[0].value} ${active.facts[0].label.toLowerCase()}` : "Offices", right: "Offices", cta: "View offices" }
      : { left: bhkLabel(active), right: active.priceFrom ? `From ${active.priceFrom}` : "Price on request", cta: "View residence" };
  }, [active]);

  const night = mode === "night";
  const ctl = `border backdrop-blur ${night ? "border-white/15 bg-graphite/70 text-stone" : "border-graphite/15 bg-paper/90 text-graphite"}`;
  const ctlBtn = night ? "hover:bg-stone hover:text-graphite" : "hover:bg-graphite hover:text-stone";

  return (
    <div className="relative h-full w-full">
      <div ref={box} className="!absolute inset-0 h-full w-full bg-[#c9c4b8]" aria-label="Aerial map of Runwal residences across Mumbai, Thane and Pune" role="region" />

      {!ready && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="kicker animate-pulse text-graphite/70">Loading the city&hellip;</span>
        </div>
      )}

      {/* soft vignette so chrome stays legible on imagery */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,transparent_55%,rgba(13,16,21,0.28)_100%)]" aria-hidden />

      {/* card */}
      <div ref={cardRef} data-mode="right" className="group/card pointer-events-none absolute left-0 top-0 z-20 will-change-transform">
        <div
          onPointerEnter={() => activeSlug && hover(activeSlug)}
          onPointerLeave={() => hover(null)}
          className={`w-64 border border-graphite/10 bg-paper/95 shadow-[0_30px_60px_-25px_rgba(22,24,27,0.55)] backdrop-blur-xl transition-[opacity,translate] duration-500 ease-[var(--ease-out-expo)] group-data-[mode=dock]/card:w-[min(22rem,calc(100vw-2.5rem))] group-data-[mode=dock]/card:-translate-x-1/2 group-data-[mode=dock]/card:-translate-y-full group-data-[mode=left]/card:-translate-x-full ${
            active ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          {active && cardStats && (
            <>
              <div className="relative aspect-[16/9] overflow-hidden bg-stone-2 group-data-[mode=dock]/card:hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img key={active.slug} src={active.images.card || active.images.hero} alt={`${active.name}, ${active.area}`} className="absolute inset-0 h-full w-full object-cover" loading="eager" decoding="async" />
              </div>
              <div className="p-4">
                <p className="kicker text-[0.62rem] text-mute">
                  {active.area} &middot; {active.region}
                </p>
                <p className="title mt-1.5 text-xl">{active.name}</p>
                <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-graphite/10 pt-3 text-[0.78rem]">
                  <span className="font-medium">{cardStats.left}</span>
                  <span className={`kicker text-[0.62rem] ${active.kind === "Commercial" ? "text-dusk" : "text-mute"}`}>{cardStats.right}</span>
                </div>
                <button
                  type="button"
                  onClick={() => go(`/residences/${active.slug}`)}
                  className="group mt-4 flex w-full items-center justify-between bg-graphite px-4 py-3 text-[0.78rem] font-medium text-stone transition-colors hover:bg-dusk"
                >
                  {cardStats.cta} <span className="transition-transform duration-500 group-hover:translate-x-1">&rarr;</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* controls */}
      <div className={`absolute bottom-8 right-6 z-10 flex flex-col items-end gap-3 transition-opacity duration-500 md:bottom-10 md:right-10 ${flying ? "pointer-events-none opacity-0" : "opacity-100"}`}>
        {region !== "Pune" && (
          <button type="button" onClick={() => onRegion("Pune")} className={`kicker flex items-center gap-2 px-3 py-2 transition-colors ${ctl} ${ctlBtn}`}>
            Also in Pune &middot; 150 km <span aria-hidden>&rarr;</span>
          </button>
        )}
        <div className={`flex ${ctl}`} role="group" aria-label="Time of day">
          {(["day", "night"] as Mode[]).map((md) => (
            <button
              key={md}
              type="button"
              onClick={() => setMode(md)}
              aria-pressed={mode === md}
              className={`kicker flex h-10 items-center gap-2 px-3 text-[0.62rem] transition-colors ${mode === md ? (night ? "bg-amber text-graphite" : "bg-graphite text-stone") : ctlBtn}`}
            >
              <span aria-hidden>{md === "day" ? "☀" : "☾"}</span>
              {md === "day" ? "Day" : "Night"}
            </button>
          ))}
        </div>
        <div className={`flex ${ctl}`}>
          <button type="button" onClick={() => zoom(1)} aria-label="Zoom in" className={`flex size-10 items-center justify-center text-lg transition-colors ${ctlBtn}`}>
            +
          </button>
          <button type="button" onClick={() => zoom(-1)} aria-label="Zoom out" className={`flex size-10 items-center justify-center border-x text-lg transition-colors ${night ? "border-white/15" : "border-graphite/15"} ${ctlBtn}`}>
            &minus;
          </button>
          <button type="button" onClick={reset} aria-label="Reset view" className={`kicker flex h-10 items-center px-3 text-[0.62rem] transition-colors ${ctlBtn}`}>
            Reset
          </button>
        </div>
      </div>

      <p className="kicker pointer-events-none absolute bottom-2 left-4 right-4 z-10 truncate text-[0.5rem] text-white/75 [text-shadow:0_1px_4px_rgba(0,0,0,.7)] md:bottom-3 md:left-10 md:right-auto">
        <span className="md:hidden">&copy; EOX Sentinel-2 &middot; AWS terrain &middot; OpenFreeMap &middot; OSM</span>
        <span className="hidden md:inline">
          Imagery: Sentinel-2 cloudless by EOX (Copernicus data) &middot; Terrain: AWS / Mapzen terrain tiles &middot; &copy; OpenFreeMap &copy; OpenStreetMap contributors
        </span>
      </p>

      {/* pin + chip styles (markers are created outside React) */}
      <style>{`
        .rw-pin{position:relative;width:0;height:0;overflow:visible}
        .rw-lead{position:absolute;left:0;top:-8px;width:1px;transform-origin:0 0;background:linear-gradient(to bottom,rgba(242,166,90,.95),rgba(255,255,255,.65));pointer-events:none}
        .rw-chip{position:absolute;left:0;top:0;margin-left:0;display:flex;align-items:center;gap:7px;padding:6px 10px 6px 8px;translate:-50% 0;background:rgba(16,18,22,.78);border:1px solid rgba(255,255,255,.16);color:#f4f1ea;white-space:nowrap;cursor:pointer;backdrop-filter:blur(10px);box-shadow:0 10px 24px -12px rgba(0,0,0,.6);transition:opacity .5s,visibility .5s,background-color .3s,color .3s,transform .45s cubic-bezier(.16,1,.3,1)}
        .rw-chip-dot{width:6px;height:6px;display:inline-block;box-shadow:0 0 8px currentColor}
        .rw-chip-name{font:600 11.5px/1 var(--font-geist),system-ui,sans-serif;letter-spacing:.01em}
        .rw-chip-area{font:400 8.5px/1 var(--font-geist-mono),monospace;letter-spacing:.14em;text-transform:uppercase;color:rgba(244,241,234,.55)}
        .rw-pin[data-off="1"],.rw-pin[data-tour="off"]{opacity:0;visibility:hidden;pointer-events:none}
        .rw-pin[data-off="1"] .rw-chip{pointer-events:none}
        .rw-pin[data-hot="1"]{z-index:5}
        .rw-pin[data-hot="1"] .rw-chip{background:#f2a65a;color:#16181b;border-color:#f2a65a}
        .rw-pin[data-hot="1"] .rw-chip-area{color:rgba(22,24,27,.65)}
        .maplibregl-cooperative-gesture-screen{font:400 12px/1.4 var(--font-geist-mono),monospace;letter-spacing:.08em;text-transform:uppercase;background:rgba(22,24,27,.55)}
      `}</style>
    </div>
  );
}
