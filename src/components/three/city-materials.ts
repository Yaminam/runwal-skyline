import * as THREE from "three";

/*
  Shader patches for the architectural "clay model" city.
  Buildings stay MeshStandardMaterial (real light + shadows) and get:
   - a rise-from-the-ground intro (instanced only, per-building delay from aSeed)
   - procedural windows from world position: a faint grid by day, warm lit panes by night
  The ground stays MeshStandardMaterial and paints the Mumbai coastline (sea vs land),
  a street grid that glows faintly at night, and a glossier sea.
*/

export const cityUniforms = {
  uRise: { value: 0 },
  uNight: { value: 0 },
  uWarm: { value: new THREE.Color("#ffb46a") },
  uSea: { value: new THREE.Color("#c9d3da") },
};

// Same land mask is mirrored in JS (landAt) for building placement.
const LAND_GLSL = /* glsl */ `
float coastW(float z){ return -12.5 + 1.2 * sin(z * 0.21) - 4.0 * exp(-pow((z - 24.0) / 3.5, 2.0)); }
float landMask(vec2 p){
  float x = p.x; float z = p.y;
  float m = smoothstep(-0.15, 0.15, x - coastW(z));
  m *= 1.0 - smoothstep(35.5, 36.0, z);
  float east = 7.0 - (z + 4.0) * 0.42;
  float harb = smoothstep(-0.15, 0.15, east - x);
  m *= mix(1.0, harb, smoothstep(-4.5, -3.5, z));
  float cx = 12.0 + (-4.0 - z) * 0.75;
  float creek = smoothstep(1.6, 1.9, abs(x - cx));
  m *= mix(creek, 1.0, smoothstep(-4.5, -3.5, z));
  return m;
}
`;

export function coastW(z: number) {
  return -12.5 + 1.2 * Math.sin(z * 0.21) - 4.0 * Math.exp(-Math.pow((z - 24) / 3.5, 2));
}

/** true when (x, z) is solid ground with a margin, mirroring landMask() */
export function landAt(x: number, z: number, margin = 0.6) {
  if (x - coastW(z) < margin) return false;
  if (z > 35.5 - margin) return false;
  if (z > -4) {
    const east = 7 - (z + 4) * 0.42;
    if (east - x < margin) return false;
  } else {
    const cx = 12 + (-4 - z) * 0.75;
    if (Math.abs(x - cx) < 1.9 + margin) return false;
  }
  return true;
}

const HASH = /* glsl */ `
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
`;

export function makeBuildingMaterial(opts: { instanced: boolean; color?: string; seed?: number }) {
  const m = new THREE.MeshStandardMaterial({ color: opts.color ?? "#f8f7f4", roughness: 0.9, metalness: 0 });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uRise = opts.instanced ? cityUniforms.uRise : { value: 1 };
    shader.uniforms.uNight = cityUniforms.uNight;
    shader.uniforms.uWarm = cityUniforms.uWarm;
    shader.uniforms.uSeed = { value: opts.seed ?? 0.5 };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uRise;
varying vec3 vWP; varying vec3 vObjN; varying float vSeed;
#ifdef USE_INSTANCING
attribute float aSeed;
#else
uniform float uSeed;
#endif`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
#ifdef USE_INSTANCING
float seed = aSeed;
#else
float seed = uSeed;
#endif
vSeed = seed;
float rr = clamp(uRise * 1.7 - seed * 0.7, 0.0, 1.0);
rr = 1.0 - pow(1.0 - rr, 3.0);
transformed.y *= max(rr, 0.002);
vObjN = normal;`,
      )
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
uniform float uNight; uniform vec3 uWarm;
varying vec3 vWP; varying vec3 vObjN; varying float vSeed;
${HASH}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
float side = 1.0 - step(0.5, abs(vObjN.y));
float uu = abs(vObjN.x) > 0.5 ? vWP.z : vWP.x;
vec2 cell = vec2(uu * 3.6, vWP.y * 2.5);
vec2 fc = fract(cell);
float win = step(0.16, fc.x) * step(fc.x, 0.84) * step(0.32, fc.y) * step(fc.y, 0.8) * side * step(0.4, vWP.y);
float hh = h21(floor(cell) + vSeed * 37.0);
diffuseColor.rgb *= 1.0 - win * mix(0.06, 0.5, uNight);
float lit = win * step(0.66, hh);`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
totalEmissiveRadiance += uWarm * lit * uNight * (0.25 + pow(hh, 3.0) * 1.6);`,
      );
  };
  return m;
}

/** Depth material that applies the same rise, so shadows grow with the buildings. */
export function makeRiseDepthMaterial() {
  const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uRise = cityUniforms.uRise;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uRise;
attribute float aSeed;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
float rr = clamp(uRise * 1.7 - aSeed * 0.7, 0.0, 1.0);
rr = 1.0 - pow(1.0 - rr, 3.0);
transformed.y *= max(rr, 0.002);`,
      );
  };
  return m;
}

