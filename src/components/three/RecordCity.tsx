"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { clamp, pointer } from "@/lib/motion";

/*
  The DRHP record as a clay model: one district per figure. Completed projects stand as solid white
  towers, ongoing ones are half-built with amber scaffold edges, upcoming ones are ghosted outlines,
  and the plinth under the completed district warms up for the square feet handed over.
  Driven by a 0..1 progress value written by the page (never React state).
*/

export const recordState = { p: 0 };

type Block = { x: number; z: number; w: number; d: number; h: number; t: number };

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function district(count: number, cols: number, cx: number, seed: number, tall: number): Block[] {
  const r = rng(seed);
  const rows = Math.ceil(count / cols);
  const out: Block[] = [];
  for (let i = 0; i < count; i++) {
    const c = i % cols;
    const row = Math.floor(i / cols);
    const w = 0.62 + r() * 0.22;
    const d = 0.62 + r() * 0.22;
    out.push({
      x: cx + (c - (cols - 1) / 2) * 1.05,
      z: (row - (rows - 1) / 2) * 1.05,
      w,
      d,
      h: 0.8 + Math.pow(r(), 1.6) * tall,
      t: i / count,
    });
  }
  return out;
}

const DISTRICTS = {
  completed: district(35, 7, -7.6, 1978, 4.2),
  ongoing: district(17, 5, 0.2, 2025, 4.8),
  upcoming: district(24, 6, 7.4, 2030, 4.4),
};

// progress windows per district
const WIN = { completed: [0.04, 0.34], ongoing: [0.3, 0.6], upcoming: [0.56, 0.84], plate: [0.82, 0.98] } as const;

const ease = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const riseOf = (p: number, [a, b]: readonly [number, number], t: number) => ease((p - (a + (b - a) * t * 0.7)) / ((b - a) * 0.3 + 0.0001));

const unitBox = (() => {
  const g = new THREE.BoxGeometry(1, 1, 1);
  g.translate(0, 0.5, 0);
  return g;
})();
const unitEdges = new THREE.EdgesGeometry(unitBox);

function Solid({ blocks, win, heightShare = 1 }: { blocks: Block[]; win: readonly [number, number]; heightShare?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const sc = useMemo(() => new THREE.Vector3(), []);
  const last = useRef(-1);

  useLayoutEffect(() => {
    last.current = -1;
  }, []);

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const p = recordState.p;
    if (Math.abs(p - last.current) < 0.0005) return;
    last.current = p;
    blocks.forEach((b, i) => {
      const r = riseOf(p, win, b.t);
      v.set(b.x, 0, b.z);
      sc.set(b.w, Math.max(0.001, b.h * heightShare * r), b.d);
      m.compose(v, q, sc);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[unitBox, undefined, blocks.length]} castShadow receiveShadow frustumCulled={false}>
      <meshStandardMaterial color="#f6f4ef" roughness={0.88} />
    </instancedMesh>
  );
}

function Outline({ b, win, color, opacity }: { b: Block; win: readonly [number, number]; color: string; opacity: number }) {
  const ref = useRef<THREE.LineSegments>(null);
  const mat = useRef<THREE.LineBasicMaterial>(null);
  useFrame(() => {
    const r = riseOf(recordState.p, win, b.t);
    if (ref.current) ref.current.scale.set(b.w, Math.max(0.001, b.h * r), b.d);
    if (mat.current) mat.current.opacity = opacity * clamp(r * 1.4);
  });
  return (
    <lineSegments ref={ref} position={[b.x, 0, b.z]} geometry={unitEdges}>
      <lineBasicMaterial ref={mat} color={color} transparent opacity={0} depthWrite={false} toneMapped={false} />
    </lineSegments>
  );
}

function Plate() {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const edge = useRef<THREE.LineBasicMaterial>(null);
  const cool = useMemo(() => new THREE.Color("#e8e4dc"), []);
  const warm = useMemo(() => new THREE.Color("#f5c992"), []);
  useFrame(() => {
    const t = ease((recordState.p - WIN.plate[0]) / (WIN.plate[1] - WIN.plate[0]));
    if (mat.current) {
      mat.current.color.copy(cool).lerp(warm, t);
      mat.current.emissive.copy(warm).multiplyScalar(t * 0.25);
    }
    if (edge.current) edge.current.opacity = t;
  });
  return (
    <group position={[-7.6, 0, 0]}>
      <mesh position={[0, -0.04, 0]} receiveShadow>
        <boxGeometry args={[7.9, 0.08, 5.7]} />
        <meshStandardMaterial ref={mat} color="#e8e4dc" roughness={0.95} />
      </mesh>
      <lineSegments position={[0, -0.04, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(7.9, 0.08, 5.7)]} />
        <lineBasicMaterial ref={edge} color="#f2a65a" transparent opacity={0} toneMapped={false} />
      </lineSegments>
    </group>
  );
}

function Rig() {
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame((state, dt) => {
    const p = recordState.p;
    const ang = -0.55 + p * 0.9 + pointer.x * 0.12;
    const r = 23 - p * 3;
    target.set(Math.sin(ang) * r, 12.5 - p * 2 + pointer.y * 0.8, Math.cos(ang) * r);
    state.camera.position.lerp(target, 1 - Math.exp(-dt * 3));
    state.camera.lookAt(0, 1.2, 0);
  });
  return null;
}

export default function RecordCity({ active }: { active: boolean }) {
  const mobile = typeof window !== "undefined" && window.innerWidth < 768;
  return (
    <Canvas
      shadows
      frameloop={active ? "always" : "never"}
      dpr={mobile ? [1, 1.5] : [1, 1.75]}
      camera={{ fov: mobile ? 52 : 34, position: [-12, 12, 20], near: 0.5, far: 200 }}
      gl={{ antialias: true }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        scene.background = new THREE.Color("#eeebe5");
        scene.fog = new THREE.Fog("#eeebe5", 30, 60);
      }}
    >
      <hemisphereLight args={["#ffffff", "#d9d4ca", 1.5]} />
      <directionalLight
        castShadow
        position={[10, 18, 8]}
        intensity={2.1}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0004}
      />
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.09, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#ebe8e2" roughness={1} />
      </mesh>
      <Plate />
      <Solid blocks={DISTRICTS.completed} win={WIN.completed} />
      <Solid blocks={DISTRICTS.ongoing} win={WIN.ongoing} heightShare={0.55} />
      {DISTRICTS.ongoing.map((b, i) => (
        <Outline key={`o${i}`} b={b} win={WIN.ongoing} color="#d9822f" opacity={0.95} />
      ))}
      {DISTRICTS.upcoming.map((b, i) => (
        <Outline key={`u${i}`} b={b} win={WIN.upcoming} color="#3b5bdb" opacity={0.55} />
      ))}
      <Rig />
    </Canvas>
  );
}
