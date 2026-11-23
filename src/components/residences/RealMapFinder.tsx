"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { getVersion, Map as MaplibreMap, Marker, setWorkerUrl, type LngLatBoundsLike, type Map as MLMap, type MapMouseEvent, type StyleSpecification } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import { bhkLabel } from "@/lib/project-format";
import { ALL_PROJECTS, type Project, type Region } from "@/lib/projects";
import { useTransition } from "../site/Transition";

/*
  The Runwal map, for real: OpenFreeMap vector tiles (OpenStreetMap data) restyled to the Skyline
  palette, every OSM building extruded in white "clay", and each Runwal address as a tall custom
  tower with an amber crown. The filters below drive it: matching towers rise, the rest sink.
*/

const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

// The bundler can't follow MapLibre's worker import, so the worker ships as a static file
// (public/vendor, copied from node_modules/maplibre-gl/dist for the pinned version).
setWorkerUrl(`/vendor/maplibre-gl-worker-${getVersion()}.mjs`);

const C = {
  stone: "#eeebe5",
  land: "#ebe7e0",
  water: "#b7c6d3",
  park: "#dfe3d3",
  road: "#ffffff",
  roadMinor: "#f6f4f0",
  rail: "#d6d1c7",
  clay: "#f4f2ed",
  label: "#77746d",
  amber: "#f2a65a",
  dusk: "#6f86e8",
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

const TOWERS: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
  type: "FeatureCollection",
  features: ALL_PROJECTS.flatMap((p) =>
    footprints(p).map(
      (f): Feat => ({
        type: "Feature",
        geometry: square(p.lon, p.lat, f.dx, f.dz, f.half),
        properties: { slug: p.slug, h: heightOf(p) * f.hk, office: p.kind === "Commercial" },
      }),
    ),
  ),
};

const CROWNS: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
  type: "FeatureCollection",
  features: ALL_PROJECTS.map((p) => {
    const f = footprints(p)[0];
    return {
      type: "Feature",
      geometry: square(p.lon, p.lat, f.dx, f.dz, f.half * 0.55),
      properties: { slug: p.slug, h: heightOf(p) * f.hk, office: p.kind === "Commercial" },
    } satisfies Feat;
  }),
};

// at city zoom a 60 m tower is a pixel wide, so each address also gets a broad light pillar
const PILLARS: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
  type: "FeatureCollection",
  features: ALL_PROJECTS.map((p) => ({
    type: "Feature",
    geometry: square(p.lon, p.lat, 0, 0, 120),
    properties: { slug: p.slug, h: heightOf(p), office: p.kind === "Commercial" },
  })),
};

const POINTS: GeoJSON.FeatureCollection<GeoJSON.Point> = {
  type: "FeatureCollection",
  features: ALL_PROJECTS.map((p) => ({ type: "Feature", geometry: { type: "Point", coordinates: [p.lon, p.lat] }, properties: { slug: p.slug, office: p.kind === "Commercial" } })),
};

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

/* ------------------------------------------------------------------ restyle */

function restyle(style: StyleSpecification): StyleSpecification {
  const layers = style.layers
    .filter((l) => {
      // keep the city legible and quiet: no shields, POIs, path names or boundaries
      if (l.type === "symbol") return ["label_city", "label_town", "label_village", "label_other", "water_name_point_label"].includes(l.id);
      if (l.id.startsWith("boundary")) return false;
      if (l.id === "building") return false;
      return true;
    })
    .map((l) => {
      const paint = { ...(l as { paint?: Record<string, unknown> }).paint };
      const layout = { ...(l as { layout?: Record<string, unknown> }).layout };
      if (l.type === "background") paint["background-color"] = C.land;
      if (l.id === "water") paint["fill-color"] = C.water;
      if (l.id === "waterway") paint["line-color"] = C.water;
      if (l.id === "park" || l.id === "landcover_wood") {
        paint["fill-color"] = C.park;
        paint["fill-opacity"] = 0.7;
      }
      if (l.id === "landuse_residential") paint["fill-color"] = "#e8e4dc";
      if (l.type === "line" && l.id.startsWith("highway")) {
        const minor = /minor|path/.test(l.id);
        if (l.id.includes("casing")) paint["line-color"] = "#e2ddd4";
        else paint["line-color"] = minor ? C.roadMinor : C.road;
      }
      if (l.type === "line" && l.id.startsWith("railway")) paint["line-color"] = C.rail;
      if (l.type === "symbol") {
        layout["text-font"] = ["Noto Sans Regular"];
        layout["text-transform"] = "uppercase";
        layout["text-letter-spacing"] = 0.22;
        layout["icon-image"] = "";
        paint["text-color"] = l.id.startsWith("water") ? "#7f93a6" : C.label;
        paint["text-halo-color"] = "rgba(238,235,229,0.85)";
        paint["text-halo-width"] = 1.2;
        paint["text-halo-blur"] = 0.5;
      }
      const out = { ...l, paint, layout } as typeof l;
      const minZ: Record<string, number> = { label_town: 11.2, label_village: 12.6, label_other: 13.6, water_name_point_label: 11 };
      if (minZ[l.id] !== undefined) (out as { minzoom?: number }).minzoom = minZ[l.id];
      return out;
    });
  return { ...style, layers };
}

