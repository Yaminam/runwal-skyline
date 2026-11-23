"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode, type BloomEffect, type VignetteEffect } from "postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import * as THREE from "three";
import { pointer } from "@/lib/motion";
import { PHASES, bump, district, hourAt, light, smooth, type BuildingKey } from "../places/district-state";

/*
  "A day in a Runwal district": an architect's clay model of one mixed-use block on a plinth.
  R Square (offices), R City (mall with an atrium), a hotel, a residential tower and a plaza,
  with instanced people and cars whose flows follow the clock the visitor scrolls.
*/

/* ---------------------------------------------------------------- materials */

const shared = {
  uNight: { value: 0 },
  uWarm: { value: new THREE.Color("#ffb46a") },
};

const HASH = /* glsl */ `
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
`;

type ClayOpts = { color?: string; winX?: number; winY?: number; shopfront?: boolean; seed?: number };

/** Clay building with procedural windows; `lit` controls how many panes glow. */
function makeClay({ color = "#f7f5f1", winX = 2.2, winY = 1.6, shopfront = false, seed = 0.3 }: ClayOpts) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0 });
  const lit = { value: 0 };
  m.userData.lit = lit;
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uNight = shared.uNight;
    shader.uniforms.uWarm = shared.uWarm;
    shader.uniforms.uLit = lit;
    shader.uniforms.uSeed = { value: seed };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vWP; varying vec3 vObjN;`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>\nvObjN = normal;`)
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
vec4 wp4 = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
wp4 = instanceMatrix * wp4;
#endif
vWP = (modelMatrix * wp4).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uNight; uniform vec3 uWarm; uniform float uLit; uniform float uSeed;
varying vec3 vWP; varying vec3 vObjN;
${HASH}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
float side = 1.0 - step(0.5, abs(vObjN.y));
float uu = abs(vObjN.x) > 0.5 ? vWP.z : vWP.x;
vec2 cell = vec2(uu * ${winX.toFixed(2)}, vWP.y * ${winY.toFixed(2)});
vec2 fc = fract(cell);
float win = step(0.14, fc.x) * step(fc.x, 0.86) * step(0.26, fc.y) * step(fc.y, 0.82) * side * step(0.5, vWP.y);
${shopfront ? "win = side * step(0.25, vWP.y) * step(vWP.y, 1.55) * step(0.06, fc.x) * step(fc.x, 0.94);" : ""}
float hh = h21(floor(cell) + uSeed * 31.0);
diffuseColor.rgb *= 1.0 - win * mix(0.08, 0.5, uNight);
float litW = win * step(1.0 - uLit, hh);`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
totalEmissiveRadiance += uWarm * litW * (0.35 + pow(hh, 3.0) * 1.5) * (0.25 + uNight * 1.6);`,
      );
  };
  return m;
}

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const box = (() => {
  const g = new THREE.BoxGeometry(1, 1, 1);
  g.translate(0, 0.5, 0);
  return g;
})();
const edges = new THREE.EdgesGeometry(box);

/* ---------------------------------------------------------------- layout */

// Block on a 48 x 48 plinth. Avenue along x at z = 0, cross street along z at x = 0 (both 4 wide).
const SIDE = 2.7; // sidewalk centreline offset from the road axis
const HALF = 24;

type Part = { p: [number, number, number]; s: [number, number, number] };
type Building = { key: BuildingKey; name: string; parts: Part[]; top: [number, number, number]; door: [number, number]; approach: [number, number] };

const BUILDINGS: Building[] = [
  {
    key: "office",
    name: "R Square · Offices",
    parts: [
      { p: [-12.5, 0, -12.5], s: [13, 3, 11] },
      { p: [-13.5, 3, -13.5], s: [8, 19, 6.5] },
      { p: [-13.5, 22, -13.5], s: [6, 1.2, 5] },
    ],
    top: [-13.5, 24.5, -13.5],
    door: [-10, -7.3],
    approach: [-10, -SIDE],
  },
  {
    key: "hotel",
    name: "Runwal Hotel · Coming soon",
    parts: [
      { p: [12.5, 0, -12], s: [10, 3.2, 9] },
      { p: [13, 3.2, -13], s: [5.4, 24, 5.4] },
      { p: [13, 27.2, -13], s: [3.6, 2.2, 3.6] },
    ],
    top: [13, 30.5, -13],
    door: [11, -7.6],
    approach: [11, -SIDE],
  },
  {
    key: "mall",
    name: "R City · Retail",
    parts: [
      { p: [13.5, 0, 13], s: [17, 5, 14] },
      { p: [13.5, 5, 14.5], s: [11, 1.6, 8] },
    ],
    top: [13.5, 9, 13],
    door: [10, 6.1],
    approach: [10, SIDE],
  },
  {
    key: "home",
    name: "Runwal Residences",
    parts: [
      { p: [-15.5, 0, 16], s: [9, 2.4, 9] },
      { p: [-15.5, 2.4, 16.5], s: [6.4, 18, 6.4] },
      { p: [-15.5, 20.4, 16.5], s: [4.6, 1.4, 4.6] },
    ],
    top: [-15.5, 23.5, 16.5],
    door: [-15.5, 11.4],
    approach: [-15.5, SIDE],
  },
];

const PLAZA = { c: [-7.5, 8] as [number, number], top: [-7.5, 3, 8] as [number, number, number] };

/* ---------------------------------------------------------------- people */

type Flow = "commute" | "lunch" | "stroll" | "mall" | "hotel" | "home";
const FLOW_COUNT: Record<Flow, number> = { commute: 150, lunch: 80, stroll: 90, mall: 140, hotel: 40, home: 60 };

function weight(flow: Flow, h: number) {
  switch (flow) {
    case "commute":
      return bump(h, 6.6, 11, 1.3);
    case "lunch":
      return bump(h, 11.9, 14.6, 0.7);
    case "stroll":
      return 0.15 + bump(h, 7, 21.5, 1.5) * 0.65;
    case "mall":
      return bump(h, 15.4, 22.6, 1.4);
    case "hotel":
      return bump(h, 18.6, 25, 1.1);
    case "home":
      return bump(h, 17.6, 23.8, 1.3);
  }
}

type Path = { pts: THREE.Vector2[]; len: number[]; total: number; loop: boolean; pingpong: boolean };