export function makeGroundMaterial() {
  const m = new THREE.MeshStandardMaterial({ color: "#ebe8e2", roughness: 0.95, metalness: 0 });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uNight = cityUniforms.uNight;
    shader.uniforms.uWarm = cityUniforms.uWarm;
    shader.uniforms.uSea = cityUniforms.uSea;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vGP;`)
      .replace("#include <project_vertex>", `#include <project_vertex>\nvGP = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uNight; uniform vec3 uWarm; uniform vec3 uSea;
varying vec3 vGP;
${HASH}
${LAND_GLSL}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
float L = landMask(vGP.xz);
float fx = fract(vGP.x / 3.2); float fz = fract(vGP.z / 3.2);
float road = max(step(fx, 0.19), step(fz, 0.19));
float dl = min(abs(fx - 0.095), abs(fz - 0.095));
float line = (1.0 - smoothstep(0.0, 0.016, dl)) * step(0.45, h21(floor(vGP.xz / 3.2) + 7.0));
float shore = 1.0 - smoothstep(0.0, 0.5, abs(L - 0.5));
diffuseColor.rgb *= 1.0 - road * 0.06 * L;
diffuseColor.rgb = mix(uSea, diffuseColor.rgb, L);
diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.82, shore * 0.6);`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
roughnessFactor = mix(0.38, roughnessFactor, L);`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
totalEmissiveRadiance += uWarm * line * L * uNight * 0.16;
totalEmissiveRadiance += vec3(0.95, 0.65, 0.35) * shore * uNight * 0.18;`,
      );
  };
  return m;
}

export const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main(){
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const SKY_FRAG = /* glsl */ `
uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uGlow; uniform vec3 uSunDir;
uniform float uGlowAmt; uniform float uStars;
varying vec3 vDir;
${HASH}
void main(){
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col = mix(uHorizon, uTop, smoothstep(-0.02, 0.55, h));
  float g = pow(max(dot(d, normalize(uSunDir)), 0.0), 6.0);
  col += uGlow * g * uGlowAmt;
  col += uGlow * pow(max(dot(d, normalize(uSunDir)), 0.0), 60.0) * uGlowAmt * 1.4;
  vec2 sp = floor(vec2(atan(d.z, d.x) * 320.0, h * 320.0));
  float s = step(0.9975, h21(sp)) * smoothstep(0.08, 0.45, h);
  col += vec3(s) * uStars * (0.5 + 0.5 * h21(sp + 3.1));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export const BEAM_VERT = /* glsl */ `
varying float vY;
void main(){
  vY = uv.y;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const BEAM_FRAG = /* glsl */ `
uniform vec3 uColor; uniform float uAmt;
varying float vY;
void main(){
  float a = pow(1.0 - vY, 2.2) * uAmt;
  gl_FragColor = vec4(uColor * a, a);
}
`;
