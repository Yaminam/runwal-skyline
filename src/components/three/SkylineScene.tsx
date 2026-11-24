"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { clamp, pointer, smoothstep } from "@/lib/motion";
import {
  buildTallGeometry,
  lowRiseMatrices,
  metresToUnits,
  parseCity,
  type LowChunk,
} from "./city-data";
import {
  BEAM_FRAG,
  BEAM_VERT,
  REAL_SKY_FRAG,
  SKY_VERT,
  cityUniforms,
  makeBuildingMaterial,
  makeGroundMaterial,
  makeRiseDepthMaterial,
} from "./city-materials";
import {
  canUsePhotoreal,
  photoreal,
  realUnits,
  usePhotoreal,
} from "./photoreal-state";
import {
  LANDMARKS,
  geo,
  labels,
  skyline,
  type Landmark,
} from "./skyline-state";

// Google photoreal tiles: only downloaded when a key is configured and the device can take it
const PhotorealCity = lazy(() => import("./PhotorealCity"));

/* ---------------------------------------------------------------- time of day */

type Phase = {
  top: string;
  horizon: string;
  glow: string;
  sea: string;
  sun: string;
  sunI: number;
  hemiSky: string;
  hemiGround: string;
  hemiI: number;
  sunDir: [number, number, number];
};

const DAY: Phase = {
  top: "#a9bbd4",
  horizon: "#e6e6e2",
  glow: "#fff4e4",
  sea: "#b7c6d3",
  sun: "#fff8ee",
  sunI: 2.6,
  hemiSky: "#f4f6fa",
  hemiGround: "#cfc9bd",
  hemiI: 1.3,
  sunDir: [0.45, 0.8, 0.55],
};
const DUSK: Phase = {
  top: "#3e4f92",
  horizon: "#c9b6c6",
  glow: "#ffb877",
  sea: "#7f8aac",
  sun: "#ffc08a",
  sunI: 2.3,
  hemiSky: "#a9b2e0",
  hemiGround: "#76716f",
  hemiI: 1.15,
  sunDir: [-0.9, 0.32, -0.2],
};
const NIGHT: Phase = {
  top: "#05070d",
  horizon: "#1c2438",
  glow: "#5d6d9e",
  sea: "#0e1a2e",
  sun: "#9fb0e0",
  sunI: 0.35,
  hemiSky: "#34405e",
  hemiGround: "#0c0e14",
  hemiI: 0.42,
  sunDir: [0.3, 0.7, -0.5],
};

const c = (s: string) => new THREE.Color(s);
const PH = [DAY, DUSK, NIGHT].map((p) => ({
  top: c(p.top),
  horizon: c(p.horizon),
  glow: c(p.glow),
  sea: c(p.sea),
  sun: c(p.sun),
  hemiSky: c(p.hemiSky),
  hemiGround: c(p.hemiGround),
  sunDir: new THREE.Vector3(...p.sunDir).normalize(),
  sunI: p.sunI,
  hemiI: p.hemiI,
}));

/* ---------------------------------------------------------------- camera path */

// [progress, camera position, look-at] over the real map (model units, see city-data.ts)
const KEYS: Array<
  [number, [number, number, number], [number, number, number]]
> = [
  [0.0, [-24, 13, 52], [-8, 0, 12]],
  [0.16, [-23.5, 6.5, 31], [-13.5, 0.8, 21]],
  [0.3, [-21, 7.5, 18.5], [-6, 0.6, 9]],
  [0.44, [3, 7, 2], [-9, 0.6, -14]],
  [0.57, [1, 6.5, -9], [-5, 0.6, -23]],
  [0.7, [7, 6, -17], [21, 0.8, -31]],
  [0.82, [13, 4.5, -23], [24, 0.8, -31]],
  [1.0, [-18, 30, 24], [4, 0, -10]],
];
// Photoreal flight: real (un-exaggerated) heights, so the camera flies low, 1 to 2 km up, and
// passes Malabar Hill and Marine Drive, Worli and the Sea Link, Wadala, Andheri and Malad, Mulund,
// then Thane, before climbing to a night overview of the whole city.
const KEYS_PHOTO: Array<
  [number, [number, number, number], [number, number, number]]
