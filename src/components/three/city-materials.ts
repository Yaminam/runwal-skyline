import * as THREE from "three";

/*
  Shader patches for the architectural "clay model" of real Mumbai.
  Buildings stay MeshStandardMaterial (real light + shadows) and get:
   - a rise-from-the-ground intro (per-building delay from aSeed; instanced low-rise and merged towers)
   - procedural windows from world position: a faint grid by day, warm lit panes by night,
     faded to their average with distance so they never shimmer
  The ground stays MeshStandardMaterial and reads the baked OSM texture: real coastline and creeks,
  roads that glow at night, and sage parks / mangroves.
*/

export const cityUniforms = {
  uRise: { value: 0 },
  uNight: { value: 0 },
  uWarm: { value: new THREE.Color("#ffb46a") },
  uSea: { value: new THREE.Color("#c9d3da") },
  uGround: { value: null as THREE.Texture | null },
  /** x0, z0, 1/(x1-x0), 1/(z1-z0) of the ground texture */
  uGB: { value: new THREE.Vector4(-36.89, -60.66, 1 / 92.28, 1 / 103.79) },
  /** 0 until the ground texture has loaded, then fades to 1 */
  uGroundOn: { value: 0 },
};

const HASH = /* glsl */ `
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
`;

type BuildingMode = "instanced" | "merged" | "single";

export function makeBuildingMaterial(opts: { mode: BuildingMode; color?: string; seed?: number; windows?: [number, number] }) {
  const m = new THREE.MeshStandardMaterial({ color: opts.color ?? "#f8f7f4", roughness: 0.9, metalness: 0 });
  const rises = opts.mode !== "single";
  if (opts.mode === "merged") m.defines = { MERGED: "" };
  const win = opts.windows ?? [40, 28];
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uRise = rises ? cityUniforms.uRise : { value: 1 };
    shader.uniforms.uNight = cityUniforms.uNight;
    shader.uniforms.uWarm = cityUniforms.uWarm;
    shader.uniforms.uSeed = { value: opts.seed ?? 0.5 };
    shader.uniforms.uWin = { value: new THREE.Vector2(win[0], win[1]) };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uRise;
varying vec3 vWP; varying vec3 vObjN; varying float vSeed;
#if defined(USE_INSTANCING) || defined(MERGED)
attribute float aSeed;
#else
uniform float uSeed;
#endif`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
#if defined(USE_INSTANCING) || defined(MERGED)
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
vObjN = mat3(instanceMatrix) * normal;
#endif
vWP = (modelMatrix * wp4).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uNight; uniform vec3 uWarm; uniform vec2 uWin;
varying vec3 vWP; varying vec3 vObjN; varying float vSeed;
${HASH}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
vec3 on = normalize(vObjN);
float side = 1.0 - step(0.5, abs(on.y));
float uu = abs(on.x) > abs(on.z) ? vWP.z : vWP.x;
vec2 cell = vec2(uu * uWin.x, vWP.y * uWin.y);
vec2 fw = fwidth(cell);
float aa = 1.0 - smoothstep(0.3, 0.85, max(fw.x, fw.y));
vec2 fc = fract(cell);
float winSharp = step(0.16, fc.x) * step(fc.x, 0.84) * step(0.3, fc.y) * step(fc.y, 0.8);
float win = mix(0.33, winSharp, aa) * side * step(0.012, vWP.y);
float hh = h21(floor(cell) + vSeed * 37.0);
diffuseColor.rgb *= 1.0 - win * mix(0.06, 0.5, uNight);
float litSharp = winSharp * step(0.66, hh) * (0.25 + pow(hh, 3.0) * 1.6);
float lit = mix(0.1, litSharp, aa) * side * step(0.012, vWP.y);`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
totalEmissiveRadiance += uWarm * lit * uNight;`,
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
    shader.uniforms.uGround = cityUniforms.uGround;
    shader.uniforms.uGB = cityUniforms.uGB;
    shader.uniforms.uGroundOn = cityUniforms.uGroundOn;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>
varying vec3 vGP;`)
      .replace("#include <project_vertex>", `#include <project_vertex>
vGP = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uNight; uniform vec3 uWarm; uniform vec3 uSea;
uniform sampler2D uGround; uniform vec4 uGB; uniform float uGroundOn;
varying vec3 vGP;`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
vec2 guv = vec2((vGP.x - uGB.x) * uGB.z, (vGP.z - uGB.y) * uGB.w);
vec3 gt = texture2D(uGround, clamp(guv, 0.0005, 0.9995)).rgb;
float L = mix(1.0, smoothstep(0.3, 0.7, gt.r), uGroundOn);
float road = gt.g * uGroundOn;
float nat = gt.b * uGroundOn;
float shore = (1.0 - smoothstep(0.0, 0.45, abs(L - 0.5))) * uGroundOn;
diffuseColor.rgb *= 1.0 - road * 0.12 * L * (1.0 - uNight);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.80, 0.84, 0.76), nat * 0.38 * L);
diffuseColor.rgb = mix(uSea, diffuseColor.rgb, L);
diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.84, shore * 0.6);`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
roughnessFactor = mix(0.38, roughnessFactor, L);`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
totalEmissiveRadiance += uWarm * pow(road, 1.8) * uNight * 0.32;
totalEmissiveRadiance += vec3(0.95, 0.65, 0.35) * shore * uNight * 0.16;`,
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
