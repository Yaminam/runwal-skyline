"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { prefersReducedMotion } from "@/lib/motion";

/*
  The enquiry companion: an architect's model of the chosen residence on a turntable.
  It is built floor by floor (white clay floor plates, dark glass between), then reacts to the form:
   - choosing a home type and budget lights "your" band of floors in amber
   - the visit time moves the sun (morning, afternoon, golden evening)
   - typing your name switches the windows on, one by one
   - on success every light comes on and the crown beacon glows
*/

export type Form = "twin" | "stepped" | "slab" | "cluster";

export const FORMS: Record<string, Form> = {
  "runwal-malabar": "stepped",
  "runwal-raaya": "twin",
  "runwal-timeless": "cluster",
  "runwal-rare": "slab",
  "runwal-auris": "stepped",
  "runwal-sanctuary": "cluster",
  "runwal-one": "twin",
  "runwal-zenith": "slab",
  "runwal-lands-end": "cluster",
  "runwal-the-central-park": "twin",
  "r-square-andheri": "slab",
  "r-square-mulund": "twin",
};

export type ModelProps = {
  slug: string | null;
  floors: number;
  /** highlighted band, as a fraction of the height [from, to], or null */
  band: [number, number] | null;
  /** visit hour (e.g. 10, 16.5) or null when not chosen yet */
  hour: number | null;
  /** 0..1 how many windows are on */
  lights: number;
  /** success: everything on, beacon lit */
  done?: boolean;
};

type Volume = { x: number; z: number; w: number; d: number; floors: number; setback?: boolean };

const HEIGHT = 3.1;

function volumes(form: Form, n: number): Volume[] {
  switch (form) {
    case "twin":
      return [
        { x: -0.42, z: 0, w: 0.62, d: 0.62, floors: n },
        { x: 0.44, z: 0.12, w: 0.62, d: 0.62, floors: Math.round(n * 0.88) },
      ];
    case "stepped":
      return [{ x: 0, z: 0, w: 0.95, d: 0.95, floors: n, setback: true }];
    case "cluster":
      return [
        { x: 0, z: -0.4, w: 0.56, d: 0.56, floors: n },
        { x: -0.56, z: 0.36, w: 0.56, d: 0.56, floors: Math.round(n * 0.82) },
        { x: 0.58, z: 0.32, w: 0.56, d: 0.56, floors: Math.round(n * 0.68) },
      ];
    default:
      return [{ x: 0, z: 0, w: 1.4, d: 0.6, floors: n }];
  }
}

type FloorRef = { v: number; i: number; frac: number; x: number; z: number; w: number; d: number; y: number; seed: number };