/* ------------------------------------------------------------------ component */

export type RealMapFinderProps = {
  match: string[];
  region: "All" | Region;
  onRegion: (r: "All" | Region) => void;
};

export default function RealMapFinder({ match, region, onRegion }: RealMapFinderProps) {
  const { go } = useTransition();
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef(new Map<string, HTMLElement>());
  const kRef = useRef(new Map<string, number>());
  const matchRef = useRef(new Set(match));
  const readyRef = useRef(false);
  const idleRef = useRef(true);
  const [ready, setReady] = useState(false);
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
        pitch: touch ? 45 : 56,
        bearing: -18,
        maxPitch: 72,
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
        m.setLight({ anchor: "map", position: [1.4, 255, 40], color: "#fffaf2", intensity: 0.42 });
        try {
          m.setSky({ "sky-color": "#c3cfdc", "horizon-color": C.stone, "fog-color": C.stone, "sky-horizon-blend": 0.7, "horizon-fog-blend": 0.85, "fog-ground-blend": 0.75 });
        } catch {
          /* older style spec: plain background is fine */
        }

        // OSM buildings as white clay
        const firstLabel = m.getStyle().layers.find((l) => l.type === "symbol")?.id;
        m.addLayer(
          {
            id: "clay-buildings",
            type: "fill-extrusion",
            source: "openmaptiles",
            "source-layer": "building",
            minzoom: 12.5,
            paint: {
              "fill-extrusion-color": C.clay,
              "fill-extrusion-height": ["coalesce", ["get", "render_height"], 9],
              "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
              "fill-extrusion-opacity": ["interpolate", ["linear"], ["zoom"], 12.5, 0, 13.5, 0.92] as unknown as number,
              "fill-extrusion-vertical-gradient": true,
            },
          },
          firstLabel,
        );

        m.addSource("runwal-towers", { type: "geojson", data: TOWERS, promoteId: "slug" });
        m.addSource("runwal-crowns", { type: "geojson", data: CROWNS, promoteId: "slug" });
        m.addSource("runwal-points", { type: "geojson", data: POINTS, promoteId: "slug" });
        m.addSource("runwal-pillars", { type: "geojson", data: PILLARS, promoteId: "slug" });

        const k = ["max", 0.015, ["coalesce", ["feature-state", "k"], 0]];
        m.addLayer({
          id: "runwal-halo",
          type: "circle",
          source: "runwal-points",
          paint: {
            "circle-pitch-alignment": "map",
            "circle-radius": ["interpolate", ["exponential", 2], ["zoom"], 9, 9, 13, 46, 16, 170],
            "circle-color": ["case", ["get", "office"], C.dusk, C.amber],
            "circle-opacity": ["*", 0.1, ["coalesce", ["feature-state", "k"], 0]],
            "circle-stroke-color": ["case", ["get", "office"], C.dusk, C.amber],
            "circle-stroke-width": 1.2,
            "circle-stroke-opacity": ["*", 0.75, ["coalesce", ["feature-state", "k"], 0]],
          },
        });
        const kk = ["coalesce", ["feature-state", "k"], 0];
        m.addLayer({
          id: "runwal-pillars",
          type: "fill-extrusion",
          source: "runwal-pillars",
          maxzoom: 12.8,
          paint: {
            "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 9, ["*", ["get", "h"], k, 16], 12.8, ["*", ["get", "h"], k, 4]] as unknown as number,
            "fill-extrusion-base": 0,
            "fill-extrusion-color": [
              "case",
              ["<", kk, 0.25],
              C.land,
              ["boolean", ["feature-state", "hot"], false],
              "#2b2e33",
              ["get", "office"],
              "#e9eef6",
              "#ffffff",
            ] as unknown as string,
            "fill-extrusion-opacity": 1,
            "fill-extrusion-vertical-gradient": true,
          },
        });
        // the amber crown band on each pillar
        m.addLayer({
          id: "runwal-pillar-crowns",
          type: "fill-extrusion",
          source: "runwal-pillars",
          maxzoom: 12.8,
          paint: {
            "fill-extrusion-base": ["interpolate", ["linear"], ["zoom"], 9, ["*", ["get", "h"], k, 16], 12.8, ["*", ["get", "h"], k, 4]] as unknown as number,
            "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 9, ["+", ["*", ["get", "h"], k, 16], ["*", 260, kk]], 12.8, ["+", ["*", ["get", "h"], k, 4], ["*", 60, kk]]] as unknown as number,
            "fill-extrusion-color": ["case", ["<", kk, 0.25], C.land, ["get", "office"], C.dusk, C.amber] as unknown as string,
            "fill-extrusion-opacity": 1,
          },
        });
        m.addLayer({
          id: "runwal-towers",
          type: "fill-extrusion",
          source: "runwal-towers",
          minzoom: 12.4,
          paint: {
            "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 12.4, ["*", ["get", "h"], k, 2.4], 14, ["*", ["get", "h"], k, 1.4], 16, ["*", ["get", "h"], k, 1.1]] as unknown as number,
            "fill-extrusion-base": 0,
            "fill-extrusion-color": [
              "case",
              ["<", kk, 0.25],
              C.land,
              ["boolean", ["feature-state", "hot"], false],
              "#fde3c2",
              ["get", "office"],
              "#e6ebf3",
              "#ffffff",
            ] as unknown as string,
            "fill-extrusion-opacity": 1,
            "fill-extrusion-vertical-gradient": true,
          },
        });
        m.addLayer({
          id: "runwal-crowns",
          type: "fill-extrusion",
          source: "runwal-crowns",
          minzoom: 12.4,
          paint: {
            "fill-extrusion-base": ["interpolate", ["linear"], ["zoom"], 12.4, ["*", ["get", "h"], k, 2.4], 14, ["*", ["get", "h"], k, 1.4], 16, ["*", ["get", "h"], k, 1.1]] as unknown as number,
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
            "fill-extrusion-color": ["case", ["<", kk, 0.25], C.land, ["get", "office"], C.dusk, C.amber] as unknown as string,
            "fill-extrusion-opacity": 1,
          },
        });

        // name chips
        for (const p of ALL_PROJECTS) {
          const chip = document.createElement("button");
          chip.type = "button";
          chip.className = "rw-chip";
          chip.setAttribute("aria-label", `${p.name}, ${p.area}`);
          chip.innerHTML = `<span class="rw-chip-dot" style="background:${p.kind === "Commercial" ? C.dusk : C.amber}"></span><span>${p.short}</span>`;
          chip.addEventListener("mouseenter", () => hoverRef.current(p.slug));
          chip.addEventListener("mouseleave", () => hoverRef.current(null));
          chip.addEventListener("click", (e) => {
            e.stopPropagation();
            pickRef.current(p.slug);
          });
          chipRefs.current.set(p.slug, chip);
          new Marker({ element: chip, anchor: "top", offset: [0, 10] }).setLngLat([p.lon, p.lat]).addTo(m);
        }

        // hover + click on the extrusions
        const slugAt = (e: MapMouseEvent) => {
          const f = m.queryRenderedFeatures(e.point, { layers: ["runwal-crowns", "runwal-towers", "runwal-pillar-crowns", "runwal-pillars"] })[0];
          const s = f?.properties?.slug as string | undefined;
          return s && matchRef.current.has(s) ? s : null;
        };
        m.on("mousemove", (e) => {
          const s = slugAt(e);
          m.getCanvas().style.cursor = s ? "pointer" : "";
          if (s) hoverRef.current(s);
          else if (stateRef.current.hovered) hoverRef.current(null);
        });
        m.on("click", (e) => {
          const s = slugAt(e);
          if (s) pickRef.current(s);
          else if (stateRef.current.selected) setPicked(null);
        });

        // the first interaction ends the idle drift
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
        // towers rise in, staggered
        ALL_PROJECTS.forEach((p, i) => setTimeout(() => animateK(m, p.slug, matchRef.current.has(p.slug) ? 1 : 0), reduced ? 0 : 400 + i * 90));
      });

      // card follows its tower
      const placeCard = () => {
        const card = cardRef.current;
        const s = stateRef.current.hovered ?? stateRef.current.selected;
        if (!card || !s) return;
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
        // the card sits beside the tower (right, or left near the edge), never on top of it or the chip
        const right = pt.x < w - 330;
        const x = right ? Math.min(w - 276, pt.x + 46) : Math.max(276, pt.x - 46);
        const y = Math.min(h - 320, Math.max(84, pt.y - 250));
        card.dataset.mode = right ? "right" : "left";
        card.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      };
      m.on("render", placeCard);

      // idle drift: a very slow turn of the city
      const tick = () => {
        raf = requestAnimationFrame(tick);
        if (!idleRef.current || reduced || !visible.on || !readyRef.current || m.isMoving()) return;
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
      for (const src of ["runwal-towers", "runwal-crowns", "runwal-points", "runwal-pillars"]) m.setFeatureState({ source: src, id: slug }, { k: v });
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---- filters -> towers + chips ---- */
  useEffect(() => {
    matchRef.current = new Set(match);
    const m = mapRef.current;
    for (const [slug, chip] of chipRefs.current) chip.dataset.off = match.includes(slug) ? "0" : "1";
    if (!m || !ready) return;
    ALL_PROJECTS.forEach((p, i) => setTimeout(() => animateK(m, p.slug, match.includes(p.slug) ? 1 : 0), reduced ? 0 : i * 40));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match, ready]);

  /* ---- region -> camera ---- */
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !ready) return;
    const pad = touch ? { top: 110, bottom: 60, left: 30, right: 30 } : { top: 110, bottom: 70, left: 80, right: 80 };
    if (region === "Pune") {
      const p = ALL_PROJECTS.find((x) => x.region === "Pune");
      if (p) m.flyTo({ center: [p.lon, p.lat], zoom: 14.6, pitch: 58, bearing: -24, duration: reduced ? 0 : 2600, essential: true });
      return;
    }
    if (region === "All") {
      const v = touch ? HOME_MOBILE : HOME;
      m.flyTo({ center: v.center, zoom: v.zoom, pitch: touch ? 45 : 56, bearing: -18, duration: reduced ? 0 : 2000, essential: true });
      return;
    }
    const list = ALL_PROJECTS.filter((p) => p.region === region);
    if (!list.length) return;
    const one = list.length === 1;
    if (one) m.flyTo({ center: [list[0].lon, list[0].lat], zoom: 14.8, pitch: 58, duration: reduced ? 0 : 2000, essential: true });
    else m.fitBounds(boundsFor(list), { padding: pad, pitch: touch ? 45 : 56, bearing: -24, duration: reduced ? 0 : 2000, maxZoom: 14.4 });
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
      chipRefs.current.get(p.slug)?.setAttribute("data-hot", hot ? "1" : "0");
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
      m.flyTo({ center: [p.lon, p.lat], zoom: 15.6, pitch: 60, bearing: m.getBearing() - 12, duration: reduced ? 0 : 2200, essential: true, offset: touch ? [0, -90] : [-120, 40] });
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
      m.flyTo({ center: v.center, zoom: v.zoom, pitch: touch ? 45 : 56, bearing: -18, duration: 1600 });
    } else m.fitBounds(boundsFor(ALL_PROJECTS.filter((p) => p.region === region)), { padding: { top: 110, bottom: 70, left: 80, right: 80 }, pitch: touch ? 45 : 56, bearing: -18, duration: 1600, maxZoom: 14.4 });
  };

  const cardStats = useMemo(() => {
    if (!active) return null;
    return active.kind === "Commercial"
      ? { left: active.facts[0] ? `${active.facts[0].value} ${active.facts[0].label.toLowerCase()}` : "Offices", right: "Offices", cta: "View offices" }
      : { left: bhkLabel(active), right: active.priceFrom ? `From ${active.priceFrom}` : "Price on request", cta: "View residence" };
  }, [active]);

  return (
    <div className="relative h-full w-full">
      <div ref={box} className="!absolute inset-0 h-full w-full bg-stone" aria-label="Map of Runwal residences across Mumbai, Thane and Pune" role="region" />

      {!ready && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="kicker animate-pulse text-mute">Loading the city&hellip;</span>
        </div>
      )}

      {/* card */}
      <div ref={cardRef} data-mode="right" className="group/card pointer-events-none absolute left-0 top-0 z-20 will-change-transform">
        <div
          onPointerEnter={() => activeSlug && hover(activeSlug)}
          onPointerLeave={() => hover(null)}
          className={`w-64 border border-graphite/10 bg-paper/95 shadow-[0_30px_60px_-25px_rgba(22,24,27,0.45)] backdrop-blur-xl transition-[opacity,translate] duration-500 ease-[var(--ease-out-expo)] group-data-[mode=dock]/card:w-[min(22rem,calc(100vw-2.5rem))] group-data-[mode=dock]/card:-translate-x-1/2 group-data-[mode=dock]/card:-translate-y-full group-data-[mode=left]/card:-translate-x-full ${
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
      <div className="absolute bottom-8 right-6 z-10 flex flex-col items-end gap-3 md:bottom-10 md:right-10">
        {region !== "Pune" && (
          <button
            type="button"
            onClick={() => onRegion("Pune")}
            className="kicker flex items-center gap-2 border border-graphite/15 bg-paper/90 px-3 py-2 text-graphite backdrop-blur transition-colors hover:border-graphite"
          >
            Also in Pune &middot; 150 km <span aria-hidden>&rarr;</span>
          </button>
        )}
        <div className="flex border border-graphite/15 bg-paper/90 backdrop-blur">
          <button type="button" onClick={() => zoom(1)} aria-label="Zoom in" className="flex size-10 items-center justify-center text-lg transition-colors hover:bg-graphite hover:text-stone">
            +
          </button>
          <button type="button" onClick={() => zoom(-1)} aria-label="Zoom out" className="flex size-10 items-center justify-center border-x border-graphite/15 text-lg transition-colors hover:bg-graphite hover:text-stone">
            &minus;
          </button>
          <button type="button" onClick={reset} aria-label="Reset view" className="kicker flex h-10 items-center px-3 text-[0.62rem] transition-colors hover:bg-graphite hover:text-stone">
            Reset
          </button>
        </div>
      </div>

      <p className="kicker pointer-events-none absolute bottom-3 left-6 z-10 text-[0.55rem] text-graphite/45 md:left-10">
        &copy; OpenFreeMap &copy; OpenStreetMap contributors
      </p>

      {/* chip styles (markers are created outside React) */}
      <style>{`
        .rw-chip{display:flex;align-items:center;gap:6px;padding:5px 9px 5px 7px;background:rgba(247,245,241,.92);border:1px solid rgba(22,24,27,.12);font:500 11px/1 var(--font-geist),system-ui,sans-serif;color:#16181b;letter-spacing:.01em;white-space:nowrap;cursor:pointer;backdrop-filter:blur(8px);transition:opacity .5s,visibility .5s,background-color .3s,color .3s}
        .rw-chip-dot{width:6px;height:6px;display:inline-block}
        .rw-chip[data-off="1"]{opacity:0!important;visibility:hidden;pointer-events:none}
        .rw-chip[data-hot="1"]{z-index:5}
        .rw-chip[data-hot="1"]{background:#16181b;color:#eeebe5}
        .maplibregl-cooperative-gesture-screen{font:400 12px/1.4 var(--font-geist-mono),monospace;letter-spacing:.08em;text-transform:uppercase;background:rgba(22,24,27,.55)}
      `}</style>
    </div>
  );
}
