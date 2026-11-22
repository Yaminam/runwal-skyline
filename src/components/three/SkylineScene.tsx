"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { clamp, pointer, smoothstep } from "@/lib/motion";
import {
  BEAM_FRAG,
  BEAM_VERT,
  SKY_FRAG,
  SKY_VERT,
  cityUniforms,
  landAt,
  makeBuildingMaterial,
  makeGroundMaterial,
  makeRiseDepthMaterial,
} from "./city-materials";
import { LANDMARKS, geo, labels, skyline, type Landmark } from "./skyline-state";

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
  horizon: "#f1efea",
  glow: "#fff4e4",
  sea: "#b7c6d3",
  sun: "#fffaf2",
  sunI: 2.3,
  hemiSky: "#ffffff",
  hemiGround: "#d9d4ca",
  hemiI: 1.55,
  sunDir: [0.45, 0.8, 0.55],
};
const DUSK: Phase = {
  top: "#46598f",
  horizon: "#f2b48a",
  glow: "#ffbf8a",
  sea: "#6c7894",
  sun: "#ffb27a",
  sunI: 2.1,
  hemiSky: "#a7abc9",
  hemiGround: "#7a6458",
  hemiI: 0.75,
  sunDir: [-0.95, 0.12, -0.15],
};
const NIGHT: Phase = {
  top: "#06080c",
  horizon: "#161b26",
  glow: "#5d6d9e",
  sea: "#0b0f17",
  sun: "#a9b6dc",
  sunI: 0.3,
  hemiSky: "#2a2f3d",
  hemiGround: "#0a0b0e",
  hemiI: 0.3,
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

// [progress, camera position, look-at]
const KEYS: Array<[number, [number, number, number], [number, number, number]]> = [
  [0.0, [-46, 33, 60], [-17, 1, 4]],
  [0.16, [-36, 19, 40], [-13, 3, 18]],
  [0.3, [-30, 17, 22], [-6, 3, 6]],
  [0.44, [8, 21, 8], [-10, 2, -16]],
  [0.57, [3, 20, -4], [-4, 2, -24]],
  [0.7, [1, 23, -8], [20, 3, -31]],
  [0.82, [7, 21, -14], [24, 3, -31]],
  [1.0, [-22, 58, 32], [6, 0, -10]],
];
const POS = new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k[1])), false, "centripetal");
const LOOK = new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k[2])), false, "centripetal");

function pathParam(p: number) {
  const n = KEYS.length - 1;
  for (let i = 0; i < n; i++) {
    const a = KEYS[i][0];
    const b = KEYS[i + 1][0];
    if (p <= b) {
      const t = clamp((p - a) / (b - a));
      const e = t * t * (3 - 2 * t);
      return (i + e) / n;
    }
  }
  return 1;
}

/* ---------------------------------------------------------------- city */

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const HUBS: Array<[number, number, number, number]> = [
  // x, z, radius, extra height
  [-9, 12, 7, 7], // Worli / Lower Parel
  [-14, 24, 4, 4], // Malabar Hill / Cuffe Parade
  [-4, 1, 6, 7], // BKC
  [-7, -13, 6, 4], // Andheri
  [-6, -24, 6, 4], // Malad / Goregaon
  [14, -19, 5, 4], // Mulund
  [21, -31, 7, 6], // Thane
  [9, -6, 4, 3], // Ghatkopar
];

function buildCity(mobile: boolean) {
  const r = rand(1978);
  const items: Array<{ x: number; z: number; w: number; d: number; h: number; seed: number; tone: number }> = [];
  const B = 3.2;
  const keepOut = LANDMARKS.map((l) => geo(l.lat, l.lon));
  for (let bx = -34; bx < 48; bx += B) {
    for (let bz = -58; bz < 38; bz += B) {
      if (mobile && r() < 0.45) continue;
      const x0 = bx + 0.6;
      const z0 = bz + 0.6;
      const size = B - 0.6;
      const split = r() < 0.55 ? 2 : 1;
      const lot = size / split;
      for (let i = 0; i < split; i++) {
        for (let j = 0; j < split; j++) {
          if (r() < 0.12) continue; // open plots and parks
          const cx = x0 + lot * (i + 0.5);
          const cz = z0 + lot * (j + 0.5);
          const w = lot * (0.55 + r() * 0.35);
          const d = lot * (0.55 + r() * 0.35);
          if (!landAt(cx - w / 2, cz - d / 2, 0.3) || !landAt(cx + w / 2, cz + d / 2, 0.3) || !landAt(cx - w / 2, cz + d / 2, 0.3) || !landAt(cx + w / 2, cz - d / 2, 0.3)) continue;
          if (keepOut.some(([kx, kz]) => Math.hypot(kx - cx, kz - cz) < 2.4)) continue;
          let boost = 0;
          for (const [hx, hz, hr, hh] of HUBS) {
            const dd = Math.hypot(hx - cx, hz - cz);
            boost += Math.exp(-(dd * dd) / (hr * hr)) * hh;
          }
          const far = Math.hypot(cx + 2, cz + 6) / 50;
          const h = 0.45 + Math.pow(r(), 3) * 3.4 + boost * (0.25 + r() * 0.75) - far * 0.6;
          items.push({ x: cx, z: cz, w, d, h: Math.max(0.35, h), seed: r(), tone: r() });
        }
      }
    }
  }
  return items;
}