function makePath(pts: Array<[number, number]>, opts: { loop?: boolean; pingpong?: boolean } = {}): Path {
  const v = pts.map(([x, z]) => new THREE.Vector2(x, z));
  if (opts.loop) v.push(v[0].clone());
  const len = [0];
  for (let i = 1; i < v.length; i++) len.push(len[i - 1] + v[i].distanceTo(v[i - 1]));
  return { pts: v, len, total: len[len.length - 1], loop: !!opts.loop, pingpong: !!opts.pingpong };
}

function sample(path: Path, u: number, out: THREE.Vector2, dir: THREE.Vector2) {
  const d = u * path.total;
  let i = 1;
  while (i < path.len.length - 1 && path.len[i] < d) i++;
  const a = path.pts[i - 1];
  const b = path.pts[i];
  const seg = path.len[i] - path.len[i - 1] || 1;
  const t = (d - path.len[i - 1]) / seg;
  out.set(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
  dir.set(b.x - a.x, b.y - a.y).normalize();
}

// Street ends where people arrive (metro / bus stops at the edge of the block), on both sidewalks.
const SOURCES: Array<[number, number]> = [
  [-HALF + 1, -SIDE],
  [-HALF + 1, SIDE],
  [HALF - 1, -SIDE],
  [HALF - 1, SIDE],
  [-SIDE, -HALF + 1],
  [SIDE, -HALF + 1],
  [-SIDE, HALF - 1],
  [SIDE, HALF - 1],
];

/** From a street end, along the sidewalks, to a door. */
function routeTo(src: [number, number], approach: [number, number], door: [number, number], r: () => number): Array<[number, number]> {
  const j = () => (r() - 0.5) * 0.9;
  const sideZ = approach[1];
  const pts: Array<[number, number]> = [[src[0] + j(), src[1] + j()]];
  const onAvenue = Math.abs(src[1]) < SIDE + 0.5;
  if (onAvenue) {
    // walking along the avenue; cross it at the junction if needed
    if (Math.sign(src[1]) !== Math.sign(sideZ)) {
      const cx = src[0] < 0 ? -SIDE : SIDE;
      pts.push([cx + j() * 0.5, src[1] + j() * 0.3]);
      pts.push([cx + j() * 0.5, sideZ + j() * 0.3]);
    }
  } else {
    // coming down the cross street: walk to the corner on the right side
    const cx = src[0];
    pts.push([cx + j() * 0.4, sideZ + j() * 0.4]);
  }
  pts.push([approach[0] + j(), sideZ + j() * 0.4]);
  pts.push([door[0] + j() * 0.8, door[1]]);
  return pts;
}

type Agent = { flow: Flow; rank: number; path: Path; speed: number; offset: number; lane: number };

function buildAgents(mobile: boolean) {
  const r = rng(2026);
  const office = BUILDINGS[0];
  const hotel = BUILDINGS[1];
  const mall = BUILDINGS[2];
  const home = BUILDINGS[3];
  const agents: Agent[] = [];
  (Object.keys(FLOW_COUNT) as Flow[]).forEach((flow) => {
    const n = Math.round(FLOW_COUNT[flow] * (mobile ? 0.45 : 1));
    for (let i = 0; i < n; i++) {
      const src = SOURCES[Math.floor(r() * SOURCES.length)];
      let path: Path;
      if (flow === "commute") path = makePath(routeTo(src, office.approach, office.door, r));
      else if (flow === "mall") {
        const sideDoor = r() < 0.4;
        path = sideDoor ? makePath(routeTo(src, [SIDE, 12], [5.3, 12 + (r() - 0.5) * 4], r)) : makePath(routeTo(src, mall.approach, mall.door, r));
      } else if (flow === "hotel") path = makePath(routeTo(src, hotel.approach, hotel.door, r));
      else if (flow === "home") path = makePath(routeTo(src, home.approach, home.door, r));
      else if (flow === "lunch") {
        const j = () => (r() - 0.5) * 1.2;
        path = makePath(
          [
            [office.door[0] + j(), office.door[1]],
            [office.approach[0] + j(), -SIDE + j() * 0.3],
            [-4.5 + j(), -SIDE + j() * 0.3],
            [-4.5 + j(), SIDE + j() * 0.3],
            [PLAZA.c[0] + (r() - 0.5) * 6, PLAZA.c[1] + (r() - 0.5) * 4],
          ],
          { pingpong: true },
        );
      } else {
        // stroll: loop the inner sidewalks of one quadrant
        const qx = r() < 0.5 ? -1 : 1;
        const qz = r() < 0.5 ? -1 : 1;
        const a = SIDE + (r() - 0.5) * 0.6;
        const b = HALF - 2;
        const loop: Array<[number, number]> = [
          [qx * a, qz * a],
          [qx * b, qz * a],
          [qx * b, qz * (a + 0.6)],
          [qx * a + qx * 0.6, qz * (a + 0.6)],
          [qx * a, qz * b],
        ];
        path = makePath(r() < 0.5 ? loop : [...loop].reverse(), { loop: true });
      }
      agents.push({ flow, rank: i / n, path, speed: (0.85 + r() * 0.5) * 1.35, offset: r(), lane: (r() - 0.5) * 0.25 });
    }
  });
  return agents;
}

const PT = { m: new THREE.Matrix4(), q: new THREE.Quaternion(), s: new THREE.Vector3(), p: new THREE.Vector3(), pos: new THREE.Vector2(), dir: new THREE.Vector2(), up: new THREE.Vector3(0, 1, 0) };

const PEOPLE_COLORS = ["#2b2e33", "#2b2e33", "#3c4048", "#545861", "#2b2e33", "#3b5bdb", "#d9822f", "#f3f1ed", "#7a6458"];

function People({ mobile }: { mobile: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const agents = useMemo(() => buildAgents(mobile), [mobile]);
  const geom = useMemo(() => {
    const g = new THREE.CapsuleGeometry(0.13, 0.36, 2, 6);
    g.translate(0, 0.31, 0);
    return g;
  }, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.7 }), []);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const c = new THREE.Color();
    agents.forEach((_, i) => {
      c.set(PEOPLE_COLORS[i % PEOPLE_COLORS.length]);
      mesh.setColorAt(i, c);
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [agents]);

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    const h = hourAt(district.p);
    const time = district.still ? 40 : state.clock.elapsedTime;
    const w: Record<Flow, number> = {
      commute: weight("commute", h),
      lunch: weight("lunch", h),
      stroll: weight("stroll", h),
      mall: weight("mall", h),
      hotel: weight("hotel", h),
      home: weight("home", h),
    };
    for (let i = 0; i < agents.length; i++) {
      const a = agents[i];
      // visible when its rank is inside the flow's current share; fades at the edges
      let vis = smooth(0, 0.06, w[a.flow] - a.rank) * district.rise;
      const cyc = (time * a.speed) / a.path.total + a.offset;
      let u = cyc - Math.floor(cyc);
      if (a.path.pingpong) u = 1 - Math.abs(2 * u - 1);
      else if (!a.path.loop) vis *= smooth(0, 0.04, u) * (1 - smooth(0.93, 1, u)); // appear at the stop, vanish through the door
      sample(a.path, u, PT.pos, PT.dir);
      const bob = Math.abs(Math.sin(time * 9 + i)) * 0.05;
      PT.p.set(PT.pos.x - PT.dir.y * a.lane, 0.02 + bob, PT.pos.y + PT.dir.x * a.lane);
      PT.q.setFromAxisAngle(PT.up, Math.atan2(PT.dir.x, PT.dir.y));
      PT.s.setScalar(Math.max(0.0001, vis));
      PT.m.compose(PT.p, PT.q, PT.s);
      mesh.setMatrixAt(i, PT.m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={ref} args={[geom, mat, agents.length]} castShadow frustumCulled={false} />;
}

/* ---------------------------------------------------------------- cars */

const CAR_COUNT = 18;
const TRAIL = 11;

const TRAIL_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vCol;
void main(){
  vUv = uv;
  vCol = vec3(1.0);
  #ifdef USE_INSTANCING_COLOR
  vCol = instanceColor;
  #endif
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}
`;
const TRAIL_FRAG = /* glsl */ `
uniform float uAmt;
varying vec2 vUv;
varying vec3 vCol;
void main(){
  float along = pow(vUv.x, 1.7);
  float across = 1.0 - abs(vUv.y - 0.5) * 2.0;
  float a = along * smoothstep(0.0, 0.7, across) * uAmt;
  gl_FragColor = vec4(vCol * a, a);
}
`;

/** Thin flat ribbon spanning local x in [-1, 0]: stretched behind a car into a long-exposure streak. */
const trailGeom = (() => {
  const g = new THREE.PlaneGeometry(1, 1);
  g.rotateX(-Math.PI / 2);
  g.translate(-0.5, 0, 0);
  return g;
})();

function Cars() {
  const body = useRef<THREE.InstancedMesh>(null);
  const lamps = useRef<THREE.InstancedMesh>(null);
  const lampMat = useRef<THREE.MeshBasicMaterial>(null);
  const trails = useRef<THREE.InstancedMesh>(null);
  const trailMat = useRef<THREE.ShaderMaterial>(null);
  const trailUniforms = useMemo(() => ({ uAmt: { value: 0 } }), []);
  const cars = useMemo(() => {
    const r = rng(7);
    return Array.from({ length: CAR_COUNT }, (_, i) => ({
      axis: i % 2 === 0 ? "x" : "z",
      dir: i % 4 < 2 ? 1 : -1,
      offset: r(),
      speed: 3.2 + r() * 2,
      rank: r(),
      tone: r(),
    }));
  }, []);

  useEffect(() => {
    const mesh = body.current;
    if (!mesh) return;
    const c = new THREE.Color();
    cars.forEach((car, i) => {
      c.set(car.tone < 0.45 ? "#f4f2ee" : car.tone < 0.75 ? "#2b2e33" : car.tone < 0.9 ? "#8c9099" : "#3b5bdb");
      mesh.setColorAt(i, c);
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    // streak colours: cars heading +x / +z show us their tail lights (red), the others their head lights
    const tm = trails.current;
    if (tm) {
      cars.forEach((car, i) => {
        c.setRGB(...((car.dir > 0 ? [2.4, 0.18, 0.1] : [2.2, 1.9, 1.5]) as [number, number, number]));
        tm.setColorAt(i * 2, c);
        tm.setColorAt(i * 2 + 1, c);
      });
      if (tm.instanceColor) tm.instanceColor.needsUpdate = true;
    }
  }, [cars]);

  useFrame((state) => {
    const h = hourAt(district.p);
    const time = district.still ? 20 : state.clock.elapsedTime;
    const density = 0.3 + bump(h, 7, 11, 1.2) * 0.7 + bump(h, 17, 21.5, 1.2) * 0.6 - smooth(22, 24, h) * 0.2;
    const { night, dusk } = light(h);
    lampMat.current?.color.setRGB(1, 0.82, 0.6).multiplyScalar(0.25 + Math.max(dusk * 0.8, night) * 3.2);
    if (trailMat.current) trailMat.current.uniforms.uAmt.value = Math.max(dusk * 0.35, night) * 1.0;
    cars.forEach((car, i) => {
      const lane = car.dir * 0.95;
      const L = HALF * 2;
      const t = (((time * car.speed) / L + car.offset) % 1) * L - HALF;
      const along = t * car.dir;
      const vis = smooth(0, 0.08, density - car.rank) * district.rise * (1 - smooth(HALF - 2, HALF, Math.abs(along)));
      if (car.axis === "x") {
        PT.p.set(along, 0.02, lane);
        PT.q.setFromAxisAngle(PT.up, car.dir > 0 ? 0 : Math.PI);
      } else {
        PT.p.set(-lane, 0.02, along);
        PT.q.setFromAxisAngle(PT.up, car.dir > 0 ? -Math.PI / 2 : Math.PI / 2);
      }
      PT.s.setScalar(Math.max(0.0001, vis));
      PT.m.compose(PT.p, PT.q, PT.s);
      body.current?.setMatrixAt(i, PT.m);
      lamps.current?.setMatrixAt(i, PT.m);
      // two streaks per car (left / right lamps), as long as the road it has covered allows
      const len = Math.max(0.0001, Math.min(TRAIL, t + HALF) * Math.min(1, vis * 4));
      for (let k = 0; k < 2; k++) {
        const off = k === 0 ? -0.24 : 0.24;
        if (car.axis === "x") PT.p.set(along, 0.06, lane + off);
        else PT.p.set(-lane + off, 0.06, along);
        PT.s.set(len, 1, 0.16);
        PT.m.compose(PT.p, PT.q, PT.s);
        trails.current?.setMatrixAt(i * 2 + k, PT.m);
      }
    });
    if (body.current) body.current.instanceMatrix.needsUpdate = true;
    if (lamps.current) lamps.current.instanceMatrix.needsUpdate = true;
    if (trails.current) trails.current.instanceMatrix.needsUpdate = true;
  });

  const carGeom = useMemo(() => {
    const g = new THREE.BoxGeometry(1.5, 0.55, 0.72);
    g.translate(0, 0.38, 0);
    return g;
  }, []);
  const lampGeom = useMemo(() => {
    const g = new THREE.BoxGeometry(0.08, 0.14, 0.6);
    g.translate(0.78, 0.42, 0);
    return g;
  }, []);
  const carMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.1 }), []);

  return (
    <>
      <instancedMesh ref={body} args={[carGeom, carMat, CAR_COUNT]} castShadow frustumCulled={false} />
      <instancedMesh ref={lamps} args={[lampGeom, undefined, CAR_COUNT]} frustumCulled={false}>
        <meshBasicMaterial ref={lampMat} color="#ffd29a" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={trails} args={[trailGeom, undefined, CAR_COUNT * 2]} frustumCulled={false} renderOrder={3}>
        <shaderMaterial
          ref={trailMat}
          vertexShader={TRAIL_VERT}
          fragmentShader={TRAIL_FRAG}
          uniforms={trailUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
    </>
  );
}

/* ---------------------------------------------------------------- street furniture */

const LAMP_POS: Array<[number, number]> = (() => {
  const out: Array<[number, number]> = [];
  for (let x = -21; x <= 21; x += 6) {
    if (Math.abs(x) < 4) continue;
    out.push([x, -3.6], [x + 3, 3.6]);
  }
  for (let z = -21; z <= 21; z += 6) {
    if (Math.abs(z) < 4) continue;
    out.push([-3.6, z + 3], [3.6, z]);
  }
  return out;
})();

const POOL_VERT = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}
`;
const POOL_FRAG = /* glsl */ `
uniform float uAmt; uniform vec3 uColor;
varying vec2 vUv;
void main(){
  float d = length(vUv - 0.5) * 2.0;
  float a = pow(max(0.0, 1.0 - d), 2.2) * uAmt;
  gl_FragColor = vec4(uColor * a, a);
}
`;

function Streetlights() {
  const poles = useRef<THREE.InstancedMesh>(null);
  const heads = useRef<THREE.InstancedMesh>(null);
  const pools = useRef<THREE.InstancedMesh>(null);
  const headMat = useRef<THREE.MeshBasicMaterial>(null);
  const poolMat = useRef<THREE.ShaderMaterial>(null);
  const poolUniforms = useMemo(() => ({ uAmt: { value: 0 }, uColor: { value: new THREE.Color("#ffb46a") } }), []);

  useEffect(() => {
    const m = new THREE.Matrix4();
    LAMP_POS.forEach(([x, z], i) => {
      m.makeTranslation(x, 0, z);
      poles.current?.setMatrixAt(i, m);
      m.makeTranslation(x, 2.25, z);
      heads.current?.setMatrixAt(i, m);
      m.makeRotationX(-Math.PI / 2).setPosition(x, 0.03, z);
      pools.current?.setMatrixAt(i, m);
    });
    [poles, heads, pools].forEach((r) => {
      if (r.current) r.current.instanceMatrix.needsUpdate = true;
    });
  }, []);

  useFrame(() => {
    const { night, dusk } = light(hourAt(district.p));
    const on = Math.max(dusk * 0.6, night);
    headMat.current?.color.setRGB(1, 0.85, 0.65).multiplyScalar(0.3 + on * 4.2);
    if (poolMat.current) poolMat.current.uniforms.uAmt.value = on * 0.8;
  });

  const poleGeom = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.05, 0.07, 2.2, 6);
    g.translate(0, 1.1, 0);
    return g;
  }, []);

  return (
    <>
      <instancedMesh ref={poles} args={[poleGeom, undefined, LAMP_POS.length]} castShadow>
        <meshStandardMaterial color="#d8d3ca" roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, LAMP_POS.length]}>
        <sphereGeometry args={[0.17, 10, 8]} />
        <meshBasicMaterial ref={headMat} color="#ffd9a6" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={pools} args={[undefined, undefined, LAMP_POS.length]} renderOrder={2}>
        <planeGeometry args={[5, 5]} />
        <shaderMaterial ref={poolMat} vertexShader={POOL_VERT} fragmentShader={POOL_FRAG} uniforms={poolUniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </instancedMesh>
    </>
  );
}

