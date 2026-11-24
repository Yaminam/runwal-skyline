"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { clamp, pointer, prefersReducedMotion } from "@/lib/motion";
import { BANDS, FLOORS, PER, groupOf, record, type BandPoint, type RecordGroup } from "./record-state";

/*
  The tower of the record: 19 floors, 4 windows per face, one window column per Runwal project.
  Completed floors: dark glass with warm lit windows (some curtained). Under way: exposed slabs,
  corner columns, a scaffold cage, a hoist and a blinking work light. Upcoming: ghost glass with
  dusk-blue blueprint edges, under a slowly swinging tower crane. Built bottom-up by record.p.
  All three.js objects live at module scope (built once), so frame updates never touch React state.
*/

const W = 4; // footprint
const H = 0.92; // storey
const BASE = 1.3; // podium height
const TOP = BASE + FLOORS * H;

type Floor = {
  group: THREE.Group;
  rise: number;
  kinds: RecordGroup[]; // per column
  winMat: THREE.MeshBasicMaterial | null;
  ghostMat: THREE.MeshStandardMaterial | null;
  edgeMat: THREE.LineBasicMaterial | null;
  work: THREE.Mesh | null;
};

type Scene = {
  crane: THREE.Group;
  rail: THREE.Mesh;
  root: THREE.Group;
  spin: THREE.Group;
  floors: Floor[];
  jib: THREE.Group;
  tip: THREE.MeshBasicMaterial;
  hoist: THREE.Mesh;
  glow: THREE.MeshBasicMaterial;
};

