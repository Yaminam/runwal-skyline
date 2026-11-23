"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { FLOORS, MILESTONE_FLOORS, buildAt, finaleAt, legacy, nightAt } from "../legacy/legacy-state";
import { BEAM_FRAG, BEAM_VERT, SKY_FRAG, SKY_VERT } from "./city-materials";

/*
  "48 years, 48 floors": a white clay tower that assembles one floor per year as you scroll.
  Floors drop in from above, swing into line and settle; milestone years land lit in amber.
  The sky runs from a 1978 morning to a 2026 night, when every window and the crown come on.
*/

const FH = 0.42; // floor height in world units
const DROP = 7;
const TOP = FLOORS * FH;

const U = {
  uNight: { value: 0 },
  uWarm: { value: new THREE.Color("#ffb46a") },
  uAmber: { value: new THREE.Color("#f2a65a") },
};

const HASH = /* glsl */ `
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
`;

/**
 * Clay with procedural windows. "floor" mode uses local coordinates (one window row per floor,
 * so the panes stay put while a floor swings in); "city" mode uses world coordinates for the
 * instanced neighbourhood.
 */
function makeClay(mode: "floor" | "city", per?: { lit: { value: number }; glow: { value: number }; seed: number; bodyH: number }) {
  const m = new THREE.MeshStandardMaterial({ color: mode === "floor" ? "#f8f6f2" : "#f1efea", roughness: 0.86 });
  m.customProgramCacheKey = () => `legacy-${mode}`;
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uNight = U.uNight;
    shader.uniforms.uWarm = U.uWarm;
    shader.uniforms.uAmber = U.uAmber;
    shader.uniforms.uLit = per?.lit ?? { value: 0 };
    shader.uniforms.uGlow = per?.glow ?? { value: 0 };
    shader.uniforms.uSeed = { value: per?.seed ?? 0 };
    shader.uniforms.uBodyH = { value: per?.bodyH ?? 1 };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uBodyH;
varying vec3 vP; varying vec3 vN; varying float vFy;`,
      )
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
vN = normal;
${
  mode === "floor"
    ? `vP = position; vFy = position.y / uBodyH + 0.5;`
    : `vec4 wp4 = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
wp4 = instanceMatrix * wp4;
#endif
vP = (modelMatrix * wp4).xyz; vFy = fract(vP.y * 2.4);`
}`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uNight; uniform vec3 uWarm; uniform vec3 uAmber;
uniform float uLit; uniform float uGlow; uniform float uSeed;
varying vec3 vP; varying vec3 vN; varying float vFy;
${HASH}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
float side = 1.0 - step(0.5, abs(vN.y));
float uu = abs(vN.x) > 0.5 ? vP.z : vP.x;
float fx = fract(uu * 3.0);
float win = step(0.16, fx) * step(fx, 0.84) * step(0.22, vFy) * step(vFy, 0.84) * side;
${mode === "city" ? "win *= step(0.4, vP.y);" : ""}
float hh = h21(vec2(floor(uu * 3.0), floor(vP.y * 2.4)) + uSeed * 17.0);
diffuseColor.rgb *= 1.0 - win * mix(0.09, 0.62, uNight);
diffuseColor.rgb = mix(diffuseColor.rgb, uAmber, uGlow * 0.28);
float lit = win * max(step(0.62, hh) * uNight, uLit * step(0.12, hh));`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
totalEmissiveRadiance += uWarm * lit * (0.3 + pow(hh, 2.0) * 1.2);
totalEmissiveRadiance += uAmber * uGlow * (0.06 + win * 0.9) * (0.45 + uNight * 0.8);`,
      );
  };
  return m;
}

/* ---------------------------------------------------------------- time of day */

const C = (s: string) => new THREE.Color(s);
const SKY = {
  day: { top: C("#b3c3d8"), hor: C("#f0ede7"), glow: C("#fff3e0"), sun: C("#fff8ee"), hs: C("#ffffff"), hg: C("#d6d0c5"), si: 2.3, hi: 1.55 },
  dusk: { top: C("#4b5d93"), hor: C("#f1b689"), glow: C("#ffbd85"), sun: C("#ffb27a"), hs: C("#a9acca"), hg: C("#77615a"), si: 1.9, hi: 0.8 },
  night: { top: C("#06080c"), hor: C("#171c27"), glow: C("#5d6d9e"), sun: C("#a9b6dc"), hs: C("#2a2f3d"), hg: C("#0a0b0e"), si: 0.32, hi: 0.32 },
};
const DIR_DAY = new THREE.Vector3(0.5, 0.85, 0.45).normalize();
const DIR_DUSK = new THREE.Vector3(-0.9, 0.18, 0.3).normalize();
const DIR_NIGHT = new THREE.Vector3(0.35, 0.75, -0.4).normalize();