const TREES: Array<[number, number, number]> = (() => {
  const r = rng(11);
  const out: Array<[number, number, number]> = [];
  // plaza grove
  for (let i = 0; i < 14; i++) out.push([PLAZA.c[0] + (r() - 0.5) * 8, PLAZA.c[1] + (r() - 0.5) * 5.5, 0.7 + r() * 0.5]);
  // avenue verges
  for (let x = -20; x <= 20; x += 4.5) {
    if (Math.abs(x) < 5) continue;
    out.push([x + 1.5, -4.6, 0.65 + r() * 0.25], [x, 4.6, 0.65 + r() * 0.25]);
  }
  // mall forecourt + hotel drop-off
  out.push([19, 4.8, 0.8], [7, 20, 0.7], [7, 15, 0.7], [18, -5, 0.7], [7.5, -18, 0.7]);
  return out.filter(([x, z]) => !(Math.abs(x - PLAZA.c[0]) < 1.4 && Math.abs(z - PLAZA.c[1]) < 1.4));
})();

function Trees() {
  const crowns = useRef<THREE.InstancedMesh>(null);
  const trunks = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    TREES.forEach(([x, z, sc], i) => {
      m.compose(new THREE.Vector3(x, 1.2 * sc + 0.9, z), q, new THREE.Vector3(sc, sc * 1.05, sc));
      crowns.current?.setMatrixAt(i, m);
      m.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(1, sc * 1.3, 1));
      trunks.current?.setMatrixAt(i, m);
    });
    if (crowns.current) crowns.current.instanceMatrix.needsUpdate = true;
    if (trunks.current) trunks.current.instanceMatrix.needsUpdate = true;
  }, []);
  const trunkGeom = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.06, 0.09, 1.2, 6);
    g.translate(0, 0.6, 0);
    return g;
  }, []);
  return (
    <>
      <instancedMesh ref={crowns} args={[undefined, undefined, TREES.length]} castShadow receiveShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#e4e8de" roughness={0.95} flatShading />
      </instancedMesh>
      <instancedMesh ref={trunks} args={[trunkGeom, undefined, TREES.length]} castShadow>
        <meshStandardMaterial color="#cfc9bd" roughness={0.9} />
      </instancedMesh>
    </>
  );
}