function City({ mobile }: { mobile: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const items = useMemo(() => buildCity(mobile), [mobile]);
  const geom = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    g.translate(0, 0.5, 0);
    g.setAttribute("aSeed", new THREE.InstancedBufferAttribute(new Float32Array(items.map((i) => i.seed)), 1));
    return g;
  }, [items]);
  const mat = useMemo(() => makeBuildingMaterial({ instanced: true }), []);
  const depth = useMemo(() => makeRiseDepthMaterial(), []);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const col = new THREE.Color();
    items.forEach((it, i) => {
      m.compose(new THREE.Vector3(it.x, 0, it.z), q, new THREE.Vector3(it.w, it.h, it.d));
      mesh.setMatrixAt(i, m);
      // a few warm-grey and blue-grey "models" among the white, like an architect's massing study
      col.set(it.tone < 0.08 ? "#e6e1d8" : it.tone < 0.13 ? "#dde2e8" : "#ffffff");
      mesh.setColorAt(i, col);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.customDepthMaterial = depth;
    mesh.computeBoundingSphere();
  }, [items, depth]);

  return <instancedMesh ref={ref} args={[geom, mat, items.length]} castShadow receiveShadow frustumCulled={false} />;
}

/* ---------------------------------------------------------------- Runwal towers */

function towerParts(l: Landmark): Array<{ p: [number, number, number]; s: [number, number, number] }> {
  const { w, h } = l;
  switch (l.form) {
    case "twin":
      return [
        { p: [-w * 0.42, 0, 0], s: [w * 0.62, h, w * 0.62] },
        { p: [w * 0.42, 0, 0.15], s: [w * 0.62, h * 0.88, w * 0.62] },
        { p: [0, h * 0.5, 0.05], s: [w * 0.3, 0.35, w * 0.4] },
        { p: [0, 0, 0], s: [w * 1.9, 0.7, w * 1.2] },
      ];
    case "stepped":
      return [
        { p: [0, 0, 0], s: [w, h * 0.62, w] },
        { p: [0, h * 0.62, 0], s: [w * 0.8, h * 0.24, w * 0.8] },
        { p: [0, h * 0.86, 0], s: [w * 0.56, h * 0.14, w * 0.56] },
        { p: [0, 0, 0], s: [w * 1.7, 0.6, w * 1.7] },
      ];
    case "cluster":
      return [
        { p: [0, 0, -w * 0.45], s: [w * 0.6, h, w * 0.6] },
        { p: [-w * 0.6, 0, w * 0.4], s: [w * 0.6, h * 0.82, w * 0.6] },
        { p: [w * 0.62, 0, w * 0.35], s: [w * 0.6, h * 0.7, w * 0.6] },
        { p: [0, 0, 0], s: [w * 2.2, 0.55, w * 1.9] },
      ];
    default:
      return [
        { p: [0, 0, 0], s: [w * 1.45, h, w * 0.66] },
        { p: [0, h, 0], s: [w * 1.1, 0.5, w * 0.5] },
        { p: [0, 0, 0], s: [w * 2, 0.6, w * 1.2] },
      ];
  }
}

const unitBox = (() => {
  const g = new THREE.BoxGeometry(1, 1, 1);
  g.translate(0, 0.5, 0);
  return g;
})();

