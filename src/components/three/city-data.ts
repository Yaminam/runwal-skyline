import * as THREE from "three";

/*
  Real Mumbai, baked from OpenStreetMap (via OpenFreeMap z14 vector tiles) by
  _tools/realcity/{fetch,extract}.mjs + bake2.py into /public/data:
    mumbai-city2.bin / mumbai-city2-lite.bin  buildings (towers >= 30 m as true footprints + oriented boxes)
                                             heights: OSM tags where present, else estimated from footprint
                                             area and local density (bake2.py)
    mumbai-ground.png (+ .json bounds)       R land, G roads, B nature
    mumbai-sat.webp / mumbai-sat-lite.webp   Sentinel-2 cloudless 2024 (EOX), reprojected to the same grid
  Model units: x = (lon - 72.87) * 200, z = -(lat - 19.07) * 200 (1 unit ~ 550 m).
*/

export const Q = 300; // quantisation steps per model unit
/** Near-real proportions: the satellite ground makes scale obvious, so only a light lift. */
export const VERT = 1.4;
export const metresToUnits = (m: number) => (m / 550) * VERT;

export type CityBin = {
  nTall: number;
  tallN: Uint16Array;
  tallH: Uint16Array;
  tallMin: Uint16Array;
  xy: Int16Array;
  nLow: number;
  pos: Int16Array;
  meta: Uint8Array;
};

export function parseCity(buf: ArrayBuffer): CityBin {
  const hdr = new Uint32Array(buf, 0, 4);
  if (hdr[0] !== 0x52574c32) throw new Error("Unexpected city data");
  const nTall = hdr[1];
  const nCoord = hdr[2];
  const nLow = hdr[3];
  let o = 16;
  const tallN = new Uint16Array(buf, o, nTall);
  o += nTall * 2;
  const tallH = new Uint16Array(buf, o, nTall);
  o += nTall * 2;
  const tallMin = new Uint16Array(buf, o, nTall);
  o += nTall * 2;
  o = (o + 3) & ~3;
  const xy = new Int16Array(buf, o, nCoord * 2);
  o += nCoord * 4;
  o = (o + 3) & ~3;
  const pos = new Int16Array(buf, o, nLow * 2);
  o += nLow * 4;
  o = (o + 3) & ~3;
  const meta = new Uint8Array(buf, o, nLow * 4);
  return { nTall, tallN, tallH, tallMin, xy, nLow, pos, meta };
}

export const seedOf = (i: number) => {
  const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};

/** Chunk grid (model units): towers and low-rise are split so off-screen chunks are culled. */
export const CHUNK = 9;
const chunkKey = (x: number, z: number) => `${Math.floor(x / CHUNK)},${Math.floor(z / CHUNK)}`;

/**
 * Tall buildings (true OSM footprints) as merged, flat-shaded geometry per chunk: extruded walls +
 * triangulated roofs, with per-vertex seed and real height (metres) for the facade shader.
 */