/* ---------------------------------------------------------------- buildings */

const HIGHLIGHT = new THREE.Color("#f2a65a");
const QUIET = new THREE.Color("#16181b");

function BuildingModel({ b, index }: { b: Building; index: number }) {
  const group = useRef<THREE.Group>(null);
  const lineMats = useRef<Array<THREE.LineBasicMaterial | null>>([]);
  const meshRef = useRef<THREE.Mesh>(null);
  const mat = useMemo(
    () =>
      makeClay({
        seed: index * 0.21 + 0.1,
        winX: b.key === "office" ? 2.6 : b.key === "hotel" ? 2 : 2.2,
        winY: b.key === "office" ? 1.9 : 1.6,
        shopfront: b.key === "mall",
      }),
    [b.key, index],
  );
  const hi = useRef(0);

  useFrame((_, dt) => {
    const h = hourAt(district.p);
    const { night, dusk, dawn } = light(h);
    // how many windows glow, per building and hour
    const L = (meshRef.current?.material as THREE.MeshStandardMaterial | undefined)?.userData.lit ?? { value: 0 };
    if (b.key === "office") L.value = 0.06 + bump(h, 6.5, 19.5, 1) * 0.25 + bump(h, 16.5, 21, 1) * 0.45 - smooth(21, 23, h) * 0.1;
    else if (b.key === "mall") L.value = 0.25 + bump(h, 9.5, 22.5, 1) * 0.75;
    else if (b.key === "hotel") L.value = 0.2 + Math.max(dusk * 0.4, night * 0.75) + dawn * 0.2;
    else L.value = 0.15 + dawn * 0.35 + Math.max(dusk * 0.35, night * (0.75 - smooth(22.5, 24, h) * 0.25));

    const target = district.focus === b.key ? 1 : 0;
    hi.current += (target - hi.current) * (1 - Math.exp(-dt * 5));
    for (const lm of lineMats.current) {
      if (!lm) continue;
      lm.color.copy(QUIET).lerp(HIGHLIGHT, hi.current);
      lm.opacity = 0.14 + hi.current * 0.86 + night * 0.06;
    }
    const rise = smooth(index * 0.12, index * 0.12 + 0.55, district.rise);
    if (group.current) group.current.scale.y = Math.max(0.002, 1 - Math.pow(1 - rise, 3));
  });

  return (
    <group ref={group}>
      {b.parts.map((pt, i) => (
        <group key={i} position={pt.p} scale={pt.s}>
          <mesh ref={i === 0 ? meshRef : undefined} geometry={box} material={mat} castShadow receiveShadow />
          <lineSegments geometry={edges}>
            <lineBasicMaterial
              ref={(m) => {
                lineMats.current[i] = m;
              }}
              color="#16181b"
              transparent
              opacity={0.16}
            />
          </lineSegments>
        </group>
      ))}
      {b.key === "mall" && (
        <>
          <Atrium />
          <AtriumRibs />
        </>
      )}
      {b.key === "hotel" && <Crown />}
    </group>
  );
}