function hash(i: number) {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function Tower({ slug, floors, band, hour, lights, done }: ModelProps & { slug: string }) {
  const form = FORMS[slug] ?? "slab";
  const n = Math.max(8, Math.min(60, floors || 30));
  const fh = HEIGHT / n;
  const slabT = Math.min(0.03, fh * 0.32);
  const reduced = useMemo(() => prefersReducedMotion(), []);

  const list = useMemo<FloorRef[]>(() => {
    const out: FloorRef[] = [];
    volumes(form, n).forEach((v, vi) => {
      for (let i = 0; i < v.floors; i++) {
        const frac = i / n;
        const k = v.setback ? (frac < 0.62 ? 1 : frac < 0.86 ? 0.8 : 0.58) : 1;
        out.push({ v: vi, i, frac, x: v.x, z: v.z, w: v.w * k, d: v.d * k, y: i * fh, seed: hash(out.length + vi * 97) });
      }
    });
    return out;
  }, [form, n, fh]);

  const box = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    g.translate(0, 0.5, 0);
    return g;
  }, []);
  const slabMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f6f4ef", roughness: 0.85 }), []);
  const glassMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.25, metalness: 0.1 });
    // instance colour drives emission only; the glass itself stays a dark blue-grey
    m.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <color_fragment>", "diffuseColor = vec4(0.16, 0.19, 0.24, diffuseColor.a);")
        .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n#ifdef USE_COLOR\ntotalEmissiveRadiance += vColor.rgb;\n#endif");
    };
    return m;
  }, []);

  const slabs = useRef<THREE.InstancedMesh>(null);
  const glass = useRef<THREE.InstancedMesh>(null);
  const crown = useRef<THREE.Mesh>(null);
  const beam = useRef<THREE.Mesh>(null);
  const beacon = useRef<THREE.PointLight>(null);
  const rise = useRef(reduced ? 1 : 0);
  const hl = useMemo(() => new Float32Array(list.length), [list]);
  const lit = useMemo(() => new Float32Array(list.length), [list]);
  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const scl = useMemo(() => new THREE.Vector3(), []);
  const col = useMemo(() => new THREE.Color(), []);
  const tops = useMemo(() => {
    let best = list[0];
    for (const f of list) if (f.y > best.y) best = f;
    return best;
  }, [list]);

  useEffect(() => {
    rise.current = reduced ? 1 : 0;
  }, [slug, reduced]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    // construction: floors appear from the ground up
    rise.current = Math.min(1, rise.current + dt * 0.55);
    const built = (1 - Math.pow(1 - rise.current, 2.2)) * (n + 1);
    const sm = slabs.current;
    const gm = glass.current;
    if (!sm || !gm) return;
    const want = done ? 1 : lights;
    list.forEach((f, k) => {
      const grow = Math.min(1, Math.max(0, built - f.i));
      // slab
      pos.set(f.x, f.y, f.z);
      scl.set(f.w * 1.06, slabT * Math.max(0.001, grow), f.d * 1.06);
      m4.compose(pos, q, scl);
      sm.setMatrixAt(k, m4);
      // glass storey
      pos.set(f.x, f.y + slabT, f.z);
      scl.set(f.w * 0.94, Math.max(0.001, (fh - slabT) * grow), f.d * 0.94);
      m4.compose(pos, q, scl);
      gm.setMatrixAt(k, m4);

      // your floors
      const inBand = band ? f.frac >= band[0] && f.frac <= band[1] : false;
      hl[k] += ((inBand ? 1 : 0) - hl[k]) * Math.min(1, dt * (3 + f.seed * 4));
      // lights: each window has its own switch-on point
      const on = done ? 1 : f.seed < want * 0.92 ? 1 : 0;
      lit[k] += (on - lit[k]) * Math.min(1, dt * (4 + f.seed * 9));
      const flick = lit[k] > 0.02 && lit[k] < 0.95 ? 0.55 + 0.45 * Math.abs(Math.sin(t * 38 + k)) : 1;
      // every room a little different: some bright, some lamp-dim
      const L = lit[k] * flick * (0.35 + 0.65 * hash(k * 3.7 + 11));
      const H = hl[k];
      col.setRGB(1.15 * L + 0.85 * H * (1 - L * 0.5), 0.74 * L + 0.42 * H * (1 - L * 0.5), 0.4 * L + 0.12 * H * (1 - L * 0.5));
      gm.setColorAt(k, col);
      col.setRGB(1, 1 - 0.3 * H, 1 - 0.6 * H);
      sm.setColorAt(k, col);
    });
    sm.instanceMatrix.needsUpdate = true;
    gm.instanceMatrix.needsUpdate = true;
    if (sm.instanceColor) sm.instanceColor.needsUpdate = true;
    if (gm.instanceColor) gm.instanceColor.needsUpdate = true;

    const top = tops.y + fh;
    const ready = rise.current > 0.98 ? 1 : 0;
    if (crown.current) {
      crown.current.position.set(tops.x, top * Math.min(1, built / (n + 1)) + 0.02, tops.z);
      const mat = crown.current.material as THREE.MeshBasicMaterial;
      const pulse = done ? 0.7 + 0.3 * Math.sin(t * 3) : 0.25;
      mat.color.setRGB(1, 0.72, 0.4).multiplyScalar((0.3 + pulse * 2.2) * ready);
    }
    if (beam.current) {
      beam.current.position.set(tops.x, top + 2, tops.z);
      (beam.current.material as THREE.MeshBasicMaterial).opacity = done ? (0.35 + 0.15 * Math.sin(t * 3)) * ready : 0;
    }
    if (beacon.current) {
      beacon.current.position.set(tops.x, top + 0.25, tops.z);
      beacon.current.intensity = done ? 2.2 * ready : 0;
    }
  });

  return (
    <group>
      <instancedMesh ref={slabs} args={[box, slabMat, list.length]} castShadow receiveShadow frustumCulled={false} />
      <instancedMesh ref={glass} args={[box, glassMat, list.length]} castShadow frustumCulled={false} />
      <mesh ref={crown} scale={[0.14, 0.06, 0.14]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} color="#f2a65a" />
      </mesh>
      <mesh ref={beam}>
        <cylinderGeometry args={[0.025, 0.07, 4, 10, 1, true]} />
        <meshBasicMaterial color="#ffb46a" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <pointLight ref={beacon} color="#ffb46a" intensity={0} distance={4} />
      {/* initial colours so instanceColor exists before the first frame */}
      <InitColors slabs={slabs} glass={glass} count={list.length} />
      {/* light the scene from the visit hour */}
      <Sun hour={hour} dim={done ? 0.85 : lights * 0.55} />
    </group>
  );
}