let SCENE: Scene | null = null;

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, "rgba(242,166,90,0.55)");
  grd.addColorStop(0.45, "rgba(242,166,90,0.16)");
  grd.addColorStop(1, "rgba(242,166,90,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

function build(): Scene {
  const r = rng(1978);
  const root = new THREE.Group();
  const spin = new THREE.Group();
  root.add(spin);

  // podium and ground glow
  const concrete = new THREE.MeshStandardMaterial({ color: "#3a3f48", roughness: 0.9 });
  const podium = new THREE.Mesh(new THREE.BoxGeometry(W + 2.4, BASE, W + 2.4), concrete);
  podium.position.y = BASE / 2;
  spin.add(podium);
  const lobby = new THREE.Mesh(new THREE.BoxGeometry(W - 0.6, BASE * 0.62, 0.05), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.72, 0.42), toneMapped: false }));
  lobby.position.set(0, BASE * 0.36, (W + 2.4) / 2 + 0.03);
  spin.add(lobby);
  const glow = new THREE.MeshBasicMaterial({ map: glowTexture(), transparent: true, depthWrite: false, toneMapped: false });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(15, 15), glow);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0.01;
  root.add(ground);

  const slabMat = new THREE.MeshStandardMaterial({ color: "#8d8a84", roughness: 0.85 });
  const glassMat = new THREE.MeshStandardMaterial({ color: "#151a22", roughness: 0.22, metalness: 0.55 });
  const columnMat = new THREE.MeshStandardMaterial({ color: "#6f6c67", roughness: 0.9 });
  const scaffoldMat = new THREE.LineBasicMaterial({ color: "#8f99ad", transparent: true, opacity: 0.75 });
  const slabGeo = new THREE.BoxGeometry(W + 0.25, 0.12, W + 0.25);
  const winGeo = new THREE.PlaneGeometry(W / PER - 0.26, H * 0.6);

  const floors: Floor[] = [];
  for (let f = 0; f < FLOORS; f++) {
    const group = new THREE.Group();
    group.position.y = BASE + f * H;
    const kinds = Array.from({ length: PER }, (_, c) => groupOf(f * PER + c));
    const hasDone = kinds.includes("done");
    const allNext = kinds.every((k) => k === "next");
    const hasNow = kinds.includes("now");

    let winMat: THREE.MeshBasicMaterial | null = null;
    let ghostMat: THREE.MeshStandardMaterial | null = null;
    let edgeMat: THREE.LineBasicMaterial | null = null;
    let work: THREE.Mesh | null = null;

    if (!allNext) {
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.position.y = 0.06;
      group.add(slab);
    }

    if (hasDone) {
      // glass core with lit windows on all four faces, for the completed columns
      const core = new THREE.Mesh(new THREE.BoxGeometry(W, H - 0.12, W), glassMat);
      core.position.y = 0.12 + (H - 0.12) / 2;
      group.add(core);
      const doneCols = kinds.map((k, c) => (k === "done" ? c : -1)).filter((c) => c >= 0);
      winMat = new THREE.MeshBasicMaterial({ toneMapped: false, vertexColors: false });
      const inst = new THREE.InstancedMesh(winGeo, winMat, doneCols.length * 4);
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const col = new THREE.Color();
      let n = 0;
      for (let face = 0; face < 4; face++) {
        const ang = (face * Math.PI) / 2;
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), ang);
        for (const c of doneCols) {
          const along = -W / 2 + (c + 0.5) * (W / PER);
          const local = new THREE.Vector3(along, 0.12 + (H - 0.12) / 2, W / 2 + 0.012).applyQuaternion(q);
          m.compose(local, q, new THREE.Vector3(1, 1, 1));
          inst.setMatrixAt(n, m);
          const glowAmt = 0.55 + r() * 0.45;
          const curtain = r() < 0.25;
          if (curtain) col.setRGB(0.62 * glowAmt, 0.36 * glowAmt, 0.17 * glowAmt);
          else col.setRGB(1.15 * glowAmt, 0.72 * glowAmt, 0.38 * glowAmt);
          inst.setColorAt(n, col);
          n++;
        }
      }
      inst.instanceMatrix.needsUpdate = true;
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
      group.add(inst);
    }

    if (hasNow) {
      // exposed structure: corner columns, a scaffold cage and a work light
      for (const [x, z] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ]) {
        const colM = new THREE.Mesh(new THREE.BoxGeometry(0.26, H - 0.12, 0.26), columnMat);
        colM.position.set((x * (W - 0.26)) / 2, 0.12 + (H - 0.12) / 2, (z * (W - 0.26)) / 2);
        group.add(colM);
      }
      const cage = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(W + 0.7, H, W + 0.7)), scaffoldMat);
      cage.position.y = H / 2;
      group.add(cage);
      const diag = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-(W + 0.7) / 2, 0, (W + 0.7) / 2),
        new THREE.Vector3((W + 0.7) / 2, H, (W + 0.7) / 2),
        new THREE.Vector3((W + 0.7) / 2, 0, -(W + 0.7) / 2),
        new THREE.Vector3((W + 0.7) / 2, H, (W + 0.7) / 2),
      ]);
      group.add(new THREE.LineSegments(diag, scaffoldMat));
      if (f % 2 === 0) {
        work = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.1, 0.5), toneMapped: false }));
        work.position.set(W / 2 - 0.4, H * 0.55, W / 2 + 0.05);
        group.add(work);
      }
    }

    if (allNext) {
      // ghost glass with blueprint edges
      ghostMat = new THREE.MeshStandardMaterial({ color: "#8aa0f0", transparent: true, opacity: 0.07, roughness: 0.2, depthWrite: false });
      const ghost = new THREE.Mesh(new THREE.BoxGeometry(W, H, W), ghostMat);
      ghost.position.y = H / 2;
      group.add(ghost);
      edgeMat = new THREE.LineBasicMaterial({ color: "#8aa0f0", transparent: true, opacity: 0.8 });
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(W, H, W)), edgeMat);
      edges.position.y = H / 2;
      group.add(edges);
      // window outlines on the front faces
      const pts: THREE.Vector3[] = [];
      for (let c = 0; c < PER; c++) {
        const x0 = -W / 2 + c * (W / PER) + 0.13;
        const x1 = x0 + W / PER - 0.26;
        const y0 = H * 0.2;
        const y1 = H * 0.8;
        for (const z of [W / 2 + 0.01, -W / 2 - 0.01]) {
          pts.push(new THREE.Vector3(x0, y0, z), new THREE.Vector3(x1, y0, z), new THREE.Vector3(x1, y0, z), new THREE.Vector3(x1, y1, z));
          pts.push(new THREE.Vector3(x1, y1, z), new THREE.Vector3(x0, y1, z), new THREE.Vector3(x0, y1, z), new THREE.Vector3(x0, y0, z));
        }
      }
      group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), edgeMat));
    }

    group.scale.y = 0.0001;
    group.visible = false;
    spin.add(group);
    floors.push({ group, rise: 0, kinds, winMat, ghostMat, edgeMat, work });
  }

  // hoist running up the side of the floors under way
  const [nowA, nowB] = BANDS.now;
  const rail = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, (nowB - nowA + 1) * H, 0.08),
    new THREE.MeshStandardMaterial({ color: "#8f99ad", roughness: 0.6 }),
  );
  rail.position.set(W / 2 + 0.75, BASE + ((nowA + nowB) / 2) * H, 0.6);
  spin.add(rail);
  const hoist = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.42), new THREE.MeshStandardMaterial({ color: "#d9a35b", roughness: 0.5 }));
  hoist.position.set(W / 2 + 0.95, BASE + nowA * H, 0.6);
  spin.add(hoist);

  // tower crane on the roof
  const crane = new THREE.Group();
  crane.position.y = TOP;
  const craneMat = new THREE.LineBasicMaterial({ color: "#8aa0f0", transparent: true, opacity: 0.85 });
  const mast = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.45, 5, 0.45)), craneMat);
  mast.position.set(-0.8, 2.5, -0.6);
  crane.add(mast);
  const lattice: THREE.Vector3[] = [];
  for (let k = 0; k < 10; k++) {
    const y0 = k * 0.5;
    lattice.push(new THREE.Vector3(-1.025, y0, -0.375), new THREE.Vector3(-0.575, y0 + 0.5, -0.375));
  }
  crane.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(lattice), craneMat));
  const jib = new THREE.Group();
  jib.position.set(-0.8, 5, -0.6);
  const jibPts = [
    new THREE.Vector3(-2.6, 0, 0),
    new THREE.Vector3(7.5, 0, 0),
    new THREE.Vector3(0, 0.9, 0),
    new THREE.Vector3(7.5, 0, 0),
    new THREE.Vector3(0, 0.9, 0),
    new THREE.Vector3(-2.6, 0, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0.9, 0),
    new THREE.Vector3(5.2, 0, 0),
    new THREE.Vector3(5.2, -2.2, 0),
  ];
  jib.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(jibPts), craneMat));
  const counter = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.5), new THREE.MeshStandardMaterial({ color: "#3a3f48" }));
  counter.position.set(-2.3, -0.2, 0);
  jib.add(counter);
  const tip = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 0.5, 0.2), toneMapped: false });
  const tipM = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), tip);
  tipM.position.set(7.5, 0.05, 0);
  jib.add(tipM);
  crane.add(jib);
  spin.add(crane);

  crane.scale.set(1, 0.0001, 1);
  crane.visible = false;
  rail.visible = false;
  hoist.visible = false;
  return { crane, rail, root, spin, floors, jib, tip, hoist, glow };
}