function Atrium() {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    const h = hourAt(district.p);
    const glow = 0.1 + bump(h, 15, 23.5, 1.2) * (0.45 + light(h).night * 1.6);
    if (mat.current) mat.current.emissiveIntensity = glow;
  });
  // barrel-vault skylight over the atrium
  return (
    <mesh position={[13.5, 6.6, 14.5]} rotation-z={Math.PI / 2} scale={[3.2, 7.6, 4.6]} castShadow>
      <cylinderGeometry args={[0.5, 0.5, 1, 32, 1, false, 0, Math.PI]} />
      <meshStandardMaterial ref={mat} color="#dfe6ee" emissive="#ffb46a" emissiveIntensity={0.2} roughness={0.25} metalness={0.1} transparent opacity={0.92} />
    </mesh>
  );
}

/** Steel ribs over the barrel vault, so it reads as a glazed roof rather than a flat shape. */
function AtriumRibs() {
  const xs = [-3.4, -2.27, -1.13, 0, 1.13, 2.27, 3.4];
  return (
    <group position={[13.5, 6.6, 14.5]}>
      {xs.map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation-y={Math.PI / 2} scale={[1, 1.6 / 2.3, 1]}>
          <torusGeometry args={[2.3, 0.06, 6, 32, Math.PI]} />
          <meshStandardMaterial color="#b9b4ab" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[7.6, 0.08, 0.08]} />
        <meshStandardMaterial color="#b9b4ab" roughness={0.6} />
      </mesh>
    </group>
  );
}

function Crown() {
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => {
    const { night, dusk } = light(hourAt(district.p));
    mat.current?.color.setRGB(1, 0.78, 0.5).multiplyScalar(0.15 + Math.max(dusk * 0.7, night) * 4.5);
  });
  return (
    <mesh position={[13, 29.6, -13]} rotation-x={-Math.PI / 2}>
      <torusGeometry args={[2.3, 0.09, 8, 48]} />
      <meshBasicMaterial ref={mat} toneMapped={false} />
    </mesh>
  );
}

