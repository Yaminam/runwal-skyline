"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { getVersion, Map as MaplibreMap, Marker, setWorkerUrl, type Map as MLMap, type StyleSpecification } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { CONTACT_PAGE } from "@/lib/coverage";
import { ALL_PROJECTS } from "@/lib/projects";
import { TLink } from "../../site/Transition";

/*
  Every Runwal address and the Sion corporate office on a real map (OpenFreeMap vector tiles of
  OpenStreetMap data), restyled to the Skyline palette with buildings extruded in white clay.
  Picking a site in the list flies the camera there; the markers do the same.
*/

const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
setWorkerUrl(`/vendor/maplibre-gl-worker-${getVersion()}.mjs`);

type Site = { id: string; name: string; area: string; city: string; slug: string | null; map: string; lat: number; lon: number; hq?: boolean; approx?: boolean };

// The corporate office sits by the Sion Chunabhatti signal; Eirene has no project page, so it is
// placed in Balkum next to Zenith and marked as approximate.
const HQ: Site = { id: "hq", name: "Corporate office", area: "Sion (East), Mumbai", city: "Mumbai", slug: null, map: CONTACT_PAGE.officeMap, lat: 19.0466, lon: 72.87, hq: true, approx: true };

const SITES: Site[] = [
  HQ,
  ...CONTACT_PAGE.sites.map((s) => {
    const p = s.slug ? ALL_PROJECTS.find((x) => x.slug === s.slug) : undefined;
    const zen = ALL_PROJECTS.find((x) => x.slug === "runwal-zenith");
    const lat = p?.lat ?? (zen ? zen.lat + 0.004 : 19.218);
    const lon = p?.lon ?? (zen ? zen.lon - 0.004 : 72.981);
    const city = s.area.includes("Pune") ? "Pune" : s.area.includes("Thane") ? "Thane" : "Mumbai";
    return { id: s.name, name: s.name, area: s.area, city, slug: s.slug, map: s.map, lat, lon, approx: !p };
  }),
];
const CITIES = ["Mumbai", "Thane", "Pune"] as const;

const C = { land: "#ebe7e0", water: "#b7c6d3", park: "#dfe3d3", road: "#ffffff", roadMinor: "#f6f4f0", rail: "#d6d1c7", clay: "#f4f2ed", label: "#77746d" };

function restyle(style: StyleSpecification): StyleSpecification {
  const layers = style.layers
    .filter((l) => {
      if (l.type === "symbol") return ["label_city", "label_town", "label_village", "water_name_point_label"].includes(l.id);
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
        if (l.id.includes("casing")) paint["line-color"] = "#e2ddd4";
        else paint["line-color"] = /minor|path/.test(l.id) ? C.roadMinor : C.road;
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
      }
      return { ...l, paint, layout } as typeof l;
    });
  return { ...style, layers };
}

const fitAll = (m: MLMap, mobile: boolean, duration: number) => {
  const mumbai = SITES.filter((s) => s.city !== "Pune");
  const lats = mumbai.map((s) => s.lat);
  const lons = mumbai.map((s) => s.lon);
  m.fitBounds(
    [
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    ],
    { padding: mobile ? 50 : { top: 90, bottom: 90, left: 90, right: 90 }, pitch: 45, bearing: -14, duration },
  );
};

