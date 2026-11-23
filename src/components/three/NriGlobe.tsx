"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";

export type GlobeCity = { name: string; lat: number; lon: number };

/** Mutable bridge between the DOM controls and the scene (read inside useFrame, never React state). */
export type GlobeBridge = {
  /** index into cities of the selected one (Mumbai is the hub at index 0) */
  selected: number;
  /** user drag offset, radians */
  dragX: number;
  dragY: number;
  dragging: boolean;
  /** DOM labels, positioned per frame (index = cities index) */
  labels: Array<HTMLElement | null>;
};

const D2R = Math.PI / 180;
const v3 = (lat: number, lon: number, r = 1) =>
  new THREE.Vector3(Math.cos(lat * D2R) * Math.sin(lon * D2R) * r, Math.sin(lat * D2R) * r, Math.cos(lat * D2R) * Math.cos(lon * D2R) * r);

/* ---------------------------------------------------------------- shaders */

const DOT_VERT = /* glsl */ `
attribute float aNear;
uniform float uSize;
uniform float uPx;
varying float vFacing;
varying float vNear;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec3 n = normalize(normalMatrix * position);
  vFacing = n.z;
  vNear = aNear;
  gl_PointSize = uSize * uPx * (0.55 + 0.45 * max(n.z, 0.0)) * (1.0 + aNear * 0.6);
  gl_Position = projectionMatrix * mv;
}
`;
const DOT_FRAG = /* glsl */ `
varying float vFacing;
varying float vNear;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float edge = 1.0 - smoothstep(0.32, 0.5, d);
  float face = smoothstep(-0.12, 0.35, vFacing);
  vec3 stone = vec3(0.93, 0.92, 0.90);
  vec3 amber = vec3(0.95, 0.65, 0.35);
  vec3 col = mix(stone, amber, vNear);
  gl_FragColor = vec4(col, edge * face * (0.55 + 0.45 * vNear));
}
`;

const BODY_VERT = /* glsl */ `
varying vec3 vN;
void main(){
  vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const BODY_FRAG = /* glsl */ `