function Plaza() {
  const ring = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => {
    const { night, dusk } = light(hourAt(district.p));
    ring.current?.color.setRGB(1, 0.8, 0.55).multiplyScalar(0.1 + Math.max(dusk * 0.5, night) * 1.4);
  });
  return (
    <group>
      {/* paved plaza */}
      <mesh rotation-x={-Math.PI / 2} position={[PLAZA.c[0], 0.015, PLAZA.c[1]]} receiveShadow>
        <planeGeometry args={[10, 7]} />
        <meshStandardMaterial color="#e3ded4" roughness={0.9} />
      </mesh>
      {/* fountain */}
      <mesh position={[PLAZA.c[0], 0.12, PLAZA.c[1]]} receiveShadow castShadow>
        <cylinderGeometry args={[1.1, 1.15, 0.24, 40]} />
        <meshStandardMaterial color="#efece6" roughness={0.6} />
      </mesh>
      <mesh position={[PLAZA.c[0], 0.25, PLAZA.c[1]]} rotation-x={-Math.PI / 2}>
        <torusGeometry args={[0.95, 0.04, 6, 48]} />
        <meshBasicMaterial ref={ring} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------- ground */

// Neutral studio reflections, generated once on the GPU, used only by the roads (wet sheen at night).
const ENV: { tex: THREE.Texture | null } = { tex: null };

function Ground() {
  const roads = useRef<Array<THREE.MeshStandardMaterial | null>>([]);
  const envSet = useRef(false);
  useFrame((state) => {
    const { night, dusk } = light(hourAt(district.p));
    const wet = Math.max(dusk * 0.35, night);
    if (!ENV.tex) {
      const pm = new THREE.PMREMGenerator(state.gl);
      ENV.tex = pm.fromScene(new RoomEnvironment(), 0.04).texture;
      pm.dispose();
    }
    for (const m of roads.current) {
      if (!m) continue;
      if (!envSet.current) {
        m.envMap = ENV.tex;
        m.needsUpdate = true;
      }
      // dry asphalt by day, rain-dark and glossy after dark
      m.roughness = 0.95 - wet * 0.72;
      m.metalness = wet * 0.35;
      m.envMapIntensity = wet * 0.55;
      m.color.setRGB(0.67 - wet * 0.5, 0.65 - wet * 0.49, 0.62 - wet * 0.46);
      m.emissiveIntensity = wet * 0.02;
    }
    if (roads.current.some(Boolean)) envSet.current = true;
  });
  const dashes = useMemo(() => {
    const out: Array<[number, number, boolean]> = [];
    for (let v = -22; v <= 22; v += 2.2) {
      if (Math.abs(v) < 3) continue;
      out.push([v, 0, true], [0, v, false]);
    }
    return out;
  }, []);
  return (
    <group>
      {/* the plinth: the model sits on a block, like an architect's study */}
      <mesh position={[0, -1.6, 0]} receiveShadow castShadow>
        <boxGeometry args={[HALF * 2 + 2, 3.2, HALF * 2 + 2]} />
        <meshStandardMaterial color="#f1eee8" roughness={0.95} />
      </mesh>
      {/* roads */}
      {[
        [HALF * 2, 4.4],
        [4.4, HALF * 2],
      ].map(([w, d], i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[0, 0.01 + i * 0.001, 0]} receiveShadow>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial
            ref={(m) => {
              roads.current[i] = m;
            }}
            color="#d5d0c6"
            roughness={0.95}
            emissive="#ffb46a"
            emissiveIntensity={0}
          />
        </mesh>
      ))}
      {dashes.map(([x, z, alongX], i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[x, 0.02, z]}>
          <planeGeometry args={alongX ? [1, 0.08] : [0.08, 1]} />
          <meshBasicMaterial color="#f7f5f1" />
        </mesh>
      ))}
      {/* zebra crossings at the junction */}
      {[-1, 1].flatMap((sgn) =>
        Array.from({ length: 6 }, (_, k) => (
          <group key={`${sgn}-${k}`}>
            <mesh rotation-x={-Math.PI / 2} position={[sgn * 3.1, 0.022, -1.75 + k * 0.7]}>
              <planeGeometry args={[1.2, 0.3]} />
              <meshBasicMaterial color="#f7f5f1" />
            </mesh>
            <mesh rotation-x={-Math.PI / 2} position={[-1.75 + k * 0.7, 0.022, sgn * 3.1]}>
              <planeGeometry args={[0.3, 1.2]} />
              <meshBasicMaterial color="#f7f5f1" />
            </mesh>
          </group>
        )),
      )}
    </group>
  );
}

/* ---------------------------------------------------------------- sky */

// Hour -> [top, horizon] of the sky. Dawn peach, noon pale blue, golden hour, blue hour, night navy.
const SKY_KEYS: Array<[number, string, string]> = [
  [6.0, "#c9c9dc", "#f6d6bd"],
  [8.0, "#c2d0e4", "#f1ece6"],
  [12.5, "#aec6e4", "#eef2f4"],
  [16.6, "#a7b6d6", "#f3dcc0"],
  [17.9, "#7d8cc0", "#f5b47e"],
  [18.9, "#3d4d8c", "#e98e64"],
  [19.8, "#18244f", "#4f557f"],
  [21.0, "#0a0f1f", "#1b2340"],
  [24.0, "#05070d", "#10152a"],
];
const SKY_COL = SKY_KEYS.map(([h, t, b]) => ({ h, top: new THREE.Color(t), bottom: new THREE.Color(b) }));

