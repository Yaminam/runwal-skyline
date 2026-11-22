"use client";

import { ContactShadows, OrbitControls } from "@react-three/drei";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

export type Band = { label: string; detail: string; from: number; to: number; residential: boolean };

type Props = {
  floors: number;
  bands: Band[];
  hovered: number | null;
  selected: number | null;
  activeBand: number | null;
  night: boolean;
  wide?: boolean;
  onHover: (floor: number | null) => void;
  onSelect: (floor: number) => void;
};

const H = 13; // model height in world units, whatever the storey count

function hash(n: number) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

function Tower({ floors, bands, hovered, selected, activeBand, night, wide, onHover, onSelect }: Props) {
  const fh = H / floors;
  const w = wide ? 5.2 : 4;
  const d = wide ? 3.8 : 3;

  const mats = useMemo(
    () => ({
      slab: new THREE.MeshStandardMaterial({ color: "#fbfaf7", roughness: 0.85 }),
      glass: new THREE.MeshStandardMaterial({ color: "#c9d2dc", roughness: 0.25, metalness: 0.1 }),
      glassNight: new THREE.MeshStandardMaterial({ color: "#1a1f2a", roughness: 0.3, emissive: new THREE.Color("#ffc48a"), emissiveIntensity: 0 }),
      band: new THREE.MeshStandardMaterial({ color: "#b4c2f2", roughness: 0.4, emissive: new THREE.Color("#3b5bdb"), emissiveIntensity: 0.32 }),
      hot: new THREE.MeshStandardMaterial({ color: "#f2a65a", roughness: 0.35, emissive: new THREE.Color("#f2a65a"), emissiveIntensity: 1.1 }),
      core: new THREE.MeshStandardMaterial({ color: "#e9e6df", roughness: 0.9 }),
    }),
    [],
  );
  const litNight = useMemo(() => {
    const m = mats.glassNight.clone();
    m.emissiveIntensity = 0.32;
    return m;
  }, [mats]);

  const bandOf = (f: number) => bands.findIndex((b) => f >= b.from && f <= b.to);

  return (
    <group>
      {/* podium plinth */}
      <mesh position={[0, -0.12, 0]} receiveShadow>
        <boxGeometry args={[w * 2.2, 0.24, d * 2.4]} />
        <primitive object={mats.core} attach="material" />
      </mesh>
      {Array.from({ length: floors }, (_, i) => {
        const f = i + 1;
        const setback = f > floors * 0.86 ? 0.86 : 1;
        const y = i * fh;
        const b = bandOf(f);
        const isHot = f === hovered || f === selected;
        const inBand = activeBand !== null && b === activeBand;
        const glass = isHot ? mats.hot : inBand ? mats.band : night ? (hash(f) > 0.35 ? litNight : mats.glassNight) : mats.glass;
        return (
          <group key={f} position={[0, y, 0]}>
            <mesh position={[0, fh * 0.09, 0]} castShadow receiveShadow material={mats.slab}>
              <boxGeometry args={[w * setback + 0.18, fh * 0.18, d * setback + 0.18]} />
            </mesh>
            <mesh
              position={[0, fh * 0.18 + fh * 0.41, 0]}
              material={glass}
              castShadow
              onPointerMove={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation();
                if (hovered !== f) onHover(f);
              }}
              onPointerOut={() => onHover(null)}
              onClick={(e: ThreeEvent<MouseEvent>) => {
                e.stopPropagation();
                onSelect(f);
              }}
            >
              <boxGeometry args={[w * setback * 0.97, fh * 0.82, d * setback * 0.97]} />
            </mesh>
          </group>
        );
      })}
      {/* crown */}
      <mesh position={[0, H + fh * 0.4, 0]} castShadow material={mats.slab}>
        <boxGeometry args={[w * 0.86 + 0.3, fh * 0.8, d * 0.86 + 0.3]} />
      </mesh>
      {/* vertical fins, one per corner, read as the structure of the facade */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (w / 2 + 0.05), (H * 0.86) / 2, sz * (d / 2 + 0.05)]} castShadow material={mats.slab}>
            <boxGeometry args={[0.12, H * 0.86, 0.12]} />
          </mesh>
        )),
      )}
    </group>
  );
}

export default function TowerExplorer(props: Props & { active: boolean }) {
  const { night, active } = props;
  return (
    <Canvas
      shadows="percentage"
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ fov: 28, position: [25, H * 0.78, 28], near: 0.5, far: 200 }}
      gl={{ antialias: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
      }}
      onPointerMissed={() => props.onHover(null)}
    >
      <color attach="background" args={[night ? "#0d1015" : "#eeebe5"]} />
      <fog attach="fog" args={[night ? "#0d1015" : "#eeebe5", 45, 90]} />
      <hemisphereLight args={[night ? "#4a5478" : "#ffffff", night ? "#0a0b0e" : "#d9d4ca", night ? 0.7 : 1.5]} />
      <directionalLight
        castShadow
        position={night ? [-8, 20, -6] : [10, 22, 8]}
        intensity={night ? 0.35 : 2.2}
        color={night ? "#a9b6dc" : "#fffaf2"}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={18}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0004}
      />
      <Tower {...props} />
      <ContactShadows position={[0, 0.005, 0]} opacity={night ? 0.6 : 0.35} scale={30} blur={2.6} far={14} />
      <OrbitControls
        target={[0, H * 0.46, 0]}
        enablePan={false}
        enableZoom={false}
        autoRotate={props.hovered === null && props.selected === null}
        autoRotateSpeed={0.55}
        enableDamping
        minPolarAngle={Math.PI * 0.22}
        maxPolarAngle={Math.PI * 0.5}
      />
    </Canvas>
  );
}
