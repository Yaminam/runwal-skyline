import * as THREE from "three";

/*
  Real Mumbai, baked from OpenStreetMap (via OpenFreeMap z14 vector tiles) by
  _tools/realcity/{fetch,extract}.mjs + bake.py into /public/data:
    mumbai-city.bin / mumbai-city-lite.bin   buildings (tall true footprints + low-rise oriented boxes)
    mumbai-ground.png (+ .json bounds)       R land, G roads, B nature
  Model units: x = (lon - 72.87) * 200, z = -(lat - 19.07) * 200 (1 unit ~ 550 m).
*/

export const Q = 300; // quantisation steps per model unit
/** Vertical exaggeration so the skyline reads at city scale. */
export const VERT = 6.5;
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
  if (hdr[0] !== 0x52574c31) throw new Error("Unexpected city data");
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

/**
 * Tall buildings as one merged, flat-shaded geometry: extruded walls + triangulated roofs.
 * Towers are inflated around their centroid (up to 1.65x) so they keep a believable silhouette
 * against the exaggerated heights.
 */
export function buildTallGeometry(bin: CityBin) {
  // count vertices first
  let verts = 0;
  for (let i = 0; i < bin.nTall; i++) {
    const n = bin.tallN[i];
    verts += n * 6 + Math.max(0, n - 2) * 3;
  }
  const position = new Float32Array(verts * 3);
  const normal = new Float32Array(verts * 3);
  const seed = new Float32Array(verts);
  let v = 0;
  let c = 0;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const d = new THREE.Vector3();
  const e1 = new THREE.Vector3();
  const e2 = new THREE.Vector3();
  const fn = new THREE.Vector3();

  const tri = (p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, n: THREE.Vector3, s: number) => {
    e1.subVectors(p1, p0);
    e2.subVectors(p2, p0);
    fn.crossVectors(e1, e2);
    const flip = fn.dot(n) < 0;
    const pts = flip ? [p0, p2, p1] : [p0, p1, p2];
    for (const p of pts) {
      position[v * 3] = p.x;
      position[v * 3 + 1] = p.y;
      position[v * 3 + 2] = p.z;
      normal[v * 3] = n.x;
      normal[v * 3 + 1] = n.y;
      normal[v * 3 + 2] = n.z;
      seed[v] = s;
      v++;
    }
  };

  const contour: THREE.Vector2[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  const wn = new THREE.Vector3();
  const t0 = new THREE.Vector3();
  const t1 = new THREE.Vector3();
  const t2 = new THREE.Vector3();
  for (let i = 0; i < bin.nTall; i++) {
    const n = bin.tallN[i];
    const hM = bin.tallH[i] / 10;
    const s = seedOf(i);
    const top = metresToUnits(hM) * (1 + s * 0.02);
    const base = metresToUnits(bin.tallMin[i] / 10);
    const inflate = 1 + 0.65 * THREE.MathUtils.clamp((hM - 40) / 160, 0, 1);
    let cx = 0;
    let cz = 0;
    for (let k = 0; k < n; k++) {
      cx += bin.xy[(c + k) * 2] / Q;
      cz += bin.xy[(c + k) * 2 + 1] / Q;
    }
    cx /= n;
    cz /= n;
    contour.length = 0;
    let area = 0;
    for (let k = 0; k < n; k++) {
      const x = cx + (bin.xy[(c + k) * 2] / Q - cx) * inflate;
      const z = cz + (bin.xy[(c + k) * 2 + 1] / Q - cz) * inflate;
      contour.push(new THREE.Vector2(x, z));
    }
    for (let k = 0; k < n; k++) {
      const p = contour[k];
      const q = contour[(k + 1) % n];
      area += p.x * q.y - q.x * p.y;
    }
    const ccw = area > 0;
    // walls
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
    // roof
    const faces = n >= 3 ? THREE.ShapeUtils.triangulateShape(contour, []) : [];
    for (const f of faces) {
      t0.set(contour[f[0]].x, top, contour[f[0]].y);
      t1.set(contour[f[1]].x, top, contour[f[1]].y);
      t2.set(contour[f[2]].x, top, contour[f[2]].y);
      tri(t0, t1, t2, up, s);
    }
    c += n;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(position.subarray(0, v * 3), 3));
  g.setAttribute("normal", new THREE.BufferAttribute(normal.subarray(0, v * 3), 3));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seed.subarray(0, v), 1));
  g.computeBoundingSphere();
  return g;
}

/** Low-rise as instance transforms for a unit box (base at y=0). */
export function lowRiseMatrices(bin: CityBin) {
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const p = new THREE.Vector3();
  const sc = new THREE.Vector3();
  const matrices = new Float32Array(bin.nLow * 16);
  const seeds = new Float32Array(bin.nLow);
  for (let i = 0; i < bin.nLow; i++) {
    const s = seedOf(i + 7919);
    const w = bin.meta[i * 4] * 0.002;
    const dd = bin.meta[i * 4 + 1] * 0.002;
    const ang = (bin.meta[i * 4 + 2] / 255) * Math.PI;
    const hM = bin.meta[i * 4 + 3] / 10;
    // most OSM footprints carry no height tag (5 m default): vary them a little so the fabric isn't flat
    const h = metresToUnits(hM) * (0.75 + s * 0.9);
    p.set(bin.pos[i * 2] / Q, 0, bin.pos[i * 2 + 1] / Q);
    q.setFromAxisAngle(yAxis, -ang);
    sc.set(Math.max(w, 0.006), h, Math.max(dd, 0.006));
    m.compose(p, q, sc);
    m.toArray(matrices, i * 16);
    seeds[i] = s;
  }
  return { matrices, seeds };
}