> = [
  [0.0, [-26, 7, 40], [-11, 0, 20]],
  [0.16, [-20, 2.2, 28.5], [-12.5, 0.15, 22.5]],
  [0.27, [-17, 2.0, 15.5], [-9.5, 0.15, 10]],
  [0.36, [4, 2.2, 15], [-1, 0.1, 9.5]],
  [0.5, [-2.5, 2.6, -5], [-7, 0.15, -17]],
  [0.62, [8, 2.6, -13.5], [15.5, 0.15, -20.5]],
  [0.74, [14, 2.4, -22], [21.5, 0.2, -30]],
  [0.84, [17.5, 2.1, -24.5], [25, 0.2, -31]],
  [0.875, [12, 9, -6], [12, 0, -22]],
  [0.94, [-17, 20, 44], [6, 0, -12]],
  [1.0, [-9, 21, 47], [7, 0, -12]],
];

const curve = (keys: typeof KEYS, i: 1 | 2) =>
  new THREE.CatmullRomCurve3(
    keys.map((k) => new THREE.Vector3(...k[i])),
    false,
    "centripetal",
  );
// near-real proportions: the satellite city flies low too, a little higher than photoreal
const KEYS_SAT: typeof KEYS = KEYS_PHOTO.map(([t, p, l]) => [
  t,
  [p[0], t >= 0.875 ? p[1] : p[1] * 1.25 + 0.4, p[2]],
  l,
]);
void KEYS;
const PATHS = {
  clay: { keys: KEYS_SAT, pos: curve(KEYS_SAT, 1), look: curve(KEYS_SAT, 2) },
  photo: {
    keys: KEYS_PHOTO,
    pos: curve(KEYS_PHOTO, 1),
    look: curve(KEYS_PHOTO, 2),
  },
};

/** Photoreal intro: start high above the city and descend once the first tiles are in. */
function descend(v: THREE.Vector3) {
  const since =
    photoreal.readyAt < 0
      ? 0
      : clamp((performance.now() - photoreal.readyAt) / 2600);
  const e = 1 - Math.pow(1 - Math.min(skyline.rise, since), 3);
  v.y += (1 - e) * 26;
  v.z += (1 - e) * 12;
}

function setFogRange(fog: THREE.Fog, photo: boolean, open = 0) {
  // aerial perspective: Mumbai's humid haze, tinted by the sky; "open" clears it for the finale overview
  fog.near = THREE.MathUtils.lerp(photo ? 12 : 9, 30, open);
  fog.far = THREE.MathUtils.lerp(photo ? 95 : 85, 150, open);
}

/** The low photoreal flight needs a near plane of metres; the clay city keeps 0.2. */
function fitNear(camera: THREE.Camera, photo: boolean) {
  if (!(camera instanceof THREE.PerspectiveCamera)) return;
  const near = clamp(camera.position.y * (photo ? 0.015 : 0.02), 0.003, 0.2);
  if (Math.abs(camera.near - near) > near * 0.1) {
    camera.near = near;
    camera.updateProjectionMatrix();
  }
}

function pathParam(p: number, keys: typeof KEYS) {
  const n = keys.length - 1;
  for (let i = 0; i < n; i++) {
    const a = keys[i][0];
    const b = keys[i + 1][0];
    if (p <= b) {
      const t = clamp((p - a) / (b - a));
      const e = t * t * (3 - 2 * t);
      return (i + e) / n;
    }
  }
  return 1;
}

/* ---------------------------------------------------------------- real city */

/** When the OSM data and the ground texture arrived (performance.now()), so the intro waits for them. */
const arrived = { city: -1, ground: -1, sat: -1 };