function Tower({ l, index }: { l: Landmark; index: number }) {
  const group = useRef<THREE.Group>(null);
  const crown = useRef<THREE.MeshBasicMaterial>(null);
  const beam = useRef<THREE.ShaderMaterial>(null);
  const ring = useRef<THREE.Mesh>(null);
  const anchor = useMemo(() => new THREE.Vector3(), []);
  const [x, z] = geo(l.lat, l.lon);
  const parts = useMemo(() => towerParts(l), [l]);
  const mat = useMemo(() => makeBuildingMaterial({ instanced: false, color: "#fbfaf7", seed: index * 0.13 + 0.2 }), [index]);
  const top = Math.max(...parts.map((p) => p.p[1] + p.s[1]));
  const beamUniforms = useMemo(() => ({ uColor: { value: new THREE.Color("#ffb46a") }, uAmt: { value: 0 } }), []);

  useFrame((state) => {
    const p = skyline.p;
    const label = labels[index];
    const night = smoothstep(0.42, 0.8, p);
    const lit = smoothstep(l.at - 0.04, l.at + 0.01, p) * smoothstep(0.0, 0.2, skyline.rise);
    const rise = clamp(skyline.rise * 1.6 - 0.25 - index * 0.03);
    mat.emissive.setRGB(1, 0.93, 0.84);
    mat.emissiveIntensity = lit * (0.04 + night * 0.42);
    if (group.current) group.current.scale.y = Math.max(0.002, 1 - Math.pow(1 - rise, 3));
    if (crown.current) crown.current.color.setRGB(1, 0.71 + 0.2 * (1 - lit), 0.42 + 0.5 * (1 - lit)).multiplyScalar(0.25 + lit * (1.2 + night * 2.2));
    if (beam.current) beam.current.uniforms.uAmt.value = lit * (0.12 + night * 0.75) * (0.85 + 0.15 * Math.sin(state.clock.elapsedTime * 2 + index));
    if (ring.current) {
      const t = (state.clock.elapsedTime * 0.5 + index * 0.17) % 1;
      ring.current.scale.setScalar(1 + t * 3.5);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * lit * 0.55;
    }
    if (label) {
      const focus = Math.max(1 - smoothstep(0.07, 0.15, Math.abs(p - (l.at + 0.03))), smoothstep(0.9, 0.97, p));
      const o = lit * focus * rise;
      label.style.opacity = String(o);
      if (o > 0.001) {
        // project the tower top to the screen; the label lives in the DOM overlay
        anchor.set(x + parts[0].p[0], top * (group.current?.scale.y ?? 1) + 0.6, z + parts[0].p[2]).project(state.camera);
        const sx = (anchor.x * 0.5 + 0.5) * state.size.width;
        const sy = (-anchor.y * 0.5 + 0.5) * state.size.height;
        label.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -100%)`;
        label.style.visibility = anchor.z < 1 ? "visible" : "hidden";
      }
    }
  });

  return (
    <group position={[x, 0, z]}>
      <group ref={group}>
        {parts.map((pt, i) => (
          <mesh key={i} geometry={unitBox} material={mat} position={pt.p} scale={pt.s} castShadow receiveShadow />
        ))}
        <mesh position={[parts[0].p[0], top + 0.02, parts[0].p[2]]} scale={[0.3, 0.12, 0.3]} geometry={unitBox}>
          <meshBasicMaterial ref={crown} toneMapped={false} color="#ffb46a" />
        </mesh>
      </group>
      <mesh position={[parts[0].p[0], top + 20, parts[0].p[2]]}>
        <cylinderGeometry args={[0.05, 0.16, 40, 12, 1, true]} />
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
      <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, 0.04, 0]}>
        <ringGeometry args={[1.6, 1.7, 64]} />
        <meshBasicMaterial color="#ffb46a" transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------- world */

function World({ mobile }: { mobile: boolean }) {
  const { camera, scene } = useThree();
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sky = useRef<THREE.ShaderMaterial>(null);
  const ground = useMemo(() => makeGroundMaterial(), []);
  const look = useRef(new THREE.Vector3(-17, 1, 4));
  const camPos = useRef(new THREE.Vector3(-46, 33, 60));
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
    }),
    [],
  );

  useEffect(() => {
    scene.fog = new THREE.Fog("#efece6", 50, 175);
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  useFrame((state, dt) => {
    const k = 1 - Math.exp(-dt * 3.2);
    p.current += (skyline.p - p.current) * k;
    const pp = p.current;

    // time of day: day -> dusk -> night
    const t1 = smoothstep(0.2, 0.5, pp);
    const t2 = smoothstep(0.52, 0.82, pp);
    const mixC = (out: THREE.Color, key: "top" | "horizon" | "glow" | "sea" | "sun" | "hemiSky" | "hemiGround") =>
      out.copy(PH[0][key]).lerp(PH[1][key], t1).lerp(PH[2][key], t2);
    mixC(tmp.top, "top");
    mixC(tmp.hor, "horizon");
    mixC(tmp.glow, "glow");
    mixC(tmp.sea, "sea");
    mixC(tmp.sun, "sun");
    mixC(tmp.hs, "hemiSky");
    mixC(tmp.hg, "hemiGround");
    tmp.dir.copy(PH[0].sunDir).lerp(PH[1].sunDir, t1).lerp(PH[2].sunDir, t2).normalize();
    const sunI = THREE.MathUtils.lerp(THREE.MathUtils.lerp(PH[0].sunI, PH[1].sunI, t1), PH[2].sunI, t2);
    const hemiI = THREE.MathUtils.lerp(THREE.MathUtils.lerp(PH[0].hemiI, PH[1].hemiI, t1), PH[2].hemiI, t2);

    cityUniforms.uNight.value = smoothstep(0.38, 0.78, pp);
    cityUniforms.uSea.value.copy(tmp.sea);
    cityUniforms.uRise.value = skyline.rise;

    if (sky.current) {
      const u = sky.current.uniforms;
      u.uTop.value.copy(tmp.top);
      u.uHorizon.value.copy(tmp.hor);
      u.uGlow.value.copy(tmp.glow);
      u.uSunDir.value.copy(tmp.dir);
      u.uGlowAmt.value = 0.25 + Math.sin(t1 * Math.PI) * 0.9 * (1 - t2) + t2 * 0.12;
      u.uStars.value = t2;
    }
    if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(tmp.hor);
    if (sun.current) {
      sun.current.color.copy(tmp.sun);
      sun.current.intensity = sunI;
      sun.current.position.set(8, 0, -10).addScaledVector(tmp.dir, 90);
    }
    if (hemi.current) {
      hemi.current.color.copy(tmp.hs);
      hemi.current.groundColor.copy(tmp.hg);
      hemi.current.intensity = hemiI;
    }

    // camera along the path, with a little cursor parallax
    const u = pathParam(pp);
    POS.getPoint(u, tmp.v);
    LOOK.getPoint(u, tmp.l);
    tmp.v.x += pointer.x * 1.6;
    tmp.v.y += pointer.y * 0.9;
    camPos.current.lerp(tmp.v, 1 - Math.exp(-dt * 4));
    look.current.lerp(tmp.l, 1 - Math.exp(-dt * 4));
    camera.position.copy(camPos.current);
    camera.lookAt(look.current);
    if (mobile && camera instanceof THREE.PerspectiveCamera) {
      // portrait screens: pull back so the city still reads
      camera.position.addScaledVector(camera.getWorldDirection(tmp.dir).negate(), 14);
    }
  });

  return (
    <>
      <mesh scale={190} renderOrder={-1}>
        <sphereGeometry args={[1, 48, 24]} />
        <shaderMaterial ref={sky} vertexShader={SKY_VERT} fragmentShader={SKY_FRAG} uniforms={skyUniforms} side={THREE.BackSide} depthWrite={false} fog={false} />
      </mesh>
      <hemisphereLight ref={hemi} args={["#f6f4ef", "#cfc8bb", 1.1]} />
      <directionalLight
        ref={sun}
        castShadow
        position={[50, 70, 40]}
        intensity={2.4}
        shadow-mapSize={mobile ? [1024, 1024] : [2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-radius={5}
        shadow-camera-left={-62}
        shadow-camera-right={62}
        shadow-camera-top={62}
        shadow-camera-bottom={-62}
        shadow-camera-near={1}
        shadow-camera-far={220}
      >
        <object3D attach="target" position={[8, 0, -10]} />
      </directionalLight>
      <mesh rotation-x={-Math.PI / 2} position={[8, 0, -10]} material={ground} receiveShadow>
        <planeGeometry args={[420, 420, 1, 1]} />
      </mesh>
      <City mobile={mobile} />
      {LANDMARKS.map((l, i) => (
        <Tower key={l.slug} l={l} index={i} />
      ))}
    </>
  );
}

export default function SkylineScene({ active }: { active: boolean }) {
  const mobile = typeof window !== "undefined" && window.innerWidth < 768;
  return (
    <Canvas
      shadows="percentage"
      frameloop={active ? "always" : "never"}
      dpr={mobile ? [1, 1.5] : [1, 1.75]}
      camera={{ fov: mobile ? 50 : 32, near: 0.5, far: 420, position: [-46, 33, 60] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.08;
      }}
    >
      <World mobile={mobile} />
    </Canvas>
  );
}