const SKY_VERT = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position.xy, 0.9999, 1.0);
}
`;
const SKY_FRAG = /* glsl */ `
uniform vec3 uTop; uniform vec3 uBottom; uniform vec3 uGlow;
uniform float uGlowAmt; uniform float uStars; uniform float uMoon; uniform float uTime; uniform float uAspect;
uniform vec2 uSun; uniform vec2 uMoonPos;
varying vec2 vUv;
${HASH}
void main(){
  vec3 col = mix(uBottom, uTop, pow(smoothstep(0.0, 1.0, vUv.y), 0.85));
  vec2 asp = vec2(uAspect, 1.0);
  float sd = length((vUv - uSun) * asp);
  col += uGlow * uGlowAmt * (exp(-sd * 2.6) * 0.55 + exp(-sd * 9.0) * 0.6);
  vec2 g = floor(gl_FragCoord.xy / 2.5);
  float h = h21(g);
  float tw = 0.55 + 0.45 * sin(uTime * (1.0 + h * 3.0) + h * 60.0);
  col += vec3(0.85, 0.9, 1.0) * step(0.9975, h) * tw * uStars * smoothstep(0.3, 0.75, vUv.y) * 1.4;
  float md = length((vUv - uMoonPos) * asp);
  float disc = smoothstep(0.034, 0.03, md);
  float bite = smoothstep(0.03, 0.026, length((vUv - uMoonPos - vec2(0.012, 0.008)) * asp));
  col += vec3(1.0, 0.96, 0.86) * (max(disc - bite, 0.0) * 2.2 + exp(-md * 16.0) * 0.12) * uMoon;
  gl_FragColor = vec4(col, 1.0);
}
`;

const SKY_TMP = { top: new THREE.Color(), bottom: new THREE.Color() };

function skyAt(h: number) {
  let i = 0;
  while (i < SKY_COL.length - 2 && SKY_COL[i + 1].h <= h) i++;
  const a = SKY_COL[i];
  const b = SKY_COL[i + 1];
  const t = smooth(a.h, b.h, h);
  SKY_TMP.top.copy(a.top).lerp(b.top, t);
  SKY_TMP.bottom.copy(a.bottom).lerp(b.bottom, t);
  return SKY_TMP;
}

const FOG = new THREE.Fog("#eeebe5", 120, 260);

function Sky() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color() },
      uBottom: { value: new THREE.Color() },
      uGlow: { value: new THREE.Color("#ffb878") },
      uGlowAmt: { value: 0 },
      uStars: { value: 0 },
      uMoon: { value: 0 },
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uSun: { value: new THREE.Vector2(0.85, 0.2) },
      uMoonPos: { value: new THREE.Vector2(0.36, 0.86) },
    }),
    [],
  );
  useFrame((state) => {
    const m = mat.current;
    if (!m) return;
    const h = hourAt(district.p);
    const { night, dusk, dawn } = light(h);
    const sky = skyAt(h);
    const u = m.uniforms;
    u.uTop.value.copy(sky.top);
    u.uBottom.value.copy(sky.bottom);
    u.uAspect.value = state.size.width / state.size.height;
    // keep the moon clear of the clock: upper-middle on desktop, upper-left on phones
    if (u.uAspect.value < 1) u.uMoonPos.value.set(0.16, 0.8);
    else u.uMoonPos.value.set(0.36, 0.86);
    u.uTime.value = state.clock.elapsedTime;
    // the sun glow rises low on the right in the morning and sets low on the left
    const k = THREE.MathUtils.clamp((h - 6) / 13, 0, 1);
    u.uSun.value.set(0.92 - k * 0.84, 0.16 + Math.sin(k * Math.PI) * 0.5);
    u.uGlowAmt.value = dawn * 0.45 + bump(h, 16.4, 20, 1.2) * 0.5;
    u.uStars.value = night;
    u.uMoon.value = smooth(20, 21.5, h);
    // fog takes the horizon colour, so the far edge of the plinth melts into the sky
    if (!state.scene.fog) state.scene.fog = FOG;
    FOG.color.copy(sky.bottom);
    FOG.near = 120 - night * 20 - dusk * 10;
  });
  return (
    <mesh frustumCulled={false} renderOrder={-1000}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={mat} vertexShader={SKY_VERT} fragmentShader={SKY_FRAG} uniforms={uniforms} depthTest={false} depthWrite={false} fog={false} />
    </mesh>
  );
}

/* ---------------------------------------------------------------- rig */

const ANCHORS: Record<BuildingKey, [number, number, number]> = {
  office: BUILDINGS[0].top,
  hotel: BUILDINGS[1].top,
  mall: BUILDINGS[2].top,
  home: BUILDINGS[3].top,
  plaza: PLAZA.top,
};

// Per-phase camera: target, zoom multiplier, elevation (rad), azimuth (rad), orbit sweep across the phase.
type Shot = { t: [number, number, number]; zoom: number; elev: number; az: number; sweep: number };
const SHOTS: Record<BuildingKey, Shot> = {
  office: { t: [-13.5, 12, -13.5], zoom: 1.85, elev: 0.42, az: 0.5, sweep: 0.45 }, // morning close-up on the tower
  plaza: { t: [-7.5, 2.2, 9], zoom: 1.7, elev: 0.32, az: 0.25, sweep: 0.5 }, // low angle across the lunch crowd
  mall: { t: [12.5, 4, 12.5], zoom: 1.45, elev: 0.98, az: 0.8, sweep: 0.6 }, // from above, into the glowing atrium
  hotel: { t: [13, 20, -13], zoom: 1.95, elev: 0.14, az: 0.25, sweep: 0.5 }, // hero shot up at the crown
  home: { t: [-15.5, 10, 16.5], zoom: 1.8, elev: 0.46, az: 1.05, sweep: 0.4 }, // the lit homes at night
};

const COL = {
  daySun: new THREE.Color("#fff6ea"),
  dawnSun: new THREE.Color("#ffe6cf"),
  duskSun: new THREE.Color("#ffa463"),
  moon: new THREE.Color("#9fb0e0"),
  daySky: new THREE.Color("#ffffff"),
  duskSky: new THREE.Color("#c3bfd0"),
  nightSky: new THREE.Color("#262a33"),
  dayGnd: new THREE.Color("#d9d4ca"),
  nightGnd: new THREE.Color("#0b0c10"),
};
const RT = {
  anchor: new THREE.Vector3(),
  sun: new THREE.Color(),
  sky: new THREE.Color(),
  gnd: new THREE.Color(),
  dir: new THREE.Vector3(),
  moon: new THREE.Vector3(-0.3, 0.85, 0.45).normalize(),
  target: new THREE.Vector3(0, 5, 0),
  goal: new THREE.Vector3(),
  shotT: new THREE.Vector3(),
};

function Rig({ mobile }: { mobile: boolean }) {
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const cam = useRef({ az: 0.95, elev: 0.62, zoom: 1 });

  useFrame((state, dt) => {
    const { camera, size } = state;
    const anchor = RT.anchor;
    const c = RT;
    const h = hourAt(district.p);
    const { night, dusk, dawn } = light(h);
    shared.uNight.value = Math.max(dusk * 0.55, night);

    // the sun crosses from east (+x) at dawn to west (-x) at dusk; a pale moon after dark
    const a = THREE.MathUtils.clamp((h - 6) / 13, 0, 1) * Math.PI;
    const dir = RT.dir.set(Math.cos(a), Math.sin(a) * 0.85 + 0.32, 0.55).normalize();
    dir.lerp(RT.moon, night).normalize();
    if (sun.current) {
      sun.current.position.copy(dir).multiplyScalar(80);
      c.sun.copy(COL.daySun).lerp(COL.dawnSun, dawn).lerp(COL.duskSun, dusk).lerp(COL.moon, night);
      sun.current.color.copy(c.sun);
      sun.current.intensity = THREE.MathUtils.lerp(THREE.MathUtils.lerp(2.5, 2.0, dusk), 0.35, night);
    }
    if (hemi.current) {
      c.sky.copy(COL.daySky).lerp(COL.duskSky, dusk).lerp(COL.nightSky, night);
      c.gnd.copy(COL.dayGnd).lerp(COL.nightGnd, night);
      hemi.current.color.copy(c.sky);
      hemi.current.groundColor.copy(c.gnd);
      hemi.current.intensity = THREE.MathUtils.lerp(THREE.MathUtils.lerp(1.55, 0.8, dusk), 0.28, night);
    }

    // cinematic camera: the full block between phases, a framed shot of each place during its phase
    let az = 0.95 - district.p * 0.75;
    let elev = 0.62;
    let zoomMul = 1;
    RT.goal.set(0, 5, 0);
    for (const ph of PHASES) {
      const w = bump(h, ph.from, Math.min(ph.to, 24.6), 0.7);
      if (w <= 0) continue;
      const shot = SHOTS[ph.key];
      const local = THREE.MathUtils.clamp((h - ph.from) / (Math.min(ph.to, 24) - ph.from), 0, 1);
      const e = w * w * (3 - 2 * w);
      az = THREE.MathUtils.lerp(az, shot.az + (local - 0.5) * shot.sweep, e);
      elev = THREE.MathUtils.lerp(elev, shot.elev, e);
      zoomMul = THREE.MathUtils.lerp(zoomMul, shot.zoom * (mobile ? 0.85 : 1), e);
      RT.goal.lerp(RT.shotT.set(...shot.t), e);
    }
    az += pointer.x * 0.05;
    elev += pointer.y * 0.025;
    const k = district.still ? 1 : 1 - Math.exp(-dt * 3.2);
    const cs = cam.current;
    cs.az += (az - cs.az) * k;
    cs.elev += (elev - cs.elev) * k;
    cs.zoom += (zoomMul - cs.zoom) * k;
    RT.target.lerp(RT.goal, k);

    const R = 90;
    camera.position.set(
      RT.target.x + Math.sin(cs.az) * Math.cos(cs.elev) * R,
      RT.target.y + Math.sin(cs.elev) * R,
      RT.target.z + Math.cos(cs.az) * Math.cos(cs.elev) * R,
    );
    camera.lookAt(RT.target);
    if (camera instanceof THREE.OrthographicCamera) {
      const fit = mobile ? size.width / 70 : Math.min(size.height / 68, size.width / 100);
      camera.zoom = fit * cs.zoom;
      // frame the model right of the captions on desktop, above the caption card on phones
      camera.setViewOffset(size.width, size.height, mobile ? 0 : -size.width * 0.14, mobile ? size.height * 0.05 : 0, size.width, size.height);
      camera.updateProjectionMatrix();
    }

    // DOM label over the building being described
    const el = district.label;
    if (el) {
      if (district.focus) {
        anchor.set(...ANCHORS[district.focus]).project(camera);
        const sx = (anchor.x * 0.5 + 0.5) * size.width;
        const sy = (-anchor.y * 0.5 + 0.5) * size.height;
        el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -100%)`;
        // never under the clock / dial (top-right), never off the top
        const clockZone = sy < (mobile ? 170 : 150) && sx > size.width * (mobile ? 0.2 : 0.7);
        el.style.opacity = sy > 70 && !clockZone ? "1" : "0";
      } else el.style.opacity = "0";
    }
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={["#ffffff", "#d9d4ca", 1.5]} />
      <directionalLight
        ref={sun}
        castShadow
        intensity={2.4}
        shadow-mapSize={mobile ? [1024, 1024] : [2048, 2048]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.03}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-camera-near={1}
        shadow-camera-far={200}
      />
    </>
  );
}