varying vec3 vN;
void main(){
  float rim = pow(1.0 - max(vN.z, 0.0), 2.4);
  vec3 base = vec3(0.075, 0.085, 0.10);
  vec3 dusk = vec3(0.23, 0.36, 0.86);
  gl_FragColor = vec4(base + dusk * rim * 0.32, 1.0);
}
`;
const HALO_FRAG = /* glsl */ `
varying vec3 vN;
void main(){
  float a = pow(max(1.0 - abs(vN.z), 0.0), 5.0) * 0.55;
  gl_FragColor = vec4(vec3(0.30, 0.42, 0.95) * a, a);
}
`;

const ARC_VERT = /* glsl */ `
varying float vT;
void main(){
  vT = uv.x;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const ARC_FRAG = /* glsl */ `
uniform float uTime;
uniform float uActive;
uniform float uOffset;
varying float vT;
void main(){
  float head = fract(uTime * 0.32 + uOffset);
  float trail = smoothstep(head - 0.28, head, vT) * step(vT, head);
  float base = 0.18 + 0.32 * uActive;
  float a = base + trail * (0.5 + 0.9 * uActive);
  vec3 col = mix(vec3(0.95, 0.65, 0.35), vec3(1.0, 0.86, 0.66), trail);
  gl_FragColor = vec4(col * a, a);
}
`;

/* ---------------------------------------------------------------- scene */

function Globe({ cities, bridgeRef, lite, reduced }: { cities: GlobeCity[]; bridgeRef: RefObject<GlobeBridge>; lite: boolean; reduced: boolean }) {
  const { camera, size } = useThree();
  const group = useRef<THREE.Group>(null);
  const [dots, setDots] = useState<THREE.BufferGeometry | null>(null);
  const rot = useRef({ x: 0.33, y: -1.27 });
  const arcMats = useRef<THREE.ShaderMaterial[]>([]);
  const pulse = useRef<Array<THREE.Mesh | null>>([]);
  const tmpRef = useRef({ v: new THREE.Vector3(), w: new THREE.Vector3() });
  const hub = cities[0];

  // land dots, tinted amber near Mumbai
  useEffect(() => {
    let alive = true;
    fetch("/data/globe-dots.json")
      .then((r) => r.json())
      .then((d: { pts: number[] }) => {
        if (!alive) return;
        const stride = lite ? 2 : 1;
        const pos: number[] = [];
        const near: number[] = [];
        const h = v3(hub.lat, hub.lon);
        for (let i = 0; i < d.pts.length; i += 2 * stride) {
          const p = v3(d.pts[i] / 10, d.pts[i + 1] / 10, 1.002);
          pos.push(p.x, p.y, p.z);
          const ang = p.clone().normalize().angleTo(h);
          near.push(Math.exp(-(ang * ang) / 0.035));
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute("aNear", new THREE.Float32BufferAttribute(near, 1));
        setDots(g);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [hub.lat, hub.lon, lite]);

  const [dotMat] = useState(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: DOT_VERT,
        fragmentShader: DOT_FRAG,
        uniforms: { uSize: { value: lite ? 3.4 : 2.8 }, uPx: { value: Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 2) } },
        transparent: true,
        depthWrite: false,
      }),
  );

  // great-circle arcs from every city to Mumbai
  const arcs = useMemo(() => {
    const b = v3(hub.lat, hub.lon);
    return cities.slice(1).map((c) => {
      const a = v3(c.lat, c.lon);
      const ang = a.angleTo(b);
      const lift = 0.06 + 0.32 * (ang / Math.PI);
      const pts: THREE.Vector3[] = [];
      const q = new THREE.Quaternion();
      const axis = new THREE.Vector3().crossVectors(a, b).normalize();
      for (let i = 0; i <= 64; i++) {
        const t = i / 64;
        q.setFromAxisAngle(axis, ang * t);
        pts.push(a.clone().applyQuaternion(q).multiplyScalar(1.004 + lift * Math.sin(Math.PI * t)));
      }
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 96, lite ? 0.006 : 0.0045, 6, false);
    });
  }, [cities, hub.lat, hub.lon, lite]);

  useEffect(
    () => () => {
      arcs.forEach((g) => g.dispose());
      dots?.dispose();
    },
    [arcs, dots],
  );

  useFrame((state, dt) => {
    const g = group.current;
    const bridge = bridgeRef.current;
    const tmp = tmpRef.current;
    if (!g || !bridge) return;
    // focus the midpoint between the selected city and Mumbai
    const sel = cities[bridge.selected] ?? hub;
    tmp.v.copy(v3(sel.lat, sel.lon)).add(v3(hub.lat, hub.lon)).normalize();
    const fLat = Math.asin(tmp.v.y);
    const fLon = Math.atan2(tmp.v.x, tmp.v.z);
    const tx = THREE.MathUtils.clamp(fLat + bridge.dragX, -0.9, 0.9);
    if (!reduced && !bridge.dragging) bridge.dragY -= dt * 0.02; // slow drift
    let ty = bridge.dragY - fLon;
    // shortest way round
    while (ty - rot.current.y > Math.PI) ty -= Math.PI * 2;
    while (ty - rot.current.y < -Math.PI) ty += Math.PI * 2;
    const k = reduced ? 1 : 1 - Math.exp(-dt * (bridge.dragging ? 14 : 2.6));
    rot.current.x += (tx - rot.current.x) * k;
    rot.current.y += (ty - rot.current.y) * k;
    g.rotation.set(rot.current.x, rot.current.y, 0, "XYZ");

    const time = state.clock.elapsedTime;
    arcMats.current.forEach((m, i) => {
      if (!m) return;
      m.uniforms.uTime.value = reduced ? 0.7 : time;
      const want = i + 1 === bridge.selected ? 1 : 0;
      m.uniforms.uActive.value += (want - m.uniforms.uActive.value) * Math.min(1, dt * 5);
    });
    pulse.current.forEach((m, i) => {
      if (!m) return;
      const t = (time * 0.6 + i * 0.21) % 1;
      const big = i === 0 || i === bridge.selected;
      m.scale.setScalar((big ? 1 : 0.6) * (1 + t * 3));
      (m.material as THREE.MeshBasicMaterial).opacity = (1 - t) * (big ? 0.8 : 0.35);
    });

    // DOM labels
    cities.forEach((c, i) => {
      const el = bridge.labels[i];
      if (!el) return;
      tmp.w.copy(v3(c.lat, c.lon, 1.02)).applyMatrix4(g.matrixWorld);
      const facing = tmp.w.clone().normalize().dot(tmp.v.copy(camera.position).normalize());
      tmp.w.project(camera);
      const x = (tmp.w.x * 0.5 + 0.5) * size.width;
      const y = (-tmp.w.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -130%)`;
      const show = THREE.MathUtils.smoothstep(facing, 0.05, 0.35);
      el.style.opacity = String(show);
    });
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[1, 64, 48]} />
        <shaderMaterial vertexShader={BODY_VERT} fragmentShader={BODY_FRAG} />
      </mesh>
      <mesh scale={1.07}>
        <sphereGeometry args={[1, 48, 32]} />
        <shaderMaterial vertexShader={BODY_VERT} fragmentShader={HALO_FRAG} side={THREE.BackSide} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {dots && <points geometry={dots} material={dotMat} />}
      {arcs.map((geo, i) => (
        <mesh key={i} geometry={geo}>
          <shaderMaterial
            ref={(m: THREE.ShaderMaterial | null) => {
              if (m) arcMats.current[i] = m;
            }}
            vertexShader={ARC_VERT}
            fragmentShader={ARC_FRAG}
            uniforms={{ uTime: { value: 0 }, uActive: { value: 0 }, uOffset: { value: i * 0.17 } }}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
      {cities.map((c, i) => {
        const p = v3(c.lat, c.lon, 1.006);
        const look = p.clone().multiplyScalar(2);
        return (
          <group key={c.name} position={p}>
            <mesh>
              <sphereGeometry args={[i === 0 ? 0.022 : 0.014, 16, 12]} />
              <meshBasicMaterial color={i === 0 ? "#ffd29a" : "#f2a65a"} toneMapped={false} />
            </mesh>
            <mesh
              ref={(m: THREE.Mesh | null) => {
                pulse.current[i] = m;
                if (m) m.lookAt(look);
              }}
            >
              <ringGeometry args={[0.02, 0.026, 40]} />
              <meshBasicMaterial color="#f2a65a" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** Drag-to-spin wrapper; pauses rendering when the globe is off screen. */
export default function NriGlobe({ cities, bridgeRef }: { cities: GlobeCity[]; bridgeRef: RefObject<GlobeBridge> }) {
  const host = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [env] = useState(() => ({
    lite: typeof window !== "undefined" && window.innerWidth < 768,
    reduced: typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  }));

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "120px" });
    io.observe(el);
    let last: { x: number; y: number } | null = null;
    const bridge = bridgeRef.current;
    const down = (e: PointerEvent) => {
      last = { x: e.clientX, y: e.clientY };
      bridge.dragging = true;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!last) return;
      const w = el.clientWidth || 1;
      bridge.dragY += ((e.clientX - last.x) / w) * Math.PI;
      bridge.dragX += ((e.clientY - last.y) / w) * Math.PI * 0.6;
      bridge.dragX = THREE.MathUtils.clamp(bridge.dragX, -0.8, 0.8);
      last = { x: e.clientX, y: e.clientY };
    };
    const up = () => {
      last = null;
      bridge.dragging = false;
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      io.disconnect();
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [bridgeRef]);

  return (
    <div ref={host} className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing">
      <Canvas
        frameloop={active ? "always" : "never"}
        dpr={env.lite ? [1, 1.5] : [1, 2]}
        camera={{ fov: 30, position: [0, 0, 4.9], near: 0.1, far: 20 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Globe cities={cities} bridgeRef={bridgeRef} lite={env.lite} reduced={env.reduced} />
      </Canvas>
    </div>
  );
}
