"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { TilesRenderer } from "3d-tiles-renderer/three";
import { GLTFExtensionsPlugin, GoogleCloudAuthPlugin, ReorientationPlugin, TileCompressionPlugin } from "3d-tiles-renderer/plugins";
import { smoothstep } from "@/lib/motion";
import { cityUniforms } from "./city-materials";
import { M_PER_UNIT, ORIGIN, PHOTOREAL_KEY, SEA_LEVEL_ELLIPSOID, photoreal, rememberPhotorealFailure } from "./photoreal-state";
import { skyline } from "./skyline-state";

/*
  Google Photorealistic 3D Tiles for the hero. The photographed city is unlit (daylight is baked
  into the textures), so time of day is a grade applied in every tile's shader: a tint and
  saturation by day and dusk, a deep navy multiply at night with procedural lit windows on
  vertical faces and the real roads (from the baked OSM ground texture) glowing amber.

  Billing: each TilesRenderer opens a billable root session. There is exactly one per page visit,
  kept on globalThis so client-side navigation (Home -> Residences -> Home) and HMR reuse it; on
  unmount it is only detached from the scene and stops updating, never disposed.
*/

const D2R = Math.PI / 180;
const GB = 1024 * 1024 * 1024;

/* ---------------------------------------------------------------- grading shader */

export const photoUniforms = {
  uTint: { value: new THREE.Color(1, 1, 1) },
  uSat: { value: 1 },
  uNight: { value: 0 },
  uFade: { value: 0 },
  uFadeCol: { value: new THREE.Color("#efece6") },
  uWarm: cityUniforms.uWarm,
  uGround: cityUniforms.uGround,
  uGB: cityUniforms.uGB,
  uGroundOn: cityUniforms.uGroundOn,
};

const GRADE_VERT_HEAD = /* glsl */ `
varying vec3 vWP;`;
const GRADE_VERT_BODY = /* glsl */ `
vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;`;

const GRADE_FRAG_HEAD = /* glsl */ `
uniform vec3 uTint; uniform float uSat; uniform float uNight; uniform float uFade; uniform vec3 uFadeCol;
uniform vec3 uWarm; uniform sampler2D uGround; uniform vec4 uGB; uniform float uGroundOn;
varying vec3 vWP;
float ph21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }`;

// window cells: ~4.2 m wide, one 3.4 m floor high (model units are 526 / 540 / 553 m)
const GRADE_FRAG_BODY = /* glsl */ `
{
  vec3 base = diffuseColor.rgb;
  float lum = dot(base, vec3(0.2126, 0.7152, 0.0722));
  vec3 graded = mix(vec3(lum), base, uSat) * uTint;

  // facet normal from screen-space derivatives (tiles carry no reliable normals)
  vec3 n = normalize(cross(dFdx(vWP), dFdy(vWP)));
  float vert = 1.0 - smoothstep(0.3, 0.55, abs(n.y));
  float flat_ = smoothstep(0.75, 0.9, abs(n.y));
  float above = smoothstep(0.012, 0.03, vWP.y);
  float leafy = step(base.r * 1.06, base.g) * step(base.b, base.g);

  float u = abs(n.x) > abs(n.z) ? vWP.z * 132.0 : vWP.x * 125.0;
  vec2 cell = vec2(u, vWP.y * 159.0);
  vec2 fc = fract(cell);
  float h = ph21(floor(cell));
  float pane = step(0.18, fc.x) * step(fc.x, 0.82) * step(0.24, fc.y) * step(fc.y, 0.8);
  float lit = step(0.58, h) * pane;
  // far away the panes are smaller than a pixel: use their average instead of shimmering
  float px = max(fwidth(cell.x), fwidth(cell.y));
  lit = mix(lit * (0.55 + h), 0.16, smoothstep(0.35, 0.9, px));
  lit *= vert * above * (1.0 - leafy);

  vec2 guv = vec2((vWP.x - uGB.x) * uGB.z, (vWP.z - uGB.y) * uGB.w);
  float road = texture2D(uGround, clamp(guv, 0.0005, 0.9995)).g * uGroundOn * flat_;

  graded += uWarm * (lit * 1.5 + pow(road, 1.6) * 0.55) * uNight;
  diffuseColor.rgb = mix(uFadeCol, graded, uFade);
}`;

function makeTileMaterial(src: THREE.Material) {
  const anySrc = src as THREE.Material & { map?: THREE.Texture | null; color?: THREE.Color };
  const m = new THREE.MeshBasicMaterial({ map: anySrc.map ?? null, color: anySrc.color ? anySrc.color.clone() : 0xffffff, side: src.side });
  m.toneMapped = false;
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, photoUniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>${GRADE_VERT_HEAD}`)
      .replace("#include <project_vertex>", `#include <project_vertex>${GRADE_VERT_BODY}`);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>${GRADE_FRAG_HEAD}`)
      .replace("#include <map_fragment>", `#include <map_fragment>${GRADE_FRAG_BODY}`);
  };
  m.customProgramCacheKey = () => "runwal-photoreal-grade-v1";
  return m;
}

/* ---------------------------------------------------------------- one renderer per visit */

type TileEngineData = { engineData: { materials: THREE.Material[] | null } };
type Shared = { tiles: TilesRenderer; root: THREE.Group; failures: number };

const G = globalThis as typeof globalThis & { __runwalPhotoreal?: Shared };

function fail(remember: boolean) {
  if (remember) rememberPhotorealFailure();
  photoreal.set({ status: "failed", attribution: "" });
}