/* ---------------------------------------------------------------- tower */

function footprint(i: number): [number, number] {
  if (i < 28) return [3.4, 2.8];
  if (i < 40) return [3.0, 2.5];
  return [2.5, 2.1];
}

type FloorRes = {
  i: number;
  w: number;
  d: number;
  milestone: boolean;
  per: { lit: { value: number }; glow: { value: number }; seed: number; bodyH: number };
  body: THREE.BoxGeometry;
  mat: THREE.MeshStandardMaterial;
};
// Built once per page load (the section only mounts once), mutated per frame inside useFrame.
let FLOOR_RES: FloorRes[] | null = null;
function floorRes() {
  if (!FLOOR_RES) {
    FLOOR_RES = Array.from({ length: FLOORS }, (_, i) => {
      const [w, d] = footprint(i);
      const bodyH = FH - 0.07;
      const per = { lit: { value: 0 }, glow: { value: 0 }, seed: (i * 7.31) % 1, bodyH };
      return { i, w, d, milestone: MILESTONE_FLOORS.has(i), per, body: new THREE.BoxGeometry(w, bodyH, d), mat: makeClay("floor", per) };
    });
  }
  return FLOOR_RES;
}

function Floors() {
  const groups = useRef<Array<THREE.Group | null>>([]);
  const landedAt = useRef<number[]>(Array(FLOORS).fill(-1));
  const ring = useRef<THREE.Mesh>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const lastLanding = useRef<{ floor: number; t: number }>({ floor: -1, t: -10 });

  const floors = floorRes();
  const slabGeo = useMemo(() => new THREE.BoxGeometry(1, 0.07, 1), []);
  const slabMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fdfcfa", roughness: 0.8 }), []);
  const amberSlab = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#f2a65a", roughness: 0.5, emissive: new THREE.Color("#f2a65a"), emissiveIntensity: 0.9 }),
    [],
  );

  useFrame((state) => {
    const p = legacy.p;
    const b = buildAt(p);
    const fin = finaleAt(p);
    const now = state.clock.elapsedTime;
    for (const f of floorRes()) {
      const g = groups.current[f.i];
      if (!g) continue;
      const t = Math.min(1, Math.max(0, b - f.i));
      g.visible = t > 0.001;
      if (!g.visible) {
        landedAt.current[f.i] = -1;
        continue;
      }
      const k = 1 - t;
      g.position.y = f.i * FH + DROP * Math.pow(k, 2.4);
      g.rotation.y = Math.pow(k, 2) * (f.i % 2 ? 0.9 : -0.9);
      const s = 1 + k * 0.18;
      g.scale.set(s, 1, s);
      if (t >= 1 && landedAt.current[f.i] < 0) {
        landedAt.current[f.i] = now;
        if (f.milestone) lastLanding.current = { floor: f.i, t: now };
      }
      // milestone floors glow amber once landed; at the finale every window comes on
      const since = landedAt.current[f.i] < 0 ? 0 : Math.min(1, (now - landedAt.current[f.i]) / 0.6);
      f.per.glow.value = f.milestone ? since * (1 - fin * 0.35) : 0;
      f.per.lit.value = Math.max(f.milestone ? since * 0.9 : 0, fin);
    }
    // landing pulse: a ring sweeps out from the floor that just landed
    if (ring.current && ringMat.current) {
      const L = lastLanding.current;
      const a = (now - L.t) / 1.3;
      ring.current.visible = L.floor >= 0 && a < 1;
      if (ring.current.visible) {
        ring.current.position.y = L.floor * FH + 0.02;
        ring.current.scale.setScalar(1 + a * 5);
        ringMat.current.opacity = (1 - a) * 0.7;
      }
    }
  });

  return (
    <group>
      {floors.map((f) => (
        <group
          key={f.i}
          ref={(el) => {
            groups.current[f.i] = el;
          }}
          visible={false}
        >
          <mesh geometry={slabGeo} material={f.milestone ? amberSlab : slabMat} scale={[f.w + 0.16, 1, f.d + 0.16]} position={[0, 0.035, 0]} castShadow receiveShadow />
          <mesh geometry={f.body} material={f.mat} position={[0, 0.07 + (FH - 0.07) / 2, 0]} castShadow receiveShadow />
        </group>
      ))}
      <mesh ref={ring} rotation-x={-Math.PI / 2} visible={false}>
        <ringGeometry args={[2.3, 2.4, 72]} />
        <meshBasicMaterial ref={ringMat} color="#f2a65a" transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Crown() {
  const group = useRef<THREE.Group>(null);
  const beacon = useRef<THREE.MeshBasicMaterial>(null);
  const beam = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uColor: { value: new THREE.Color("#ffb46a") }, uAmt: { value: 0 } }), []);
  const frame = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fbfaf7", roughness: 0.7 }), []);

  useFrame((state) => {
    const fin = finaleAt(legacy.p);
    if (group.current) {
      group.current.visible = fin > 0.001;
      group.current.scale.y = Math.max(0.001, fin);
    }
    const pulse = 0.85 + 0.15 * Math.sin(state.clock.elapsedTime * 2.2);
    if (beacon.current) beacon.current.color.setRGB(1, 0.75, 0.45).multiplyScalar(0.4 + fin * 2.6 * pulse);
    if (beam.current) beam.current.uniforms.uAmt.value = fin * 0.85 * pulse;
  });

  const [w, d] = footprint(FLOORS - 1);
  return (
    <group position={[0, TOP, 0]}>
      <group ref={group} visible={false}>
        {[
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ].map(([sx, sz], i) => (
          <mesh key={i} material={frame} position={[(sx * w) / 2.3, 0.9, (sz * d) / 2.3]} castShadow>
            <boxGeometry args={[0.08, 1.8, 0.08]} />
          </mesh>
        ))}
        <mesh material={frame} position={[0, 1.8, 0]} castShadow>
          <boxGeometry args={[w * 0.95, 0.08, d * 0.95]} />
        </mesh>
        <mesh position={[0, 2.25, 0]}>
          <sphereGeometry args={[0.22, 24, 16]} />
          <meshBasicMaterial ref={beacon} color="#ffb46a" toneMapped={false} />
        </mesh>
      </group>
      <mesh position={[0, 2.25 + 22, 0]}>
        <cylinderGeometry args={[0.06, 0.2, 44, 12, 1, true]} />
        <shaderMaterial ref={beam} vertexShader={BEAM_VERT} fragmentShader={BEAM_FRAG} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Seeded layout of the low neighbourhood. */
function makeNeighbourhood(mobile: boolean) {
  let s = 1978;
  const r = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  const out: Array<[number, number, number, number, number]> = [];
  const n = mobile ? 70 : 140;
  for (let k = 0; k < n; k++) {
    const a = r() * Math.PI * 2;
    const rad = 8 + Math.pow(r(), 0.7) * 30;
    const x = Math.cos(a) * rad;
    const z = Math.sin(a) * rad;
    const w = 1 + r() * 2.2;
    const d = 1 + r() * 2.2;
    // low streets close to the site so the camera reads over them, a taller city further out
    const h = rad < 20 ? 0.4 + Math.pow(r(), 1.6) * 1.6 : 0.6 + Math.pow(r(), 2.2) * 5.5 * (1 - rad / 48);
    out.push([x, z, w, d, Math.max(0.4, h)]);
  }
  return out;
}

/** Thane, 1978: a low neighbourhood around the site, for scale. */
function Neighbourhood({ mobile }: { mobile: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const mat = useMemo(() => makeClay("city"), []);
  const items = useMemo(() => makeNeighbourhood(mobile), [mobile]);
  const geo = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    g.translate(0, 0.5, 0);
    return g;
  }, []);

  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    const mx = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    items.forEach(([x, z, w, d, h], i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (i % 4) * 0.08);
      mx.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(w, h, d));
      m.setMatrixAt(i, mx);
    });
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [items]);

  return <instancedMesh ref={ref} args={[geo, mat, items.length]} castShadow receiveShadow frustumCulled={false} />;
}