function LowChunkMesh({
  chunk,
  geometry,
  material,
  depth,
}: {
  chunk: LowChunk;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  depth: THREE.Material;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    mesh.instanceMatrix.array.set(chunk.matrices);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.geometry = geometry.clone();
    mesh.geometry.setAttribute(
      "aSeed",
      new THREE.InstancedBufferAttribute(chunk.seeds, 1),
    );
    mesh.customDepthMaterial = depth;
    // cull the whole chunk when it is off screen
    mesh.boundingSphere = new THREE.Sphere(chunk.centre, chunk.radius);
    const g = mesh.geometry;
    return () => g.dispose();
  }, [chunk, geometry, depth]);
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, chunk.seeds.length]}
      receiveShadow
    />
  );
}

function RealCity({ mobile }: { mobile: boolean }) {
  const [data, setData] = useState<{
    tall: THREE.BufferGeometry[];
    low: LowChunk[];
  } | null>(null);
  const tallMat = useMemo(() => makeBuildingMaterial({ mode: "merged" }), []);
  const lowMat = useMemo(() => makeBuildingMaterial({ mode: "instanced" }), []);
  const depth = useMemo(() => makeRiseDepthMaterial(), []);
  const box = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    g.translate(0, 0.5, 0);
    return g;
  }, []);

  useEffect(() => {
    let alive = true;
    fetch(mobile ? "/data/mumbai-city2-lite.bin" : "/data/mumbai-city2.bin")
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        if (!alive) return;
        const bin = parseCity(buf);
        const tall = buildTallGeometry(bin);
        const low = lowRiseMatrices(bin);
        arrived.city = performance.now();
        setData({ tall, low });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [mobile]);

  useEffect(
    () => () => {
      data?.tall.forEach((g) => g.dispose());
    },
    [data],
  );

  // from the high finale overview the low-rise boxes are sub-pixel: the satellite carries them
  const lowGroup = useRef<THREE.Group>(null);
  useFrame(({ camera }) => {
    if (lowGroup.current) lowGroup.current.visible = camera.position.y < 13;
  });

  if (!data) return null;
  return (
    <>
      <group ref={lowGroup}>
        {data.low.map((ch, i) => (
          <LowChunkMesh
            key={i}
            chunk={ch}
            geometry={box}
            material={lowMat}
            depth={depth}
          />
        ))}
      </group>
      {data.tall.map((g, i) => (
        <mesh
          key={i}
          geometry={g}
          material={tallMat}
          customDepthMaterial={depth}
          castShadow
          receiveShadow
        />
      ))}
    </>
  );
}

/* ---------------------------------------------------------------- Runwal towers */

/** Model height of a Runwal tower: real storeys, nudged up 35% so the hero towers read first. */
const towerH = (l: Landmark) =>
  Math.max(1.3, metresToUnits(l.floors * 3.4) * 1.35);
const TOWER_W = 0.1;

function towerParts(
  l: Landmark,
): Array<{ p: [number, number, number]; s: [number, number, number] }> {
  const w = TOWER_W;
  const h = towerH(l);
  switch (l.form) {
    case "twin":
      return [
        { p: [-w * 0.42, 0, 0], s: [w * 0.62, h, w * 0.62] },
        { p: [w * 0.42, 0, 0.05], s: [w * 0.62, h * 0.88, w * 0.62] },
        { p: [0, h * 0.5, 0.02], s: [w * 0.3, h * 0.025, w * 0.4] },
        { p: [0, 0, 0], s: [w * 1.9, h * 0.05, w * 1.2] },
      ];
    case "stepped":
      return [
        { p: [0, 0, 0], s: [w, h * 0.62, w] },
        { p: [0, h * 0.62, 0], s: [w * 0.8, h * 0.24, w * 0.8] },
        { p: [0, h * 0.86, 0], s: [w * 0.56, h * 0.14, w * 0.56] },
        { p: [0, 0, 0], s: [w * 1.7, h * 0.045, w * 1.7] },
      ];
    case "cluster":
      return [
        { p: [0, 0, -w * 0.45], s: [w * 0.6, h, w * 0.6] },
        { p: [-w * 0.6, 0, w * 0.4], s: [w * 0.6, h * 0.82, w * 0.6] },
        { p: [w * 0.62, 0, w * 0.35], s: [w * 0.6, h * 0.7, w * 0.6] },
        { p: [0, 0, 0], s: [w * 2.2, h * 0.04, w * 1.9] },
      ];
    default:
      return [
        { p: [0, 0, 0], s: [w * 1.45, h, w * 0.66] },
        { p: [0, h, 0], s: [w * 1.1, h * 0.03, w * 0.5] },
        { p: [0, 0, 0], s: [w * 2, h * 0.045, w * 1.2] },
      ];
  }
}