function getShared(): Shared {
  if (G.__runwalPhotoreal) return G.__runwalPhotoreal;

  const tiles = new TilesRenderer();
  tiles.registerPlugin(new GoogleCloudAuthPlugin({ apiToken: PHOTOREAL_KEY, autoRefreshToken: true }));
  const draco = new DRACOLoader().setDecoderPath("/vendor/draco/");
  tiles.registerPlugin(new GLTFExtensionsPlugin({ dracoLoader: draco }));
  tiles.registerPlugin(new TileCompressionPlugin());
  tiles.registerPlugin(new ReorientationPlugin({ lat: ORIGIN.lat * D2R, lon: ORIGIN.lon * D2R, height: SEA_LEVEL_ELLIPSOID }));
  // after the auth plugin's recommended settings, so these win (desktop and tablet only)
  tiles.errorTarget = window.innerWidth < 1100 ? 20 : 14;
  tiles.lruCache.maxBytesSize = 0.45 * GB;
  tiles.lruCache.minBytesSize = 0.32 * GB;

  tiles.addEventListener("load-model", (e: { scene: THREE.Object3D; tile: TileEngineData }) => {
    const list = e.tile.engineData.materials;
    e.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const graded = mats.map((mt) => {
        const g = makeTileMaterial(mt);
        list?.push(g); // disposed with the tile by the renderer
        return g;
      });
      mesh.material = Array.isArray(mesh.material) ? graded : graded[0];
    });
  });
  tiles.addEventListener("load-error", (e: { tile: unknown }) => {
    const sh = G.__runwalPhotoreal;
    // the root (key / 403 / 429 / quota) failing: no photoreal for the rest of this visit
    if (!e.tile) fail(true);
    else if (sh && ++sh.failures > 40 && tiles.visibleTiles.size === 0) fail(false);
  });
  tiles.addEventListener("tile-visibility-change", () => {
    if (photoreal.get().status !== "ready" && tiles.visibleTiles.size > 0) {
      photoreal.readyAt = performance.now();
      photoreal.set({ status: "ready" });
    }
  });

  // tiles frame after re-orientation: +X west, +Y up, +Z north. Ours: +X east, north is -Z.
  const root = new THREE.Group();
  root.name = "photoreal-root";
  root.rotation.y = Math.PI;
  root.scale.set(1 / M_PER_UNIT.x, 1 / M_PER_UNIT.y, 1 / M_PER_UNIT.z);
  root.add(tiles.group);
  G.__runwalPhotoreal = { tiles, root, failures: 0 };
  return G.__runwalPhotoreal;
}

function attach(camera: THREE.Camera, gl: THREE.WebGLRenderer) {
  const { tiles } = getShared();
  tiles.setCamera(camera);
  tiles.setResolutionFromRenderer(camera, gl);
}

function detach(camera: THREE.Camera) {
  G.__runwalPhotoreal?.tiles.deleteCamera(camera);
}

function updateTiles(camera: THREE.Camera, gl: THREE.WebGLRenderer) {
  const { tiles } = getShared();
  tiles.setResolutionFromRenderer(camera, gl);
  camera.updateMatrixWorld();
  tiles.update();
}

function readAttribution() {
  const out: Array<{ type: string; value: string }> = [];
  getShared().tiles.getAttributions(out);
  return out
    .filter((a) => a.type === "string")
    .map((a) => a.value)
    .join("; ");
}

/* ---------------------------------------------------------------- component */

const DAY_TINT = new THREE.Color(0.99, 0.99, 0.98);
const DUSK_TINT = new THREE.Color(1.06, 0.86, 0.72);
const NIGHT_TINT = new THREE.Color(0.075, 0.09, 0.15);

function grade(p: number, fadeColor: THREE.Color) {
  const t1 = smoothstep(0.2, 0.5, p);
  const t2 = smoothstep(0.52, 0.82, p);
  photoUniforms.uTint.value.copy(DAY_TINT).lerp(DUSK_TINT, t1).lerp(NIGHT_TINT, t2);
  photoUniforms.uSat.value = THREE.MathUtils.lerp(THREE.MathUtils.lerp(0.9, 1.12, t1), 0.7, t2);
  photoUniforms.uNight.value = smoothstep(0.4, 0.8, p);
  photoUniforms.uFadeCol.value.copy(fadeColor);
  const since = photoreal.readyAt < 0 ? 0 : Math.min(1, (performance.now() - photoreal.readyAt) / 1800);
  photoUniforms.uFade.value = Math.min(skyline.rise, since);
}

export default function PhotorealCity({ fadeColor }: { fadeColor: THREE.Color }) {
  const { camera, gl } = useThree();
  const [root] = useState(() => getShared().root);
  const clock = useRef({ p: skyline.p, t: 0 });

  useEffect(() => {
    if (photoreal.get().status !== "ready") photoreal.set({ status: "loading" });
    attach(camera, gl);
    // no tiles at all after a while (blocked network): fall back for this page view
    const watchdog = window.setTimeout(() => {
      if ((G.__runwalPhotoreal?.tiles.visibleTiles.size ?? 0) === 0) fail(false);
    }, 15000);
    return () => {
      window.clearTimeout(watchdog);
      detach(camera);
    };
  }, [camera, gl]);

  useFrame((state, dt) => {
    const c = clock.current;
    // grade follows the same day -> dusk -> night curve as the clay city
    c.p += (skyline.p - c.p) * (1 - Math.exp(-dt * 3.2));
    grade(c.p, fadeColor);
    updateTiles(state.camera, state.gl);
    // attribution (required by Google): refresh about once a second
    c.t += dt;
    if (c.t > 1) {
      c.t = 0;
      photoreal.set({ attribution: readAttribution() });
    }
  });

  return <primitive object={root} dispose={null} />;
}