function InitColors({ slabs, glass, count }: { slabs: React.RefObject<THREE.InstancedMesh | null>; glass: React.RefObject<THREE.InstancedMesh | null>; count: number }) {
  useEffect(() => {
    const c = new THREE.Color(0, 0, 0);
    const w = new THREE.Color(1, 1, 1);
    for (let i = 0; i < count; i++) {
      slabs.current?.setColorAt(i, w);
      glass.current?.setColorAt(i, c);
    }
  }, [slabs, glass, count]);
  return null;
}

function Sun({ hour, dim }: { hour: number | null; dim: number }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const target = useMemo(() => new THREE.Vector3(), []);
  const c = useMemo(() => new THREE.Color(), []);
  useFrame((_, dt) => {
    const h = hour ?? 12.5;
    // sun travels east (+x) to west (-x); lower and warmer towards evening
    const u = Math.min(1, Math.max(0, (h - 6) / 13));
    const az = Math.PI * u;
    const el = Math.max(0.12, Math.sin(Math.PI * u) * 1.05);
    target.set(Math.cos(az) * 6, el * 6, 3.2);
    const l = light.current;
    if (l) {
      l.position.lerp(target, Math.min(1, dt * 2.5));
      c.set(h < 11 ? "#fff0da" : h < 15 ? "#ffffff" : h < 17 ? "#ffd49c" : "#ff9a5a");
      l.color.lerp(c, Math.min(1, dt * 2.5));
      const base = h < 17 ? 2.6 : 1.9;
      l.intensity += (base * (1 - dim) - l.intensity) * Math.min(1, dt * 2.5);
    }
    if (hemi.current) hemi.current.intensity += ((1.05 - dim * 0.75) - hemi.current.intensity) * Math.min(1, dt * 2.5);
  });
  return (
    <>
      <hemisphereLight ref={hemi} args={["#dfe6ff", "#3a3a40", 1]} />
      <directionalLight
        ref={light}
        position={[3, 6, 3.2]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={4}
        shadow-camera-bottom={-1}
        shadow-bias={-0.0005}
      />
    </>
  );
}

function Turntable({ children }: { children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  const reduced = useMemo(() => prefersReducedMotion(), []);
  useFrame((state, dt) => {
    if (!g.current) return;
    if (!reduced) g.current.rotation.y += dt * 0.18;
    const tilt = state.pointer.y * 0.06;
    g.current.rotation.x += (tilt - g.current.rotation.x) * Math.min(1, dt * 2);
  });
  return <group ref={g}>{children}</group>;
}

function Plinth({ done }: { done?: boolean }) {
  const ring = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((state) => {
    if (ring.current) ring.current.opacity = done ? 0.55 + 0.25 * Math.sin(state.clock.elapsedTime * 3) : 0.14;
  });
  return (
    <group>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <cylinderGeometry args={[1.55, 1.6, 0.1, 64]} />
        <meshStandardMaterial color="#e9e6df" roughness={0.9} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, 0]}>
        <ringGeometry args={[1.42, 1.46, 96]} />
        <meshBasicMaterial ref={ring} color="#f2a65a" transparent opacity={0.14} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Before a residence is chosen: an outlined plot waiting for its building. */
function Placeholder() {
  const m = useRef<THREE.LineBasicMaterial>(null);
  const geo = useMemo(() => {
    const g = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, HEIGHT, 1));
    g.translate(0, HEIGHT / 2, 0);
    return g;
  }, []);
  useFrame((state) => {
    if (m.current) m.current.opacity = 0.25 + 0.15 * Math.sin(state.clock.elapsedTime * 1.6);
  });
  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial ref={m} color="#f2a65a" transparent opacity={0.3} />
    </lineSegments>
  );
}

export default function EnquireModel(props: ModelProps) {
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.75]}
      camera={{ fov: 30, position: [4.6, 3.6, 6.2], near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl, camera }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        camera.lookAt(0, 1.45, 0);
      }}
    >
      <Turntable>
        <Plinth done={props.done} />
        {props.slug ? <Tower key={props.slug} {...props} slug={props.slug} /> : <Placeholder />}
      </Turntable>
      {!props.slug && <Sun hour={null} dim={0} />}
    </Canvas>
  );
}