/* ---------------------------------------------------------------- post */

function Effects({ mobile }: { mobile: boolean }) {
  const bloom = useRef<BloomEffect>(null);
  const vig = useRef<VignetteEffect>(null);
  useFrame(() => {
    const { night, dusk } = light(hourAt(district.p));
    // crisp by day; lamps, windows, crown and trails bloom after dark
    if (bloom.current) bloom.current.intensity = 0.04 + Math.max(dusk * 0.55, night) * (mobile ? 1.1 : 1.45);
    if (vig.current) vig.current.darkness = 0.22 + night * 0.38;
  });
  const fx = [
    <Bloom key="bloom" ref={bloom} mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.25} radius={0.72} intensity={0} resolutionScale={mobile ? 0.5 : 1} />,
    <Vignette key="vig" ref={vig} offset={0.3} darkness={0.25} />,
    <ToneMapping key="tm" mode={ToneMappingMode.NEUTRAL} />,
  ];
  if (!mobile) fx.push(<SMAA key="smaa" />);
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {fx}
    </EffectComposer>
  );
}

function Scene({ mobile }: { mobile: boolean }) {
  return (
    <>
      <Sky />
      <Rig mobile={mobile} />
      <Ground />
      <Plaza />
      {BUILDINGS.map((b, i) => (
        <BuildingModel key={b.key} b={b} index={i} />
      ))}
      <Trees />
      <Streetlights />
      <Cars />
      <People mobile={mobile} />
    </>
  );
}

/** Drops the post stack if the device can't hold the frame rate. */
function FpsGuard({ onLow }: { onLow: () => void }) {
  // skip the first 1.5 s (shader compiles), then sample 3 s of real frames
  const acc = useRef({ warm: 0, t: 0, n: 0, done: false });
  useFrame((_, dt) => {
    const a = acc.current;
    if (a.done) return;
    if (a.warm < 1.5) {
      a.warm += dt;
      return;
    }
    a.t += dt;
    a.n++;
    if (a.t > 3) {
      if (a.n / a.t < 28) onLow();
      a.done = true;
    }
  });
  return null;
}

export default function DistrictScene({ active }: { active: boolean }) {
  const mobile = typeof window !== "undefined" && window.innerWidth < 768;
  const [fx, setFx] = useState(true);
  return (
    <Canvas
      orthographic
      shadows="percentage"
      frameloop={active ? "always" : "never"}
      dpr={mobile ? [1, 1.5] : [1, 1.75]}
      camera={{ position: [60, 55, 60], zoom: 12, near: -200, far: 500 }}
      gl={{ antialias: !fx, alpha: false, powerPreference: "high-performance", stencil: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
      }}
    >
      <Scene mobile={mobile} />
      {fx && <Effects mobile={mobile} />}
      {fx && <FpsGuard onLow={() => setFx(false)} />}
    </Canvas>
  );
}