export default function ContactMap() {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markers = useRef(new Map<string, HTMLElement>());
  const [active, setActive] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [mobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches);
  const [reduced] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const flyRef = useRef<(id: string) => void>(() => {});

  const fly = (id: string) => {
    const m = mapRef.current;
    const s = SITES.find((x) => x.id === id);
    setActive(id);
    markers.current.forEach((el, k) => (el.dataset.on = k === id ? "1" : "0"));
    if (!m || !s) return;
    m.flyTo({ center: [s.lon, s.lat], zoom: 15.4, pitch: 58, bearing: m.getBearing() - 10, duration: reduced ? 0 : 2400, essential: true });
  };
  useEffect(() => {
    flyRef.current = fly;
  });

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let cancelled = false;
    let m: MLMap | null = null;
    const pins = markers.current;
    const io = new IntersectionObserver(
      async ([e]) => {
        if (!e.isIntersecting || m) return;
        io.disconnect();
        let style: StyleSpecification;
        try {
          style = restyle((await (await fetch(STYLE_URL)).json()) as StyleSpecification);
        } catch {
          return;
        }
        if (cancelled) return;
        const touch = window.matchMedia("(pointer: coarse)").matches;
        m = new MaplibreMap({
          container: el,
          style,
          center: [72.9, 19.12],
          zoom: 10.4,
          pitch: 45,
          bearing: -14,
          attributionControl: false,
          scrollZoom: false,
          cooperativeGestures: touch,
          canvasContextAttributes: { antialias: true },
        });
        mapRef.current = m;
        const map = m;
        map.on("load", () => {
          if (cancelled) return;
          try {
            map.setSky({ "sky-color": "#c3cfdc", "horizon-color": "#eeebe5", "fog-color": "#eeebe5", "sky-horizon-blend": 0.7, "horizon-fog-blend": 0.85, "fog-ground-blend": 0.75 });
          } catch {
            /* plain background is fine */
          }
          const firstLabel = map.getStyle().layers.find((l) => l.type === "symbol")?.id;
          map.addLayer(
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
                "fill-extrusion-opacity": 0.92,
                "fill-extrusion-vertical-gradient": true,
              },
            },
            firstLabel,
          );
          SITES.forEach((s) => {
            const node = document.createElement("button");
            node.type = "button";
            node.className = "rw-site";
            node.dataset.on = "0";
            node.setAttribute("aria-label", `${s.name}, ${s.area}`);
            node.innerHTML = `<span class="rw-site-dot${s.hq ? " rw-hq" : ""}">${s.hq ? "HQ" : ""}</span><span class="rw-site-name">${s.name.replace("Runwal ", "")}</span>`;
            node.addEventListener("click", () => flyRef.current(s.id));
            markers.current.set(s.id, node);
            new Marker({ element: node, anchor: "bottom" }).setLngLat([s.lon, s.lat]).addTo(map);
          });
          fitAll(map, mobile, 0);
          setReady(true);
        });
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      m?.remove();
      mapRef.current = null;
      pins.clear();
    };
  }, [mobile]);

  const zoom = (d: number) => mapRef.current?.easeTo({ zoom: (mapRef.current?.getZoom() ?? 11) + d, duration: 400 });
  const reset = () => {
    setActive(null);
    markers.current.forEach((el) => (el.dataset.on = "0"));
    if (mapRef.current) fitAll(mapRef.current, mobile, reduced ? 0 : 1800);
  };

  return (
    <div className="grid gap-8 md:grid-cols-12 md:gap-10">
      <style>{`
        .rw-site{display:flex;flex-direction:column;align-items:center;gap:4px;background:none;border:0;cursor:pointer;padding:0}
        .rw-site-dot{display:flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:50%;background:#f2a65a;border:2px solid #fff;box-shadow:0 0 0 0 rgba(242,166,90,.5),0 6px 14px -4px rgba(0,0,0,.4);transition:transform .4s cubic-bezier(.16,1,.3,1),box-shadow .4s;font:600 8px/1 ui-monospace,monospace;color:#16181b;letter-spacing:.04em}
        .rw-site-dot.rw-hq{width:26px;height:26px;background:#16181b;color:#f2a65a;border-color:#f2a65a}
        .rw-site-name{order:-1;font:500 10px/1 ui-sans-serif,system-ui;letter-spacing:.08em;text-transform:uppercase;color:#16181b;background:rgba(247,245,241,.92);padding:4px 7px;border:1px solid rgba(22,24,27,.12);white-space:nowrap;opacity:.85;transition:opacity .3s,background .3s,color .3s}
        .rw-site:hover .rw-site-name,.rw-site[data-on="1"] .rw-site-name{opacity:1;background:#16181b;color:#eeebe5}
        .rw-site[data-on="1"] .rw-site-dot{transform:scale(1.4);box-shadow:0 0 0 10px rgba(242,166,90,.25),0 6px 14px -4px rgba(0,0,0,.4)}
      `}</style>

      <div className="relative h-[62svh] overflow-hidden border border-stone/15 bg-[#ebe7e0] md:col-span-8 md:h-[78svh]">
        <div ref={box} className="h-full w-full" />
        {!ready ? <p className="kicker absolute inset-0 flex items-center justify-center text-mute">Loading the map&hellip;</p> : null}
        <div className="absolute bottom-4 right-4 flex border border-graphite/15 bg-paper/95 text-graphite shadow-sm backdrop-blur">
          <button type="button" onClick={() => zoom(1)} className="size-10 border-r border-graphite/15 text-lg hover:bg-white" aria-label="Zoom in">
            +
          </button>
          <button type="button" onClick={() => zoom(-1)} className="size-10 border-r border-graphite/15 text-lg hover:bg-white" aria-label="Zoom out">
            &minus;
          </button>
          <button type="button" onClick={reset} className="kicker px-4 hover:bg-white">
            All sites
          </button>
        </div>
        <p className="kicker pointer-events-none absolute left-4 top-4 text-[0.6rem] text-graphite/50 md:bottom-4 md:top-auto">&copy; OpenFreeMap &copy; OpenStreetMap contributors</p>
      </div>

      <div className="md:col-span-4">
        {CITIES.map((c) => {
          const list = SITES.filter((s) => s.city === c);
          return (
            <div key={c} className="mb-8">
              <p className="kicker text-stone/50">
                {c} &middot; {String(list.length).padStart(2, "0")}
              </p>
              <ul className="mt-3">
                {list.map((s) => {
                  const on = active === s.id;
                  return (
                    <li key={s.id} className={`border-t border-stone/15 transition-colors ${on ? "bg-stone/[0.06]" : ""}`}>
                      <div className="flex items-baseline justify-between gap-3 py-3.5">
                        <button type="button" onClick={() => fly(s.id)} className="group text-left">
                          <span className={`title block text-lg transition-colors ${on ? "text-amber" : "group-hover:text-amber"}`}>
                            {s.hq ? "Corporate office, HQ" : s.name}
                          </span>
                          <span className="kicker mt-1 block text-stone/50">
                            {s.area}
                            {s.approx && !s.hq ? " · approx. pin" : ""}
                          </span>
                        </button>
                        <span className="flex shrink-0 gap-3">
                          {s.slug ? (
                            <TLink href={`/residences/${s.slug}`} className="kicker text-stone/60 hover:text-stone">
                              View
                            </TLink>
                          ) : null}
                          <a href={s.map} target="_blank" rel="noreferrer" className="kicker text-amber">
                            Directions &#8599;
                          </a>
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