const unitBoxCentred = new THREE.BoxGeometry(1, 1, 1);

const unitBox = (() => {
  const g = new THREE.BoxGeometry(1, 1, 1);
  g.translate(0, 0.5, 0);
  return g;
})();

function Tower({
  l,
  index,
  photo,
}: {
  l: Landmark;
  index: number;
  photo: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const crown = useRef<THREE.MeshBasicMaterial>(null);
  const beam = useRef<THREE.ShaderMaterial>(null);
  const ring = useRef<THREE.Mesh>(null);
  const anchor = useMemo(() => new THREE.Vector3(), []);
  const [x, z] = geo(l.lat, l.lon);
  const parts = useMemo(() => towerParts(l), [l]);
  const mat = useMemo(
    () =>
      makeBuildingMaterial({
        mode: "single",
        color: "#ffffff",
        seed: index * 0.13 + 0.2,
      }),
    [index],
  );
  const clayTop = Math.max(...parts.map((p) => p.p[1] + p.s[1]));
  // photoreal: the real building is in the tiles; mark it at its real height
  const realTop = realUnits(l.floors * 3.4);
  const top = photo ? realTop : clayTop;
  const volume = useRef<THREE.MeshBasicMaterial>(null);
  const beamUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color("#ffb46a") },
      uAmt: { value: 0 },
    }),
    [],
  );

  useFrame((state) => {
    const p = skyline.p;
    const label = labels[index];
    const night = smoothstep(0.42, 0.8, p);
    // finale: every beam ignites in turn, south to north, with a short flash
    const ig = smoothstep(
      FIN.ignite + index * FIN.step,
      FIN.ignite + index * FIN.step + 0.006,
      p,
    );
    const flash =
      ig *
      (1 -
        smoothstep(
          FIN.ignite + index * FIN.step + 0.006,
          FIN.ignite + index * FIN.step + 0.03,
          p,
        ));
    const fin = smoothstep(0.86, 0.92, p);
    const lit =
      Math.max(
        smoothstep(l.at - 0.04, l.at + 0.01, p) * (1 - fin * (1 - ig)),
        ig,
      ) * smoothstep(0.0, 0.2, skyline.rise);
    const rise = clamp(skyline.rise * 1.6 - 0.25 - index * 0.03);
    mat.emissive.setRGB(1, 0.93, 0.84);
    mat.emissiveIntensity = lit * (0.04 + night * 0.42);
    if (group.current)
      group.current.scale.y = Math.max(0.002, 1 - Math.pow(1 - rise, 3));
    if (volume.current)
      volume.current.opacity = lit * (0.12 + night * 0.38) * rise;
    if (crown.current)
      crown.current.color
        .setRGB(1, 0.71 + 0.2 * (1 - lit), 0.42 + 0.5 * (1 - lit))
        .multiplyScalar(0.25 + lit * (1.2 + night * 2.2));
    if (beam.current)
      beam.current.uniforms.uAmt.value =
        lit *
        (0.12 + night * 0.75) *
        (0.85 + 0.15 * Math.sin(state.clock.elapsedTime * 2 + index)) *
        (1 + flash * 1.6);
    if (ring.current) {
      const t = (state.clock.elapsedTime * 0.5 + index * 0.17) % 1;
      // rings grow with the camera's altitude so every address still reads from the overview
      ring.current.scale.setScalar((1 + t * 3.5) * (1 + fin * 3));
      (ring.current.material as THREE.MeshBasicMaterial).opacity =
        (1 - t) * lit * (0.55 + fin * 0.35);
    }
    if (label) {
      const focus =
        (1 - smoothstep(0.07, 0.15, Math.abs(p - (l.at + 0.03)))) *
        (1 - smoothstep(0.84, 0.865, p));
      const o = lit * focus * rise;
      label.style.opacity = String(o);
      if (o > 0.001) {
        // project the tower top to the screen; the label lives in the DOM overlay
        anchor
          .set(
            x + parts[0].p[0],
            photo ? realTop + 0.05 : top * (group.current?.scale.y ?? 1) + 0.2,
            z + parts[0].p[2],
          )
          .project(state.camera);
        const sx = (anchor.x * 0.5 + 0.5) * state.size.width;
        const sy = (-anchor.y * 0.5 + 0.5) * state.size.height;
        label.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -100%)`;
        label.style.visibility = anchor.z < 1 ? "visible" : "hidden";
      }
    }
  });

  return (
    <group position={[x, 0, z]}>
      <group ref={group} visible={!photo}>
        {parts.map((pt, i) => (
          <mesh
            key={i}
            geometry={unitBox}
            material={mat}
            position={pt.p}
            scale={pt.s}
            castShadow
            receiveShadow
          />
        ))}
        <mesh
          position={[parts[0].p[0], top + 0.01, parts[0].p[2]]}
          scale={[0.1, 0.045, 0.1]}
          geometry={unitBox}
        >
          <meshBasicMaterial ref={crown} toneMapped={false} color="#ffb46a" />
        </mesh>
      </group>
      <mesh position={[parts[0].p[0], top + 15, parts[0].p[2]]}>
        <cylinderGeometry args={[0.01, 0.032, 30, 12, 1, true]} />
        <shaderMaterial
          ref={beam}
          vertexShader={BEAM_VERT}
          fragmentShader={BEAM_FRAG}
          uniforms={beamUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <mesh
        ref={ring}
        rotation-x={-Math.PI / 2}
        position={[0, photo ? 0.06 : 0.02, 0]}
        renderOrder={photo ? 2 : 0}
      >
        <ringGeometry args={[0.16, 0.175, 64]} />
        <meshBasicMaterial
          color="#ffb46a"
          transparent
          opacity={0}
          depthWrite={false}
          depthTest={!photo}
          toneMapped={false}
        />
      </mesh>
      {photo && (
        <mesh
          position={[parts[0].p[0], realTop / 2, parts[0].p[2]]}
          scale={[0.07, realTop, 0.07]}
          geometry={unitBoxCentred}
        >
          <meshBasicMaterial
            ref={volume}
            color="#ffb46a"
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  );
}

/* ---------------------------------------------------------------- finale: the Runwal constellation */

/** Finale timing (hero progress): beams ignite from FIN.ignite, one every FIN.step; lines draw over FIN.draw. */
export const FIN = {
  ignite: 0.885,
  step: 0.0042,
  draw: [0.92, 0.955] as [number, number],
};

const CON_VERT = /* glsl */ `
attribute float aT; attribute float aSide;
varying float vT; varying float vSide;
void main(){
  vT = aT; vSide = aSide;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const CON_FRAG = /* glsl */ `
uniform float uDraw; uniform vec3 uColor; uniform float uTime;
varying float vT; varying float vSide;
void main(){
  if (vT > uDraw) discard;
  float core = 1.0 - smoothstep(0.0, 1.0, abs(vSide));
  float head = smoothstep(uDraw - 0.035, uDraw, vT);
  float shimmer = 0.85 + 0.15 * sin(vT * 120.0 - uTime * 3.0);
  float a = core * (1.25 * shimmer + head * 1.8);
  gl_FragColor = vec4(uColor * a, a);
}
`;

/** One continuous ribbon of light linking every Runwal address, south to north, drawn on scroll. */
function Constellation() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uDraw: { value: 0 },
      uColor: { value: new THREE.Color("#ffb46a") },
      uTime: { value: 0 },
    }),
    [],
  );
  const geom = useMemo(() => {
    const pts = LANDMARKS.map((l) => {
      const [x, z] = geo(l.lat, l.lon);
      return new THREE.Vector2(x, z);
    });
    const lens = [0];
    for (let i = 1; i < pts.length; i++)
      lens.push(lens[i - 1] + pts[i].distanceTo(pts[i - 1]));
    const total = lens[lens.length - 1];
    const W = 0.2;
    const pos: number[] = [];
    const tt: number[] = [];
    const side: number[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const d = b.clone().sub(a).normalize();
      const n = new THREE.Vector2(-d.y, d.x).multiplyScalar(W);
      const quad = [
        [a.x + n.x, a.y + n.y, lens[i], 1],
        [a.x - n.x, a.y - n.y, lens[i], -1],
        [b.x + n.x, b.y + n.y, lens[i + 1], 1],
        [b.x - n.x, b.y - n.y, lens[i + 1], -1],
      ];
      for (const k of [0, 1, 2, 2, 1, 3]) {
        pos.push(quad[k][0], 0.05, quad[k][1]);
        tt.push(quad[k][2] / total);
        side.push(quad[k][3]);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("aT", new THREE.Float32BufferAttribute(tt, 1));
    g.setAttribute("aSide", new THREE.Float32BufferAttribute(side, 1));
    return g;
  }, []);
  useEffect(() => () => geom.dispose(), [geom]);
  useFrame((state) => {
    if (!mat.current) return;
    mat.current.uniforms.uDraw.value =
      smoothstep(FIN.draw[0], FIN.draw[1], skyline.p) * 1.001;
    mat.current.uniforms.uTime.value = state.clock.elapsedTime;
  });
  return (
    <mesh geometry={geom} renderOrder={3} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        vertexShader={CON_VERT}
        fragmentShader={CON_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ---------------------------------------------------------------- world */

function World({ mobile, active }: { mobile: boolean; active: boolean }) {
  const { camera, scene } = useThree();
  const wanted = useMemo(() => canUsePhotoreal(mobile), [mobile]);
  const { status } = usePhotoreal();
  // photoreal opens a billable Google session: only once the hero has actually been on screen
  const [seen, setSeen] = useState(active);
  if (active && !seen) setSeen(true);
  const photo = wanted && seen && status !== "failed";
  const fadeColor = useMemo(() => new THREE.Color("#efece6"), []);
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sky = useRef<THREE.ShaderMaterial>(null);
  const ground = useMemo(() => makeGroundMaterial(), []);
  const look = useRef(new THREE.Vector3(-8, 0, 12));
  const camPos = useRef(new THREE.Vector3(-24, 13, 52));
  const p = useRef(0);
  const tmp = useMemo(
    () => ({
      top: new THREE.Color(),
      hor: new THREE.Color(),
      glow: new THREE.Color(),
      sea: new THREE.Color(),
      sun: new THREE.Color(),
      hs: new THREE.Color(),
      hg: new THREE.Color(),
      dir: new THREE.Vector3(),
      v: new THREE.Vector3(),
      l: new THREE.Vector3(),
    }),
    [],
  );
  const skyUniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uGlow: { value: new THREE.Color() },
      uSunDir: { value: new THREE.Vector3() },
      uGlowAmt: { value: 0 },
      uStars: { value: 0 },
      uSunCol: { value: new THREE.Color() },
      uHorizonGlow: { value: 0 },
    }),
    [],
  );

  useEffect(() => {
    scene.fog = new THREE.Fog("#efece6", 28, 125);
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  // real coastline, roads and parks (baked from OpenStreetMap)
  useEffect(() => {
    let tex: THREE.Texture | null = null;
    new THREE.TextureLoader().load("/data/mumbai-ground.png", (t) => {
      t.flipY = false;
      t.colorSpace = THREE.NoColorSpace;
      t.anisotropy = 8;
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
      t.needsUpdate = true;
      tex = t;
      cityUniforms.uGround.value = t;
      arrived.ground = performance.now();
    });
    return () => {
      tex?.dispose();
      cityUniforms.uGround.value = null;
      cityUniforms.uGroundOn.value = 0;
    };
  }, []);

  // the real ground: Sentinel-2 cloudless 2024 (EOX), reprojected to the model grid
  useEffect(() => {
    let tex: THREE.Texture | null = null;
    new THREE.TextureLoader().load(
      mobile ? "/data/mumbai-sat-lite.webp" : "/data/mumbai-sat.webp",
      (t) => {
        t.flipY = false;
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
        t.needsUpdate = true;
        tex = t;
        cityUniforms.uSat.value = t;
        arrived.sat = performance.now();
      },
    );
    return () => {
      tex?.dispose();
      cityUniforms.uSat.value = null;
      cityUniforms.uSatOn.value = 0;
    };
  }, [mobile]);

  useFrame((state, dt) => {
    // filmic (ACES) for the satellite city; Google's photoreal tiles keep the neutral curve
    state.gl.toneMapping = photo
      ? THREE.NeutralToneMapping
      : THREE.ACESFilmicToneMapping;
    state.gl.toneMappingExposure = photo ? 1.08 : 1.15;
    const k = 1 - Math.exp(-dt * 3.2);
    p.current += (skyline.p - p.current) * k;
    const pp = p.current;

    // time of day: day -> dusk -> night
    const t1 = smoothstep(0.2, 0.5, pp);
    const t2 = smoothstep(0.52, 0.82, pp);
    const mixC = (
      out: THREE.Color,
      key:
        "top" | "horizon" | "glow" | "sea" | "sun" | "hemiSky" | "hemiGround",
    ) => out.copy(PH[0][key]).lerp(PH[1][key], t1).lerp(PH[2][key], t2);
    mixC(tmp.top, "top");
    mixC(tmp.hor, "horizon");
    mixC(tmp.glow, "glow");
    mixC(tmp.sea, "sea");
    mixC(tmp.sun, "sun");
    mixC(tmp.hs, "hemiSky");
    mixC(tmp.hg, "hemiGround");
    tmp.dir
      .copy(PH[0].sunDir)
      .lerp(PH[1].sunDir, t1)
      .lerp(PH[2].sunDir, t2)
      .normalize();
    const sunI = THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(PH[0].sunI, PH[1].sunI, t1),
      PH[2].sunI,
      t2,
    );
    const hemiI = THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(PH[0].hemiI, PH[1].hemiI, t1),
      PH[2].hemiI,
      t2,
    );

    cityUniforms.uNight.value = smoothstep(0.38, 0.78, pp);
    cityUniforms.uSea.value.copy(tmp.sea);
    // the city rises with the intro, but never before its data has arrived
    const now = performance.now();
    const since = arrived.city < 0 ? 0 : clamp((now - arrived.city) / 2600);
    cityUniforms.uRise.value = Math.min(
      skyline.rise,
      1 - Math.pow(1 - since, 2),
    );
    cityUniforms.uGroundOn.value =
      arrived.ground < 0 ? 0 : clamp((now - arrived.ground) / 700);
    cityUniforms.uSatOn.value =
      arrived.sat < 0 || arrived.ground < 0
        ? 0
        : clamp((now - Math.max(arrived.sat, arrived.ground)) / 900);
    cityUniforms.uTime.value = state.clock.elapsedTime;
    cityUniforms.uSkyTop.value.copy(tmp.top);
    cityUniforms.uSkyHor.value.copy(tmp.hor);
    cityUniforms.uSunDir.value.copy(tmp.dir);
    cityUniforms.uSunCol.value.copy(tmp.sun).multiplyScalar(sunI * 0.45);

    if (sky.current) {
      const u = sky.current.uniforms;
      u.uTop.value.copy(tmp.top);
      u.uHorizon.value.copy(tmp.hor);
      u.uGlow.value.copy(tmp.glow);
      u.uSunDir.value.copy(tmp.dir);
      u.uGlowAmt.value =
        0.25 + Math.sin(t1 * Math.PI) * 0.9 * (1 - t2) + t2 * 0.12;
      u.uHorizonGlow.value = smoothstep(0.86, 0.94, pp);
      u.uStars.value = t2;
      u.uSunCol.value.copy(tmp.sun);
    }
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(tmp.hor);
      // photoreal flies much lower: closer haze, like the real Mumbai air
      // the finale overview sees the whole city: the haze opens up
      setFogRange(scene.fog, photo, smoothstep(0.86, 0.95, pp));
    }
    fadeColor.copy(tmp.hor);
    if (sun.current) {
      sun.current.color.copy(tmp.sun);
      sun.current.intensity = sunI;
      // the shadow frustum follows what the camera looks at, so the small real buildings get crisp shadows
      sun.current.target.position.copy(look.current);
      sun.current.target.updateMatrixWorld();
      sun.current.position
        .copy(look.current)
        .addScaledVector(tmp.dir, photo ? 60 : 30);
    }
    if (hemi.current) {
      hemi.current.color.copy(tmp.hs);
      hemi.current.groundColor.copy(tmp.hg);
      hemi.current.intensity = hemiI;
    }

    // camera along the path, with a little cursor parallax
    const path = photo ? PATHS.photo : PATHS.clay;
    const u = pathParam(pp, path.keys);
    path.pos.getPoint(u, tmp.v);
    path.look.getPoint(u, tmp.l);
    if (photo) descend(tmp.v);
    tmp.v.x += pointer.x * 1.6;
    tmp.v.y += pointer.y * 0.9;
    camPos.current.lerp(tmp.v, 1 - Math.exp(-dt * 4));
    look.current.lerp(tmp.l, 1 - Math.exp(-dt * 4));
    camera.position.copy(camPos.current);
    camera.lookAt(look.current);
    if (mobile && camera instanceof THREE.PerspectiveCamera) {
      // portrait screens: pull back so the city still reads
      camera.position.addScaledVector(
        camera.getWorldDirection(tmp.dir).negate(),
        photo ? 2.5 : 3.5,
      );
    }
    fitNear(camera, photo);
  });

  return (
    <>
      <mesh scale={190} renderOrder={-1}>
        <sphereGeometry args={[1, 48, 24]} />
        <shaderMaterial
          ref={sky}
          vertexShader={SKY_VERT}
          fragmentShader={REAL_SKY_FRAG}
          uniforms={skyUniforms}
          side={THREE.BackSide}
          depthWrite={false}
          fog={false}
        />
      </mesh>
      <hemisphereLight ref={hemi} args={["#f6f4ef", "#cfc8bb", 1.1]} />
      <directionalLight
        ref={sun}
        castShadow={!photo}
        position={[50, 70, 40]}
        intensity={2.4}
        shadow-mapSize={mobile ? [1024, 1024] : [2048, 2048]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.004}
        shadow-radius={5}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-camera-near={1}
        shadow-camera-far={70}
      >
        <object3D attach="target" position={[-8, 0, 12]} />
      </directionalLight>
      {photo ? (
        <Suspense fallback={null}>
          <PhotorealCity fadeColor={fadeColor} />
        </Suspense>
      ) : (
        <>
          <mesh
            rotation-x={-Math.PI / 2}
            position={[8, 0, -10]}
            material={ground}
            receiveShadow
          >
            <planeGeometry args={[420, 420, 1, 1]} />
          </mesh>
          <RealCity mobile={mobile} />
        </>
      )}
      {LANDMARKS.map((l, i) => (
        <Tower key={l.slug} l={l} index={i} photo={photo} />
      ))}
      <Constellation />
    </>
  );
}

export default function SkylineScene({ active }: { active: boolean }) {
  const mobile = typeof window !== "undefined" && window.innerWidth < 768;
  return (
    <Canvas
      shadows="percentage"
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.5]}
      camera={{
        fov: mobile ? 50 : 32,
        near: 0.2,
        far: 420,
        position: [-24, 13, 52],
      }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.15;
      }}
    >
      <World mobile={mobile} active={active} />
    </Canvas>
  );
}