/* ---------------------------------------------------------------- world */

function World({ mobile }: { mobile: boolean }) {
  const { camera, size } = useThree();
  const fog = useRef<THREE.Fog>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sky = useRef<THREE.ShaderMaterial>(null);
  const p = useRef(0);
  const cam = useRef(new THREE.Vector3(18, 6, 22));
  const look = useRef(new THREE.Vector3(0, 1, 0));
  const tmp = useMemo(
    () => ({ a: new THREE.Color(), b: new THREE.Color(), dir: new THREE.Vector3(), v: new THREE.Vector3(), l: new THREE.Vector3() }),
    [],
  );
  const skyU = useMemo(
    () => ({
      uTop: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uGlow: { value: new THREE.Color() },
      uSunDir: { value: new THREE.Vector3() },
      uGlowAmt: { value: 0 },
      uStars: { value: 0 },
    }),
    [],
  );
  const ground = useMemo(() => new THREE.MeshStandardMaterial({ color: "#e9e5de", roughness: 0.95 }), []);
  const plinth = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f7f5f1", roughness: 0.85 }), []);


  // frame the tower: left of centre on wide screens, upper-middle on phones
  useEffect(() => {
    const c = camera as THREE.PerspectiveCamera;
    if (mobile) c.setViewOffset(size.width, size.height, 0, size.height * 0.1, size.width, size.height);
    else c.setViewOffset(size.width, size.height, size.width * 0.14, 0, size.width, size.height);
    c.updateProjectionMatrix();
    return () => {
      c.clearViewOffset();
    };
  }, [camera, size, mobile]);

  useFrame((state, dt) => {
    p.current += (legacy.p - p.current) * (1 - Math.exp(-dt * 4));
    const pp = p.current;
    const b = buildAt(pp);
    const fin = finaleAt(pp);
    const night = nightAt(pp);
    U.uNight.value = night;

    // sky: morning -> dusk -> night
    const t1 = Math.min(1, night * 2);
    const t2 = Math.max(0, night * 2 - 1);
    const mix = (k: "top" | "hor" | "glow" | "sun" | "hs" | "hg", out: THREE.Color) => out.copy(SKY.day[k]).lerp(SKY.dusk[k], t1).lerp(SKY.night[k], t2);
    const s = sky.current?.uniforms;
    if (s) {
      mix("top", s.uTop.value);
      mix("hor", s.uHorizon.value);
      mix("glow", s.uGlow.value);
      s.uSunDir.value.copy(DIR_DAY).lerp(DIR_DUSK, t1).lerp(DIR_NIGHT, t2).normalize();
      s.uGlowAmt.value = 0.25 + Math.sin(t1 * Math.PI) * 0.8 * (1 - t2);
      s.uStars.value = t2;
      fog.current?.color.copy(s.uHorizon.value);
    }
    if (sun.current) {
      mix("sun", sun.current.color);
      sun.current.intensity = THREE.MathUtils.lerp(THREE.MathUtils.lerp(SKY.day.si, SKY.dusk.si, t1), SKY.night.si, t2);
      tmp.dir.copy(DIR_DAY).lerp(DIR_DUSK, t1).lerp(DIR_NIGHT, t2).normalize();
      sun.current.position.copy(tmp.dir).multiplyScalar(60);
    }
    if (hemi.current) {
      mix("hs", hemi.current.color);
      mix("hg", hemi.current.groundColor);
      hemi.current.intensity = THREE.MathUtils.lerp(THREE.MathUtils.lerp(SKY.day.hi, SKY.dusk.hi, t1), SKY.night.hi, t2);
    }

    // camera rises with the build and orbits slowly; the finale pulls back to the whole tower
    const top = Math.min(b, FLOORS) * FH;
    const ty = THREE.MathUtils.lerp(Math.max(1.4, top * 0.7), TOP * 0.6, fin);
    const radius = THREE.MathUtils.lerp(16 + top * 0.5, mobile ? 64 : 52, fin) * (mobile ? 1.25 : 1);
    const ang = -0.75 + pp * 1.6 + state.pointer.x * 0.06;
    const height = THREE.MathUtils.lerp(Math.max(top + 3.5, 7.5), TOP * 0.8, fin);
    tmp.v.set(Math.sin(ang) * radius, height, Math.cos(ang) * radius);
    tmp.l.set(0, ty, 0);
    cam.current.lerp(tmp.v, 1 - Math.exp(-dt * 3));
    look.current.lerp(tmp.l, 1 - Math.exp(-dt * 3));
    camera.position.copy(cam.current);
    camera.lookAt(look.current);
  });

  return (
    <>
      <fog ref={fog} attach="fog" args={["#f0ede7", 40, 120]} />
      <mesh scale={160} renderOrder={-1}>
        <sphereGeometry args={[1, 48, 24]} />
        <shaderMaterial ref={sky} vertexShader={SKY_VERT} fragmentShader={SKY_FRAG} uniforms={skyU} side={THREE.BackSide} depthWrite={false} fog={false} />
      </mesh>
      <hemisphereLight ref={hemi} args={["#ffffff", "#d6d0c5", 1.5]} />
      <directionalLight
        ref={sun}
        castShadow
        position={[30, 50, 27]}
        intensity={2.3}
        shadow-mapSize={mobile ? [1024, 1024] : [2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-near={1}
        shadow-camera-far={140}
      />
      <mesh rotation-x={-Math.PI / 2} material={ground} receiveShadow>
        <planeGeometry args={[400, 400]} />
      </mesh>
      <mesh position={[0, -0.15, 0]} material={plinth} receiveShadow castShadow>
        <cylinderGeometry args={[6.2, 6.5, 0.3, 64]} />
      </mesh>
      <Neighbourhood mobile={mobile} />
      <Floors />
      <Crown />
    </>
  );
}

export default function LegacyTower({ active, mobile }: { active: boolean; mobile: boolean }) {
  return (
    <Canvas
      shadows="percentage"
      frameloop={active ? "always" : "never"}
      dpr={mobile ? [1, 1.5] : [1, 1.75]}
      camera={{ fov: mobile ? 42 : 30, near: 0.5, far: 400, position: [18, 6, 22] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <World mobile={mobile} />
    </Canvas>
  );
}