export function buildTallGeometry(bin: CityBin): THREE.BufferGeometry[] {
  // pass 1: chunk + vertex count per building
  const starts = new Uint32Array(bin.nTall);
  const keys: string[] = new Array(bin.nTall);
  const counts = new Map<string, number>();
  let c0 = 0;
  for (let i = 0; i < bin.nTall; i++) {
    const n = bin.tallN[i];
    let cx = 0;
    let cz = 0;
    for (let k = 0; k < n; k++) {
      cx += bin.xy[(c0 + k) * 2] / Q;
      cz += bin.xy[(c0 + k) * 2 + 1] / Q;
    }
    const key = chunkKey(cx / n, cz / n);
    keys[i] = key;
    starts[i] = c0;
    counts.set(key, (counts.get(key) ?? 0) + n * 6 + Math.max(0, n - 2) * 3);
    c0 += n;
  }
  type Buf = { position: Float32Array; normal: Float32Array; seed: Float32Array; height: Float32Array; v: number };
  const bufs = new Map<string, Buf>();
  for (const [key, verts] of counts) {
    bufs.set(key, { position: new Float32Array(verts * 3), normal: new Float32Array(verts * 3), seed: new Float32Array(verts), height: new Float32Array(verts), v: 0 });
  }

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const d = new THREE.Vector3();
  const e1 = new THREE.Vector3();
  const e2 = new THREE.Vector3();
  const fn = new THREE.Vector3();
  let cur: Buf;
  let hCur = 0;
  const tri = (p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, n: THREE.Vector3, s: number) => {
    e1.subVectors(p1, p0);
    e2.subVectors(p2, p0);
    fn.crossVectors(e1, e2);
    const pts = fn.dot(n) < 0 ? [p0, p2, p1] : [p0, p1, p2];
    for (const p of pts) {
      const v = cur.v++;
      cur.position[v * 3] = p.x;
      cur.position[v * 3 + 1] = p.y;
      cur.position[v * 3 + 2] = p.z;
      cur.normal[v * 3] = n.x;
      cur.normal[v * 3 + 1] = n.y;
      cur.normal[v * 3 + 2] = n.z;
      cur.seed[v] = s;
      cur.height[v] = hCur;
    }
  };

  const contour: THREE.Vector2[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  const wn = new THREE.Vector3();
  const t0 = new THREE.Vector3();
  const t1 = new THREE.Vector3();
  const t2 = new THREE.Vector3();
  for (let i = 0; i < bin.nTall; i++) {
    cur = bufs.get(keys[i])!;
    const c = starts[i];
    const n = bin.tallN[i];
    const hM = bin.tallH[i] / 10;
    const s = seedOf(i);
    const top = metresToUnits(hM) * (1 + s * 0.02);
    const base = metresToUnits(bin.tallMin[i] / 10);
    hCur = hM;
    contour.length = 0;
    let area = 0;
    for (let k = 0; k < n; k++) contour.push(new THREE.Vector2(bin.xy[(c + k) * 2] / Q, bin.xy[(c + k) * 2 + 1] / Q));
    for (let k = 0; k < n; k++) {
      const p = contour[k];
      const q = contour[(k + 1) % n];
      area += p.x * q.y - q.x * p.y;
    }
    const ccw = area > 0;
    for (let k = 0; k < n; k++) {
      const p = contour[k];
      const q = contour[(k + 1) % n];
      const dx = q.x - p.x;
      const dz = q.y - p.y;
      const len = Math.hypot(dx, dz) || 1;
      if (ccw) wn.set(dz / len, 0, -dx / len);
      else wn.set(-dz / len, 0, dx / len);
      a.set(p.x, base, p.y);
      b.set(q.x, base, q.y);
      d.set(q.x, top, q.y);
      tri(a, b, d, wn, s);
      a.set(p.x, base, p.y);
      d.set(q.x, top, q.y);
      b.set(p.x, top, p.y);
      tri(a, d, b, wn, s);
    }
    const faces = n >= 3 ? THREE.ShapeUtils.triangulateShape(contour, []) : [];
    for (const f of faces) {
      t0.set(contour[f[0]].x, top, contour[f[0]].y);
      t1.set(contour[f[1]].x, top, contour[f[1]].y);
      t2.set(contour[f[2]].x, top, contour[f[2]].y);
      tri(t0, t1, t2, up, s);
    }
  }
  const out: THREE.BufferGeometry[] = [];
  for (const bf of bufs.values()) {
    if (!bf.v) continue;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(bf.position.subarray(0, bf.v * 3), 3));
    g.setAttribute("normal", new THREE.BufferAttribute(bf.normal.subarray(0, bf.v * 3), 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(bf.seed.subarray(0, bf.v), 1));
    g.setAttribute("aH", new THREE.BufferAttribute(bf.height.subarray(0, bf.v), 1));
    g.computeBoundingSphere();
    out.push(g);
  }
  return out;
}

export type LowChunk = { matrices: Float32Array; seeds: Float32Array; centre: THREE.Vector3; radius: number };

/** Low-rise as instance transforms for a unit box (base at y=0), split per chunk. */
export function lowRiseMatrices(bin: CityBin): LowChunk[] {
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const p = new THREE.Vector3();
  const sc = new THREE.Vector3();
  const idx = new Map<string, number[]>();
  for (let i = 0; i < bin.nLow; i++) {
    const key = chunkKey(bin.pos[i * 2] / Q, bin.pos[i * 2 + 1] / Q);
    let l = idx.get(key);
    if (!l) idx.set(key, (l = []));
    l.push(i);
  }
  const out: LowChunk[] = [];
  for (const list of idx.values()) {
    const matrices = new Float32Array(list.length * 16);
    const seeds = new Float32Array(list.length);
    const box = new THREE.Box3();
    list.forEach((i, j) => {
      const w = bin.meta[i * 4] * 0.002;
      const dd = bin.meta[i * 4 + 1] * 0.002;
      const ang = (bin.meta[i * 4 + 2] / 255) * Math.PI;
      const hM = bin.meta[i * 4 + 3] / 4; // 0.25 m steps; untagged heights were estimated in the bake
      p.set(bin.pos[i * 2] / Q, 0, bin.pos[i * 2 + 1] / Q);
      q.setFromAxisAngle(yAxis, -ang);
      sc.set(Math.max(w, 0.006), metresToUnits(hM), Math.max(dd, 0.006));
      m.compose(p, q, sc);
      m.toArray(matrices, j * 16);
      seeds[j] = seedOf(i + 7919);
      box.expandByPoint(p);
    });
    const centre = box.getCenter(new THREE.Vector3());
    out.push({ matrices, seeds, centre, radius: box.getSize(new THREE.Vector3()).length() / 2 + 0.2 });
  }
  return out;
}