const BAND_KEYS: RecordGroup[] = ["done", "now", "next"];

function Tower({ reduced }: { reduced: boolean }) {
  const holder = useRef<THREE.Group>(null);
  const tmp = useRef({ v: new THREE.Vector3(), right: new THREE.Vector3(), spinY: 0.6, last: 0 });

  useEffect(() => {
    if (!SCENE) SCENE = build();
    const g = holder.current;
    if (g) g.add(SCENE.root);
    return () => {
      if (g && SCENE) g.remove(SCENE.root);
    };
  }, []);

  useFrame((state, dt) => {
    const sc = SCENE;
    if (!sc) return;
    const t = state.clock.elapsedTime;
    const p = reduced ? 1 : record.p;
    const built = p * (FLOORS + 1.5);
    const k = 1 - Math.exp(-dt * 7);
    const focus = record.focus;

    sc.floors.forEach((fl, f) => {
      const target = clamp(built - f);
      fl.rise += (target - fl.rise) * k;
      fl.group.visible = fl.rise > 0.005;
      fl.group.scale.y = Math.max(0.0001, fl.rise);
      const groupHere = fl.kinds.includes("done") ? "done" : fl.kinds.includes("now") ? "now" : "next";
      const dim = focus && focus !== groupHere ? 0.18 : 1;
      if (fl.winMat) fl.winMat.color.setScalar(dim * (focus === "done" ? 1.25 : 1));
      if (fl.edgeMat) fl.edgeMat.opacity = (focus === "next" ? 1 : 0.8) * dim;
      if (fl.ghostMat) fl.ghostMat.opacity = (focus === "next" ? 0.16 : 0.07) * dim;
      if (fl.work) {
        const blink = Math.sin(t * 4 + f) > 0.2 ? 1 : 0.15;
        (fl.work.material as THREE.MeshBasicMaterial).color.setRGB(1.6 * blink * dim, 1.1 * blink * dim, 0.5 * blink * dim);
      }
    });

    // crane swings, tip lights at the end; hoist rides up and down
    sc.jib.rotation.y = reduced ? 0.6 : 0.6 + Math.sin(t * 0.25) * 0.5;
    const end = clamp((built - FLOORS) / 1.2);
    const tipBlink = end > 0.99 ? 1.6 : Math.sin(t * 3) > 0 ? 1 : 0.3;
    sc.tip.color.setRGB(1.6 * tipBlink, 0.5 * tipBlink, 0.2 * tipBlink);
    const [nowA, nowB] = BANDS.now;
    sc.hoist.position.y = BASE + (nowA + ((Math.sin(t * 0.6) + 1) / 2) * (nowB - nowA)) * H;
    sc.glow.opacity = 0.55 + 0.45 * end;
    // the crane rises once the top floor is drawn; the hoist appears with the floors under way
    const craneT = clamp((built - (FLOORS - 0.6)) / 1.2);
    sc.crane.visible = craneT > 0.01;
    sc.crane.scale.y = Math.max(0.0001, 1 - Math.pow(1 - craneT, 3));
    const hoistOn = built > nowA + 1;
    sc.rail.visible = hoistOn;
    sc.hoist.visible = hoistOn;

    // slow turn, nudged by the cursor
    const tm = tmp.current;
    if (!reduced) tm.spinY += dt * 0.08;
    const targetY = tm.spinY + pointer.x * 0.35;
    sc.spin.rotation.y += (targetY - sc.spin.rotation.y) * (1 - Math.exp(-dt * 3));

    // screen position of each band's right edge, for the leader lines
    if (record.project) {
      const cam = state.camera;
      tm.right.setFromMatrixColumn(cam.matrixWorld, 0).normalize();
      const pts: BandPoint[] = BAND_KEYS.map((g) => {
        const [a, b] = BANDS[g];
        const y = BASE + ((a + Math.min(b, FLOORS)) / 2) * H;
        tm.v.set(0, y, 0).addScaledVector(tm.right, W * 0.78).project(cam);
        const on = clamp((built - a) / Math.max(0.5, b - a));
        return { g, x: (tm.v.x * 0.5 + 0.5) * state.size.width, y: (-tm.v.y * 0.5 + 0.5) * state.size.height, on };
      });
      record.project(pts);
    }
  });

  return <group ref={holder} />;
}

export default function RecordTower({ active, mobile }: { active: boolean; mobile: boolean }) {
  const reduced = prefersReducedMotion();
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={mobile ? [1, 1.5] : [1, 1.75]}
      camera={{ fov: 30, position: mobile ? [31, 19, 45] : [33, 19, 49], near: 0.5, far: 220 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(0, mobile ? 12.4 : 12.2, 0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <ambientLight intensity={0.35} color="#9aa6c8" />
      <directionalLight position={[14, 22, 18]} intensity={1.6} color="#ffd9b0" />
      <directionalLight position={[-18, 10, -14]} intensity={0.9} color="#6f86e0" />
      <pointLight position={[0, 3, 9]} intensity={30} distance={22} color="#f2a65a" />
      <Tower reduced={reduced} />
    </Canvas>
  );
}
